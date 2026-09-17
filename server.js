// VocalCloud Server Entry Point - Built by Ansaf

const express = require('express');
const path = require('path');
require('dotenv').config();

const audioRoutes = require('./src/routes/audioRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Body parser limits for large payloads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Global static files
app.use(express.static(path.join(__dirname, 'public')));

// Favicon handler
app.get('/favicon.ico', (req, res) => res.status(204).end());

// API Routes
app.use('/api', audioRoutes);

// Global Error Handler for 413 Payload Too Large
app.use((err, req, res, next) => {
  if (err.status === 413 || err.type === 'entity.too.large') {
    return res.status(413).json({
      error: 'Audio file is too large for the hosting serverless gateway. Please select a smaller or compressed audio file under 4.5 MB.'
    });
  }
  next(err);
});

// Start server
app.listen(PORT, () => {
  console.log(`VocalCloud Server listening on port ${PORT}`);
});
