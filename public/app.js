// Audio processing limits (Vercel Serverless payload limit: 4.5 MB)
const MAX_AUDIO_SIZE_BYTES = Math.floor(4.5 * 1024 * 1024); 
const SUPPORTED_EXTENSIONS = ['mp3', 'wav', 'm4a', 'aac', 'ogg', 'webm', 'flac'];

// State variables
let currentTab = 'record';
let mediaRecorder = null;
let audioChunks = [];
let recTimerInterval = null;
let recTimeSeconds = 0;
let recordedBlob = null;
let selectedFile = null;
let currentAnalysis = null;
let excludedWords = new Set();

// Color palette for word cloud
const PALETTE = ['#38bdf8', '#818cf8', '#c084fc', '#f472b6', '#34d399', '#60a5fa'];

// DOM elements
const tabRecord = document.getElementById('tabRecord');
const tabUpload = document.getElementById('tabUpload');

const panelRecord = document.getElementById('panelRecord');
const panelUpload = document.getElementById('panelUpload');

const recReadyState = document.getElementById('recReadyState');
const recLiveState = document.getElementById('recLiveState');
const recReviewState = document.getElementById('recReviewState');

const startRecBtn = document.getElementById('startRecBtn');
const stopRecBtn = document.getElementById('stopRecBtn');
const discardRecBtn = document.getElementById('discardRecBtn');
const commitRecBtn = document.getElementById('commitRecBtn');
const recTimer = document.getElementById('recTimer');
const reviewDuration = document.getElementById('reviewDuration');
const previewAudioPlayer = document.getElementById('previewAudioPlayer');

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const fileOverview = document.getElementById('fileOverview');
const fileNameText = document.getElementById('fileNameText');
const fileMetaText = document.getElementById('fileMetaText');
const clearFileBtn = document.getElementById('clearFileBtn');
const commitFileBtn = document.getElementById('commitFileBtn');

const errorAlert = document.getElementById('errorAlert');
const errorMessage = document.getElementById('errorMessage');
const loadingState = document.getElementById('loadingState');

const inputSection = document.getElementById('inputSection');
const resultSection = document.getElementById('resultSection');
const resetBtn = document.getElementById('resetBtn');

const cloudCanvas = document.getElementById('cloudCanvas');
const downloadPngBtn = document.getElementById('downloadPngBtn');

// Helper functions for formatting time and bytes
function formatTime(secs) {
  const m = Math.floor(secs / 60).toString().padStart(2, '0');
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

function showError(msg) {
  errorMessage.textContent = msg;
  errorAlert.classList.remove('hidden');
}

function hideError() {
  errorAlert.classList.add('hidden');
}

// Switch between Record and Upload tabs
function switchTab(tab) {
  currentTab = tab;
  hideError();
  [tabRecord, tabUpload].forEach(t => t.classList.remove('active'));
  [panelRecord, panelUpload].forEach(p => p.classList.add('hidden'));

  if (tab === 'record') {
    tabRecord.classList.add('active');
    panelRecord.classList.remove('hidden');
  } else {
    tabUpload.classList.add('active');
    panelUpload.classList.remove('hidden');
  }
}

tabRecord.addEventListener('click', () => switchTab('record'));
tabUpload.addEventListener('click', () => switchTab('upload'));

// Audio recording logic using Web MediaRecorder API
startRecBtn.addEventListener('click', async () => {
  hideError();
  audioChunks = [];
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = e => {
      if (e.data.size > 0) audioChunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      stream.getTracks().forEach(track => track.stop());
      recordedBlob = new Blob(audioChunks, { type: 'audio/webm' });
      previewAudioPlayer.src = URL.createObjectURL(recordedBlob);
      reviewDuration.textContent = formatTime(recTimeSeconds);

      recLiveState.classList.add('hidden');
      recReviewState.classList.remove('hidden');
    };

    mediaRecorder.start(200);
    recTimeSeconds = 0;
    recTimer.textContent = '00:00';
    recTimerInterval = setInterval(() => {
      recTimeSeconds++;
      recTimer.textContent = formatTime(recTimeSeconds);
      if (recTimeSeconds >= 600) { // 10 minutes limit
        stopRecording();
      }
    }, 1000);

    recReadyState.classList.add('hidden');
    recLiveState.classList.remove('hidden');
  } catch (err) {
    showError('Microphone access was denied or not found. Please enable microphone permissions in your browser settings.');
  }
});

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
    clearInterval(recTimerInterval);
  }
}

