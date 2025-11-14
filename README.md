# Emotion-Aware Learning Companion

An AI-powered learning assistant that adapts its responses based on detected emotions and can answer questions from uploaded documents using RAG (Retrieval Augmented Generation).

## Features

- 🤖 **AI Chat**: Chat with AI anytime, with or without documents
- 📄 **Document Q&A**: Upload PDF or TXT files and ask questions
- 😊 **Emotion Detection**: Real-time emotion detection via webcam
- 🎯 **Adaptive Responses**: AI adjusts tone based on your emotions
- 🔍 **RAG System**: Local document indexing and semantic search
- 📊 **Learning Analytics**: Track sessions, messages, emotions, and engagement in a dedicated analytics dashboard

## Quick Start

### Option 1: Double-click to start (Windows)
Simply double-click `start.bat` to start both servers and open the browser automatically.

### Option 2: PowerShell script
Run in PowerShell:
```powershell
.\start.ps1
```

### Option 3: Node.js script
```bash
npm start
```

### Option 4: Manual start
```bash
# Terminal 1 - Backend
cd server
npm start

# Terminal 2 - Frontend
python -m http.server 8080
```

Then open `http://localhost:8080` in your browser.

## Prerequisites

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python** (3.x) - [Download](https://www.python.org/)
- **Groq API Key** - Get one from [Groq](https://console.groq.com/)

## Setup

1. **Install backend dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Configure API key:**
   Create a `.env` file in the `server` directory:
   ```
   GROQ_API_KEY=your_groq_api_key_here
   ```

3. **Start the application:**
   - Double-click `start.bat` (Windows)
   - Or run `npm start`
   - Or run `.\start.ps1` (PowerShell)

## Usage

1. **Chat without document**: Just start typing! The AI will answer using its general knowledge.

2. **Chat with document**:
   - Click the document icon (📄) to open the document panel
   - Upload a PDF or TXT file
   - Click "Index Document" to process it
   - Ask questions - the AI will use both the document and general knowledge

3. **Emotion detection**: The webcam will automatically detect your emotions and the AI will adapt its responses accordingly.

4. **View analytics**: End a session from the chat dashboard or use the navigation to open the analytics page and review your learning statistics and emotion trends.

## Project Structure

```
formulatewsat2/
├── index.html          # Redirects to home.html
├── home.html           # Landing page / product overview
├── chat.html           # Main AI learning dashboard + chat
├── analytics.html      # Learning analytics dashboard
├── styles.css          # Global design system & layout
├── js/                 # Frontend modules
│   ├── app.js          # Main application coordinator
│   ├── chat.js         # Chat management
│   ├── rag.js          # RAG system
│   ├── emotion-detector.js  # Emotion detection
│   ├── ui.js           # UI management
│   ├── document-processor.js # PDF/TXT parsing
│   ├── config.js       # Frontend configuration
│   └── utils.js        # Shared utilities
├── server/             # Backend server
│   ├── server.js       # Express API server (Groq proxy)
│   └── package.json
├── models/             # Face-api.js models
├── start.bat           # Windows batch file
├── start.ps1           # PowerShell script
├── start.js            # Node.js start script (starts backend + frontend)
└── package.json        # Root project scripts
```

## API Endpoints

- `POST /api/answer` - Get AI response with optional document context

## Technologies

- **Frontend**: Vanilla JavaScript (ES6 modules), Face-api.js, Transformers.js
- **Backend**: Node.js, Express, Groq API
- **RAG**: Local embeddings with Transformers.js

## License

ISC

