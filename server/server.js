// server/server.js
// Express proxy — keeps your Groq API key hidden & provides OpenAI-compatible chat responses

import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

console.log("Loaded GROQ_API_KEY?", process.env.GROQ_API_KEY ? "YES" : "NO");

const app = express();
app.use(express.json({ limit: "2mb" }));

// CORS configuration - allow all origins for now
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));  

// ----------------------------
// ENV & KEY CHECK
// ----------------------------
const GROQ_BASE = "https://api.groq.com/openai/v1";
const GROQ_KEY = process.env.GROQ_API_KEY;

if (!GROQ_KEY) {
  console.error("❌ ERROR: GROQ_API_KEY missing in .env");
  process.exit(1);
}

console.log("✅ Groq key loaded");

// ----------------------------
// SIMPLE RATE LIMITING (GLOBAL, IN-MEMORY)
// ----------------------------
const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60;  // max requests per window
let recentRequests = [];

function isRateLimited() {
  const now = Date.now();
  // Drop old timestamps
  recentRequests = recentRequests.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }
  recentRequests.push(now);
  return false;
}

// ----------------------------
// GROQ CALL WITH RETRIES
// ----------------------------
async function callGroqWithRetries(payload, maxRetries = 2) {
  let lastError;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(`${GROQ_BASE}/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${GROQ_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        return response;
      }

      const errText = await response.text();
      console.error("❌ Groq error:", response.status, errText);

      lastError = new Error(`Groq API error ${response.status}: ${errText}`);

      // Retry on 5xx and 429, otherwise fail immediately
      if (response.status >= 500 || response.status === 429) {
        if (attempt < maxRetries) {
          const delay = 500 * Math.pow(2, attempt); // simple backoff
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      } else {
        throw lastError;
      }
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = 500 * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
    }
  }
  throw lastError;
}

// ----------------------------
// HEALTH CHECK ENDPOINT
// ----------------------------
app.get('/health', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ----------------------------
// MAIN ANSWER ROUTE
// ----------------------------
app.post("/api/answer", async (req, res) => {
  // Set CORS headers explicitly
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  try {
    if (isRateLimited()) {
      return res.status(429).json({
        error: "Rate limit exceeded. Please slow down your requests.",
      });
    }

    const {
      question,
      topChunks = [],
      emotion = "neutral",
      max_tokens = 600
    } = req.body;

    // Build context block if document chunks are provided
    let contextText = '';
    let hasDocument = topChunks && topChunks.length > 0;
    
    if (hasDocument) {
      contextText = topChunks
        .map((c, i) => `### Chunk ${i + 1}\n${c}`)
        .join("\n\n");
    }

    // Build system prompt based on whether document context is available
    let systemPrompt;
    if (hasDocument) {
      systemPrompt = `
You are an empathetic AI Learning Assistant integrated into an interactive web-based learning dashboard.

CONTEXT: You are helping students learn through a modern web application that features:
- Real-time emotion detection via webcam to adapt your teaching style
- Document upload capabilities for context-aware learning
- Progress tracking and analytics
- An intuitive chat interface for natural conversation

Your role is to:
1. Use the provided document context to answer questions accurately
2. Supplement with your general knowledge when helpful
3. Adapt your teaching style based on the student's detected emotion
4. Provide clear, educational responses that help students learn effectively

EMOTION-BASED TONE ADJUSTMENT:
- "happy" / "neutral": Be concise, clear, and encouraging
- "sad" / "fearful": Be gentle, patient, and supportive with step-by-step explanations
- "confused": Break down concepts into simpler parts, use examples

DOCUMENT CONTEXT:
${contextText}
      `.trim();
    } else {
      systemPrompt = `
You are an empathetic AI Learning Assistant integrated into an interactive web-based learning dashboard.

CONTEXT: You are helping students learn through a modern web application that features:
- Real-time emotion detection via webcam to adapt your teaching style
- Document upload capabilities for context-aware learning
- Progress tracking and analytics
- An intuitive chat interface for natural conversation

Your role is to:
1. Answer questions using your general knowledge
2. Adapt your teaching style based on the student's detected emotion
3. Provide clear, educational responses that help students learn effectively
4. Encourage students to upload documents for more context-specific help

EMOTION-BASED TONE ADJUSTMENT:
- "happy" / "neutral": Be concise, clear, and encouraging
- "sad" / "fearful": Be gentle, patient, and supportive with step-by-step explanations
- "confused": Break down concepts into simpler parts, use examples

Feel free to suggest uploading relevant documents if that would help answer their questions better.
      `.trim();
    }

    const messages = [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: `User question: ${question}\nDetected emotion: ${emotion}`
      }
    ];

    
    const payload = {
      model: "llama-3.1-8b-instant",
      messages,
      max_tokens
    };
    // ----------------------------
    // CALL GROQ API
    // ----------------------------
    const response = await callGroqWithRetries(payload);

    if (!response.ok) {
      const errText = await response.text();
      console.error("❌ Groq error:", response.status, errText);
      return res.status(500).json({
        error: "Groq API error",
        status: response.status,
        details: errText
      });
    }

    const data = await response.json();

    // Ensure consistent output shape
    let safeText = "No response";
    try {
      safeText =
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.text ??
        JSON.stringify(data);
    } catch (err) {
      console.error("Response parsing error:", err);
    }

    // Return exact OpenAI-style shape
    return res.json({
      choices: [
        {
          message: { content: safeText }
        }
      ]
    });

  } catch (err) {
    console.error("❌ SERVER ERROR:", err);
    return res.status(500).json({ error: String(err) });
  }
});

// ----------------------------
// START SERVER
// ----------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
