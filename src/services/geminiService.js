// Service layer for Google Gemini API integration

const nlpService = require('./nlpService');

// Normalize mime types for Gemini API compatibility
function normalizeMimeType(mimeType, originalName = '') {
  const mime = (mimeType || '').toLowerCase();
  const ext = (originalName || '').split('.').pop().toLowerCase();

  if (mime.includes('webm') || ext === 'webm') return 'audio/webm';
  if (mime.includes('mp3') || mime.includes('mpeg') || ext === 'mp3') return 'audio/mp3';
  if (mime.includes('wav') || ext === 'wav') return 'audio/wav';
  if (mime.includes('m4a') || mime.includes('mp4') || ext === 'm4a') return 'audio/mp4';
  if (mime.includes('aac') || ext === 'aac') return 'audio/aac';
  if (mime.includes('ogg') || ext === 'ogg') return 'audio/ogg';
  if (mime.includes('flac') || ext === 'flac') return 'audio/flac';

  return mime || 'audio/webm';
}

async function analyzeAudioWithGemini(audioBuffer, rawMimeType, apiKey, originalName = '') {
  const cleanKey = (apiKey || '').trim();

  if (!cleanKey) {
    throw new Error('Gemini API Key is missing. Please set GEMINI_API_KEY in your .env file.');
  }

  const base64Audio = audioBuffer.toString('base64');
  const mimeType = normalizeMimeType(rawMimeType, originalName);

  // Active Gemini Flash models
  const modelsToTry = [
    'gemini-flash-latest',
    'gemini-3.6-flash',
    'gemini-3.5-flash'
  ];
  let lastError = null;

  const prompt = `Analyze this audio recording of a mentorship session.
Respond strictly in valid JSON format with no markdown formatting or backticks:
{
  "transcript": "<Full verbatim transcription of speech>",
  "summary": "<Concise 1-2 sentence executive summary of the conversation>",
  "keywords": [
    { "text": "<Normalized topic term>", "count": <frequency count integer>, "importance": <importance score between 0.3 and 1.0> }
  ]
}
Requirements:
1. Strip out filler words (um, uh, like, you know, basically) and common stop words.
2. Normalize terms (lowercase, singular form).
3. Extract at least 15-25 key discussion topics.`;

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;

      const geminiRes = await fetch(url, {
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

      if (!geminiRes.ok) {
        const errorJson = await geminiRes.json().catch(() => ({}));
        const message = errorJson.error?.message || `HTTP ${geminiRes.status}`;
        lastError = new Error(`Google Gemini API (${model}): ${message}`);
        console.warn(`Model ${model} failed, trying fallback... Error: ${message}`);
        continue;
      }

      const geminiData = await geminiRes.json();
      const rawText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error(`Google Gemini API (${model}) returned an empty response.`);
      }

      const cleanJsonStr = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      let parsed;

      try {
        parsed = JSON.parse(cleanJsonStr);
      } catch (err) {
        parsed = {
          transcript: rawText,
          summary: 'Audio session analyzed.',
          keywords: []
        };
      }

      let transcript = parsed.transcript || rawText;
      let summary = parsed.summary || 'Mentorship session analyzed.';
      let keywords = parsed.keywords || [];

      if (!keywords || keywords.length === 0) {
        keywords = nlpService.processTranscriptText(transcript);
      }

      return { transcript, summary, keywords };
    } catch (err) {
      lastError = err;
      if (err.message.includes('API key') || err.message.includes('API_KEY_INVALID')) {
        throw err;
      }
    }
  }

  throw lastError || new Error('Failed to analyze audio with Gemini API.');
}

module.exports = {
  analyzeAudioWithGemini
};
