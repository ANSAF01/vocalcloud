// Controller layer handling audio analysis pipeline

const geminiService = require('../services/geminiService');

async function analyzeAudio(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file uploaded. Please select or record an audio file.' });
    }

    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      return res.status(400).json({
        error: 'Gemini API key is not set. Please add your GEMINI_API_KEY to the .env file in your project folder.'
      });
    }

    const audioBuffer = req.file.buffer;
    const mimeType = req.file.mimetype || 'audio/webm';
    const originalName = req.file.originalname || 'recording.webm';

    const result = await geminiService.analyzeAudioWithGemini(audioBuffer, mimeType, apiKey, originalName);

    return res.json({
      id: `session_${Date.now()}`,
      fileName: originalName,
      fileSize: req.file.size,
      transcript: result.transcript,
      summary: result.summary,
      words: result.keywords
    });
  } catch (error) {
    console.error('Audio Analysis Error:', error.message);
    const isClientError = error.message.includes('API Key') || error.message.includes('API_KEY') || error.message.includes('400');
    const statusCode = isClientError ? 400 : 500;

    return res.status(statusCode).json({
      error: error.message
    });
  }
}

module.exports = {
  analyzeAudio
};
