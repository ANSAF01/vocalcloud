// VocalCloud Server - Express + EJS + Multer + Gemini AI Audio Intelligence
const express = require('express');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configure EJS view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Multer memory storage (4.5 MB payload limit for serverless host compatibility)
const upload = multer({
  limits: { fileSize: Math.floor(4.5 * 1024 * 1024) }
});

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/favicon.ico', (req, res) => res.status(204).end());

// Render Home Page
app.get('/', (req, res) => {
  res.render('index');
});

// Audio Analysis Endpoint
app.post('/api/analyze', upload.single('audio'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Please select or record an audio file.' });
    }

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey) {
      return res.status(400).json({ error: 'GEMINI_API_KEY is missing in your .env file.' });
    }

    const base64Audio = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype || 'audio/webm';

    const prompt = `Listen carefully to this audio recording.

CRITICAL INSTRUCTIONS:
1. ACCURACY FIRST: Transcribe ONLY speech that is actually audible in the audio file.
2. SILENCE / MUTE AUDIO HANDLING: If the audio is silent, muted, contains only background noise, or has no discernible spoken words:
   - Set "transcript" to: ""
   - Set "summary" to: "No speech detected in the audio file."
   - Set "keywords" to: []
3. IF SPEECH IS SPOKEN:
   - "transcript": Full verbatim speech transcription of what was said.
   - "summary": 1-2 sentence concise summary of the spoken audio.
   - "keywords": Extract ONLY words/topics actually spoken in the recording (filtering out filler words like um, uh, like). DO NOT invent terms that were not spoken.

Respond strictly in valid JSON format matching this schema:
{
  "transcript": "<verbatim speech or empty string if silent>",
  "summary": "<summary or silence notice>",
  "keywords": [
    { "text": "<Spoken Word>", "count": <integer frequency>, "importance": <score 0.3 to 1.0> }
  ]
}`;

      const models = ['gemini-3.8-flash', 'gemini-3.6-flash'];
      let geminiRes = null;
      let lastErr = null;

      for (const model of models) {
        try {
          const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{
                parts: [
                  { text: prompt },
                  { inline_data: { mime_type: mimeType, data: base64Audio } }
                ]
              }],
              generationConfig: { response_mime_type: 'application/json' }
            })
          });

          if (response.ok) {
            geminiRes = await response.json();
            break;
          } else {
            const errBody = await response.json().catch(() => ({}));
            lastErr = new Error(errBody.error?.message || `HTTP ${response.status}`);
            console.warn(`Gemini Model ${model} returned ${response.status}, trying fallback model...`);
          }
        } catch (e) {
          lastErr = e;
        }
      }

      if (!geminiRes) {
        throw lastErr || new Error('Failed to analyze audio with Gemini API.');
      }

      const rawText = geminiRes.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const cleanJson = rawText.replace(/```json|```/gi, '').trim();

    let result;
    try {
      result = JSON.parse(cleanJson);
    } catch {
      result = { transcript: rawText, summary: 'Session analyzed.', keywords: [] };
    }

    return res.json({
      fileName: req.file.originalname || 'recording.webm',
      fileSize: req.file.size,
      transcript: result.transcript || rawText,
      summary: result.summary || 'Session analyzed.',
      words: result.keywords || []
    });

  } catch (err) {
    next(err);
  }
});

// Centralized Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);
  const isSizeLimit = err.code === 'LIMIT_FILE_SIZE';
  res.status(isSizeLimit ? 413 : 500).json({
    error: isSizeLimit
      ? 'File size exceeds the 4.5 MB server payload limit.'
      : err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => console.log(`VocalCloud Server running at http://localhost:${PORT}`));
