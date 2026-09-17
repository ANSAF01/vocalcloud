// Configuration constants for VocalCloud application

// Vercel Serverless Function payload limit is 4.5 MB
const MAX_AUDIO_SIZE_BYTES = Math.floor(4.5 * 1024 * 1024); // 4.5 MB

const SUPPORTED_EXTENSIONS = ['.mp3', '.wav', '.m4a', '.aac', '.ogg', '.webm', '.flac'];

module.exports = {
  MAX_AUDIO_SIZE_BYTES,
  SUPPORTED_EXTENSIONS
};