stopRecBtn.addEventListener('click', stopRecording);

discardRecBtn.addEventListener('click', () => {
  recordedBlob = null;
  recReviewState.classList.add('hidden');
  recReadyState.classList.remove('hidden');
});

commitRecBtn.addEventListener('click', () => {
  if (recordedBlob) {
    processAudio(recordedBlob, 'recorded_session.webm');
  }
});

// File upload drag and drop logic
dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.style.borderColor = '#6366f1'; });
dropzone.addEventListener('dragleave', () => { dropzone.style.borderColor = 'rgba(255, 255, 255, 0.15)'; });
dropzone.addEventListener('drop', e => {
  e.preventDefault();
  dropzone.style.borderColor = 'rgba(255, 255, 255, 0.15)';
  if (e.dataTransfer.files.length > 0) handleFile(e.dataTransfer.files[0]);
});

fileInput.addEventListener('change', e => {
  if (e.target.files.length > 0) handleFile(e.target.files[0]);
});

function handleFile(file) {
  hideError();
  if (file.size > MAX_AUDIO_SIZE_BYTES) {
    showError(`File size is ${formatBytes(file.size)}. Vercel hosting accepts audio files up to 4.5 MB. Please select a smaller or compressed file.`);
    return;
  }

  const ext = file.name.split('.').pop().toLowerCase();
  if (!SUPPORTED_EXTENSIONS.includes(ext)) {
    showError(`Unsupported format ".${ext}". Accepted formats: MP3, WAV, M4A, AAC, OGG, WEBM, FLAC.`);
    return;
  }

  selectedFile = file;
  fileNameText.textContent = file.name;
  fileMetaText.textContent = `${formatBytes(file.size)} - Audio File`;
  dropzone.classList.add('hidden');
  fileOverview.classList.remove('hidden');
}

clearFileBtn.addEventListener('click', () => {
  selectedFile = null;
  fileInput.value = '';
  fileOverview.classList.add('hidden');
  dropzone.classList.remove('hidden');
});

commitFileBtn.addEventListener('click', () => {
  if (selectedFile) processAudio(selectedFile, selectedFile.name);
});

// Send audio to backend Express API endpoint
async function processAudio(fileOrBlob, filename) {
  loadingState.classList.remove('hidden');
  panelRecord.classList.add('hidden');
  panelUpload.classList.add('hidden');
  hideError();

  const formData = new FormData();
  formData.append('audio', fileOrBlob, filename);

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Failed to analyze audio file.');
    }

    renderAnalysisResult(data);
  } catch (err) {
    showError(err.message);
    switchTab(currentTab);
  } finally {
    loadingState.classList.add('hidden');
  }
}

// Display analysis results and word cloud
function renderAnalysisResult(data) {
  currentAnalysis = data;
  excludedWords.clear();

  document.getElementById('resultFileName').textContent = data.fileName;
  document.getElementById('resultMeta').textContent = `Size: ${formatBytes(data.fileSize)} - ${data.words.length} terms extracted`;

  document.getElementById('summaryBox').textContent = `Summary: ${data.summary || 'Session analysis completed.'}`;
  document.getElementById('transcriptText').textContent = data.transcript;

  renderWordCloud();
  renderFrequencyTable();

  inputSection.classList.add('hidden');
  resultSection.classList.remove('hidden');
}

resetBtn.addEventListener('click', () => {
  resultSection.classList.add('hidden');
  inputSection.classList.remove('hidden');
  switchTab('record');
});

