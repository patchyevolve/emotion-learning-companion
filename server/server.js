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
app.use(cors());  

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
You are an empathetic AI tutor.
Use the provided document context to answer user questions accurately.
You can also use your general knowledge to supplement the document context when helpful.
Adjust tone based on detected emotion:
- "happy" / "neutral": concise and clear
- "sad" / "fearful" / "confused": gentle, step-by-step, supportive
If the document context doesn't fully answer the question, use your general knowledge to provide a complete answer.

DOCUMENT CONTEXT:
${contextText}
      `.trim();
    } else {
      systemPrompt = `
You are an empathetic AI tutor.
Answer user questions using your general knowledge.
Adjust tone based on detected emotion:
- "happy" / "neutral": concise and clear
- "sad" / "fearful" / "confused": gentle, step-by-step, supportive
Provide helpful, accurate, and educational responses.
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
