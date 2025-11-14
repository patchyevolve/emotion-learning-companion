# System Architecture Diagrams

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Home Page   │  │ Chat Dashboard│  │ Analytics Dashboard  │  │
│  │  (Landing)   │  │  (Main App)   │  │   (Insights)         │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT-SIDE PROCESSING                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Application Modules                      │   │
│  │  ┌────────┐  ┌────────┐  ┌────────┐  ┌──────────────┐  │   │
│  │  │  App   │  │  Chat  │  │  RAG   │  │   Emotion    │  │   │
│  │  │Manager │  │Manager │  │ System │  │   Detector   │  │   │
│  │  └────────┘  └────────┘  └────────┘  └──────────────┘  │   │
│  │  ┌────────┐  ┌──────────────┐  ┌──────────────────┐   │   │
│  │  │   UI   │  │   Document   │  │    Utilities     │   │   │
│  │  │Manager │  │  Processor   │  │  (Math, Colors)  │   │   │
│  │  └────────┘  └──────────────┘  └──────────────────┘   │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                    │
│  ┌──────────────────────────▼────────────────────────────────┐  │
│  │              Machine Learning Models                       │  │
│  │  ┌──────────────────┐      ┌──────────────────────────┐  │  │
│  │  │   Face-API.js    │      │    Transformers.js       │  │  │
│  │  │  • TinyFace      │      │  • MiniLM Embeddings     │  │  │
│  │  │  • Landmarks     │      │  • Feature Extraction    │  │  │
│  │  │  • Expressions   │      │  • Semantic Search       │  │  │
│  │  └──────────────────┘      └──────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                    │
│  ┌──────────────────────────▼────────────────────────────────┐  │
│  │                  Local Storage                             │  │
│  │  • Session Analytics (LocalStorage)                       │  │
│  │  • ML Model Cache (IndexedDB)                             │  │
│  │  • Document Embeddings (Memory)                           │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS REST API
                              │ POST /api/answer
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SERVER (Node.js)                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Express Application                      │   │
│  │  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐  │   │
│  │  │   CORS   │  │ Rate Limiter │  │  Request Handler │  │   │
│  │  │Middleware│  │ (60 req/min) │  │  • Validation    │  │   │
│  │  └──────────┘  └──────────────┘  │  • Prompt Build  │  │   │
│  │                                   │  • API Proxy     │  │   │
│  │                                   └──────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    Groq Cloud API                         │   │
│  │              (Llama 3.1-8B Instant Model)                │   │
│  │  • High-performance LLM inference                        │   │
│  │  • OpenAI-compatible API                                 │   │
│  │  • <1 second response time                               │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagrams

### 1. Chat Message Flow

```
┌──────────┐
│   User   │
│  Types   │
│ Question │
└────┬─────┘
     │
     ▼
┌─────────────────┐
│  Chat Manager   │
│  • Capture input│
│  • Display msg  │
└────┬────────────┘
     │
     ├──────────────────────┐
     │                      │
     ▼                      ▼
┌──────────────┐    ┌──────────────┐
│   Emotion    │    │ RAG System   │
│   Detector   │    │ (if doc)     │
│ • Get current│    │ • Search     │
│   emotion    │    │ • Get chunks │
└────┬─────────┘    └────┬─────────┘
     │                   │
     └────────┬──────────┘
              │
              ▼
     ┌────────────────┐
     │  Build Request │
     │  • Question    │
     │  • Chunks      │
     │  • Emotion     │
     └────┬───────────┘
          │
          ▼ POST /api/answer
     ┌────────────────┐
     │     Server     │
     │  • Validate    │
     │  • Build prompt│
     │  • Call Groq   │
     └────┬───────────┘
          │
          ▼
     ┌────────────────┐
     │   Groq API     │
     │  • Process     │
     │  • Generate    │
     └────┬───────────┘
          │
          ▼
     ┌────────────────┐
     │   Response     │
     │  • Parse JSON  │
     │  • Display msg │
     └────────────────┘
```

### 2. Document Indexing Flow

```
┌──────────┐
│   User   │
│  Uploads │
│   File   │
└────┬─────┘
     │
     ▼
┌─────────────────┐
│  UI Manager     │
│  • Show preview │
│  • Store ref    │
└────┬────────────┘
     │
     │ User clicks "Index"
     ▼
┌─────────────────┐
│   Document      │
│   Processor     │
│  • Extract text │
│    (PDF.js)     │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  RAG System     │
│  • Chunk text   │
│    (2000/400)   │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  For each chunk │
│  (batched)      │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│ Transformers.js │
│  • Generate     │
│    embedding    │
│  • 384-dim vec  │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Store in       │
│  Memory         │
│  • Text + Vec   │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Update UI      │
│  • Progress bar │
│  • Status msg   │
└─────────────────┘
```

### 3. Emotion Detection Flow

```
┌──────────┐
│  Webcam  │
│  Stream  │
└────┬─────┘
     │ Every 200ms
     ▼
┌─────────────────┐
│  Face-API.js    │
│  • Detect face  │
│  • Find landmarks│
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Expression Net │
│  • Classify     │
│  • 7 emotions   │
│  • Confidence   │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Smoothing      │
│  • 5-frame avg  │
│  • Reduce noise │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Get Dominant   │
│  • Max score    │
│  • Update UI    │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Store History  │
│  • Last 50      │
│  • Timestamp    │
└────┬────────────┘
     │
     ▼
┌─────────────────┐
│  Notify Chat    │
│  • Current      │
│    emotion      │
└─────────────────┘
```

## Module Interaction Diagram

```
                    ┌─────────────┐
                    │   App.js    │
                    │ (Coordinator)│
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ EmotionDetector│  │  RAGSystem   │  │ ChatManager   │
│               │  │               │  │               │
│ • initialize()│  │ • initialize()│  │ • initialize()│
│ • startDetect │  │ • indexDoc()  │  │ • handleSend()│
│ • getCurrent()│  │ • search()    │  │ • callAPI()   │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  UIManager    │  │   Document    │  │   Utilities   │
│               │  │   Processor   │  │               │
│ • initialize()│  │ • extractText()│  │ • cosineSim() │
│ • togglePanel()│  │ • parsePDF()  │  │ • mapColor()  │
│ • updateUI()  │  │               │  │               │
└───────────────┘  └───────────────┘  └───────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PRODUCTION SETUP                      │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (Static)                     │
│  ┌──────────────────────────────────────────────────┐   │
│  │              Netlify / Vercel                     │   │
│  │  • CDN Distribution                               │   │
│  │  • HTTPS Automatic                                │   │
│  │  • HTML/CSS/JS Files                              │   │
│  │  • ML Models (cached in browser)                  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS API Calls
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  BACKEND (Node.js)                       │
│  ┌──────────────────────────────────────────────────┐   │
│  │         Render / Railway / Fly.io                 │   │
│  │  • Express Server                                 │   │
│  │  • Environment Variables                          │   │
│  │  • Auto-scaling                                   │   │
│  │  • Health Checks                                  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                           │
                           │ HTTPS
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   EXTERNAL SERVICES                      │
│  ┌──────────────────────────────────────────────────┐   │
│  │                  Groq Cloud                       │   │
│  │  • LLM Inference                                  │   │
│  │  • Rate Limiting                                  │   │
│  │  • API Key Auth                                   │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

