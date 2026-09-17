# VocalCloud - Mentorship Session Audio Intelligence

**Built by**: Ansaf  

A minimal, fast web application built with Node.js, Express.js, HTML5 Canvas, and Vanilla JavaScript to transcribe audio from mentorship sessions and generate an interactive word cloud.

---

## 01. What Was Built and What Works

- **Live Audio Recorder**: Web MediaRecorder API with live visualizer canvas, timer counter (MM:SS), playback preview, and mic permission denial error handling.
- **File Uploader**: Drag-and-drop file uploader supporting MP3, WAV, M4A, AAC, OGG, WEBM, FLAC. Enforces max file size (25 MB) and 10-minute audio limit.
- **AI Analysis Engine**: Express POST endpoint `/api/analyze` using Google Gemini 1.5 Flash API to transcribe speech, strip filler words ("um", "uh", "like"), normalize plurals/case, and calculate word importance scores.
- **Word Cloud Renderer**: HTML5 Canvas Archimedean spiral word cloud renderer with single-click PNG download button, word exclusion filter, and transcript search viewer.

---

## 02. Project Directory Structure

```
vocalcloud/
├── package.json
├── .env.example
├── .gitignore
├── server.js (Application Entry Point)
├── src/
│   ├── config/
│   │   └── constants.js (Size limits and format configurations)
│   ├── controllers/
│   │   └── audioController.js (Controller for /api/analyze requests)
│   ├── services/
│   │   ├── geminiService.js (Service handling Google Gemini API)
│   │   └── nlpService.js (Service handling word normalization & frequency)
│   └── routes/
│       └── audioRoutes.js (Express router & Multer file upload handling)
└── public/ (Static Assets & Views)
    ├── index.html
    ├── style.css
    └── app.js
```

---

## 03. How to Run Locally

Follow these exact steps in order:

```bash
# 1. Navigate into the project directory
cd vocalcloud

# 2. Install dependencies
npm install

# 3. Create .env file
cp .env.example .env

# Add your Gemini API key inside .env:
# GEMINI_API_KEY=your_gemini_api_key_here

# 4. Start the server
npm start
```

Open http://localhost:5000 in your browser.

---

## 04. AI Service Selection and Rationale

- **AI Provider**: Google Gemini 1.5 Flash API via Gemini AI Studio.
- **Rationale**: Gemini Flash supports direct inline audio payload processing, returning both accurate transcript text and structured JSON keyword metrics in a single pass.

---

## 05. Architectural Decisions and Trade-offs

1. **Server-Side API Key Protection**: The API key is stored strictly in server environment variables (.env) and never exposed in client JavaScript.
2. **HTML5 Canvas Engine for Word Cloud**: Utilized plain HTML5 Canvas drawing APIs for lightweight execution and instant PNG image exports via `canvas.toDataURL()`.
3. **No User Accounts or Authentication**: Deliberately excluded authentication systems to keep focus purely on core audio transcription and visualization.

---

## 06. Third-Party Libraries Used

- `express` (v4.21) - Web server framework
- `multer` (v1.4) - File upload processing middleware
- `dotenv` (v16.4) - Environment variable management
