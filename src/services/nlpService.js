// Service layer for NLP word normalization and frequency processing

const COMMON_STOPWORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further',
  'had', 'has', 'have', 'having', 'he', 'her', 'here', 'hers', 'herself', 'him', 'himself', 'his', 'how',
  'i', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most', 'my', 'myself',
  'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves',
  'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very',
  'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your'
]);

const FILLER_WORDS = new Set([
  'um', 'uh', 'hmm', 'ah', 'like', 'basically', 'actually', 'literally', 'sort', 'kind', 'right', 'yeah', 'okay', 'ok',
  'know', 'mean', 'guess', 'anyway', 'well', 'really', 'stuff', 'thing', 'things', 'going', 'also', 'think'
]);

function normalizeWord(word) {
  let cleaned = word.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (!cleaned || cleaned.length < 3) return '';
  if (cleaned.endsWith('ies') && cleaned.length > 5) cleaned = cleaned.slice(0, -3) + 'y';
  else if (cleaned.endsWith('es') && cleaned.length > 4) cleaned = cleaned.slice(0, -2);
  else if (cleaned.endsWith('s') && !cleaned.endsWith('ss') && cleaned.length > 3) cleaned = cleaned.slice(0, -1);
  return cleaned;
}

function processTranscriptText(transcript) {
  const words = transcript.toLowerCase().match(/\b[a-z]{3,}\b/g) || [];
  const freqMap = new Map();

  for (const w of words) {
    if (COMMON_STOPWORDS.has(w) || FILLER_WORDS.has(w)) continue;
    const normalized = normalizeWord(w);
    if (!normalized || COMMON_STOPWORDS.has(normalized) || FILLER_WORDS.has(normalized)) continue;

    const current = freqMap.get(normalized);
    if (current) {
      current.count += 1;
    } else {
      const display = w.charAt(0).toUpperCase() + w.slice(1);
      freqMap.set(normalized, { text: display, count: 1 });
    }
  }

  const items = Array.from(freqMap.values());
  items.sort((a, b) => b.count - a.count);
  const top = items.slice(0, 45);
  const maxCount = top.length > 0 ? top[0].count : 1;

  return top.map(item => ({
    text: item.text,
    count: item.count,
    importance: Math.max(0.3, Math.min(1.0, item.count / maxCount))
  }));
}

module.exports = {
  processTranscriptText,
  normalizeWord
};