// Render Word Cloud on HTML5 Canvas using Archimedean spiral algorithm
function renderWordCloud() {
  if (!currentAnalysis) return;
  const ctx = cloudCanvas.getContext('2d');

  const width = cloudCanvas.parentElement.clientWidth || 800;
  const height = 400;
  cloudCanvas.width = width;
  cloudCanvas.height = height;

  ctx.clearRect(0, 0, width, height);

  // Background grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  for (let x = 0; x < width; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }

  const activeWords = currentAnalysis.words.filter(w => !excludedWords.has(w.text.toLowerCase()));
  if (activeWords.length === 0) return;

  const maxCount = Math.max(...activeWords.map(w => w.count), 1);
  const minCount = Math.min(...activeWords.map(w => w.count), 1);
  const placedBoxes = [];

  const centerX = width / 2;
  const centerY = height / 2;

  activeWords.forEach((item, index) => {
    const norm = maxCount === minCount ? 1 : (item.count - minCount) / (maxCount - minCount);
    const fontSize = Math.floor(14 + norm * 40);
    const color = PALETTE[index % PALETTE.length];

    ctx.font = `bold ${fontSize}px Inter, sans-serif`;
    const metrics = ctx.measureText(item.text);
    const wordW = metrics.width;
    const wordH = fontSize;

    let angle = 0;
    let radius = 0;
    let posX = centerX - wordW / 2;
    let posY = centerY;
    let found = false;

    while (radius < Math.max(width, height) / 2 && !found) {
      posX = centerX + radius * Math.cos(angle) - wordW / 2;
      posY = centerY + radius * Math.sin(angle) + wordH / 3;

      if (posX >= 20 && posX + wordW <= width - 20 && posY - wordH >= 20 && posY <= height - 20) {
        let overlap = false;
        for (const box of placedBoxes) {
          if (posX < box.x + box.w + 6 && posX + wordW + 6 > box.x && posY - wordH < box.y + box.h + 6 && posY + 6 > box.y) {
            overlap = true;
            break;
          }
        }
        if (!overlap) {
          found = true;
          placedBoxes.push({ x: posX, y: posY - wordH, w: wordW, h: wordH });
        }
      }
      angle += 0.35;
      radius += 1.8;
    }

    if (found) {
      ctx.fillStyle = color;
      ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
      ctx.shadowBlur = 6;
      ctx.fillText(item.text, posX, posY);
      ctx.shadowBlur = 0;
    }
  });
}

// Download PNG image from Canvas
downloadPngBtn.addEventListener('click', () => {
  const exportCanvas = document.createElement('canvas');
  exportCanvas.width = cloudCanvas.width;
  exportCanvas.height = cloudCanvas.height;
  const ctx = exportCanvas.getContext('2d');

  ctx.fillStyle = '#0b0f19';
  ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
  ctx.drawImage(cloudCanvas, 0, 0);

  const link = document.createElement('a');
  link.download = `wordcloud_${Date.now()}.png`;
  link.href = exportCanvas.toDataURL('image/png');
  link.click();
});

// Render frequency table
function renderFrequencyTable() {
  const tableBody = document.getElementById('tableBody');
  tableBody.innerHTML = '';

  currentAnalysis.words.forEach(item => {
    const isExcluded = excludedWords.has(item.text.toLowerCase());
    const tr = document.createElement('tr');
    if (isExcluded) tr.style.opacity = '0.3';

    tr.innerHTML = `
      <td><strong>${item.text}</strong></td>
      <td>${item.count}</td>
      <td>${Math.round(item.importance * 100)}%</td>
      <td style="text-align: right;">
        <button class="btn btn-secondary text-xs" onclick="toggleExclude('${item.text}')">
          ${isExcluded ? 'Restore' : 'Exclude'}
        </button>
      </td>
    `;
    tableBody.appendChild(tr);
  });

  renderExcludedPills();
}

