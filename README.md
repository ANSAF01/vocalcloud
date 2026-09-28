# VocalCloud - Mentorship Session Audio Intelligence

**Built by**: Ansaf  

A clean, fast web application built with Node.js, Express.js, EJS, HTML5 Canvas, and Vanilla JavaScript to transcribe audio from mentorship sessions and generate interactive word clouds powered by Google Gemini AI.

---

## 01. Features & Architecture

- **Live Audio Recorder**: Web MediaRecorder API with live timer counter (MM:SS), playback preview, and mic permission error handling.
- **File Uploader**: Drag-and-drop file uploader supporting MP3, WAV, M4A, AAC, OGG, WEBM, FLAC (Up to 4.5 MB serverless limit).
- **AI Audio Intelligence**: Express POST endpoint `/api/analyze` powered by Google Gemini AI (`gemini-3.8-flash`) to transcribe speech, summarize key points, and extract frequency metrics.
- **Word Cloud Engine**: Lightweight HTML5 Canvas Archimedean spiral word cloud renderer with single-click PNG download, word exclusion filtering, frequency tables, and transcript search.
- **Templating**: EJS template rendering engine for dynamic HTML views.

---

## 02. Project Structure

```
vocalcloud/
├── server.js           <-- Main Express server + Multer + Gemini AI endpoint
├── package.json        <-- Dependencies (express, ejs, multer, dotenv)
├── vercel.json         <-- Vercel deployment configuration
├── .env                <-- Environment variables (GEMINI_API_KEY, PORT)
├── views/
│   └── index.ejs       <-- EJS view template
└── public/             <-- Static client assets
    ├── style.css       <-- CSS Design system & layout styling
    └── app.js          <-- Client audio recording, upload & word cloud renderer
```

---

## 03. How to Run Locally

```bash
# 1. Install dependencies
npm install

# 2. Configure environment variables in .env:
# GEMINI_API_KEY=your_gemini_api_key_here
# PORT=5000

# 3. Start the server
npm start
```

Open `http://localhost:5000` in your browser.

---

## 04. Third-Party Libraries

- `express` - Minimalist Node.js web framework
- `ejs` - Embedded JavaScript template engine
- `multer` - File upload handling middleware
- `dotenv` - Environment variable management