window.toggleExclude = function(word) {
  const lower = word.toLowerCase();
  if (excludedWords.has(lower)) excludedWords.delete(lower);
  else excludedWords.add(lower);

  renderWordCloud();
  renderFrequencyTable();
};

document.getElementById('excludeForm').addEventListener('submit', e => {
  e.preventDefault();
  const input = document.getElementById('excludeInput');
  const word = input.value.trim().toLowerCase();
  if (word) {
    excludedWords.add(word);
    input.value = '';
    renderWordCloud();
    renderFrequencyTable();
  }
});

function renderExcludedPills() {
  const container = document.getElementById('excludedPills');
  container.innerHTML = '';
  excludedWords.forEach(w => {
    const pill = document.createElement('span');
    pill.className = 'pill';
    pill.style.cssText = 'background: rgba(239, 68, 68, 0.2); color: #fca5a5; padding: 2px 8px; border-radius: 999px; font-size: 11px; margin-right: 6px; cursor: pointer;';
    pill.textContent = `${w} x`;
    pill.onclick = () => toggleExclude(w);
    container.appendChild(pill);
  });
}

// View switcher for Cloud, Table, and Transcript
const btnTabCloud = document.getElementById('btnTabCloud');
const btnTabTable = document.getElementById('btnTabTable');
const btnTabTranscript = document.getElementById('btnTabTranscript');
const viewCloud = document.getElementById('viewCloud');
const viewTable = document.getElementById('viewTable');
const viewTranscript = document.getElementById('viewTranscript');

btnTabCloud.addEventListener('click', () => switchViewTab('cloud'));
btnTabTable.addEventListener('click', () => switchViewTab('table'));
btnTabTranscript.addEventListener('click', () => switchViewTab('transcript'));

function switchViewTab(vtab) {
  [btnTabCloud, btnTabTable, btnTabTranscript].forEach(b => b.classList.remove('active'));
  [viewCloud, viewTable, viewTranscript].forEach(v => v.classList.add('hidden'));

  if (vtab === 'cloud') { btnTabCloud.classList.add('active'); viewCloud.classList.remove('hidden'); }
  else if (vtab === 'table') { btnTabTable.classList.add('active'); viewTable.classList.remove('hidden'); }
  else { btnTabTranscript.classList.add('active'); viewTranscript.classList.remove('hidden'); }
}

// Copy transcript to clipboard
document.getElementById('copyTranscriptBtn').addEventListener('click', () => {
  if (currentAnalysis && currentAnalysis.transcript) {
    navigator.clipboard.writeText(currentAnalysis.transcript);
    const btn = document.getElementById('copyTranscriptBtn');
    btn.textContent = 'Copied';
    setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
  }
});

// Export transcript as .txt file
document.getElementById('downloadTxtBtn').addEventListener('click', () => {
  if (currentAnalysis && currentAnalysis.transcript) {
    const blob = new Blob([currentAnalysis.transcript], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transcript_${Date.now()}.txt`;
    link.click();
  }
});

// Search transcript text
document.getElementById('transcriptSearch').addEventListener('input', e => {
  const query = e.target.value.toLowerCase().trim();
  const transcriptEl = document.getElementById('transcriptText');
  if (!currentAnalysis || !currentAnalysis.transcript) return;

  if (!query) {
    transcriptEl.textContent = currentAnalysis.transcript;
    return;
  }

  const parts = currentAnalysis.transcript.split(new RegExp(`(${query})`, 'gi'));
  transcriptEl.innerHTML = '';
  parts.forEach(part => {
    if (part.toLowerCase() === query) {
      const mark = document.createElement('mark');
      mark.style.cssText = 'background: rgba(245, 158, 11, 0.4); color: #fde68a; border-radius: 2px; padding: 0 2px;';
      mark.textContent = part;
      transcriptEl.appendChild(mark);
    } else {
      transcriptEl.appendChild(document.createTextNode(part));
    }
  });
});
