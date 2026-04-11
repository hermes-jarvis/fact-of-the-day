const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const log = (level, msg, extra = {}) => {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level, msg, ...extra }));
};

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    log('info', 'request', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      ms: Date.now() - start,
    });
  });
  next();
});

app.use(express.static('public'));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.get('/api/fact', async (req, res) => {
  try {
    const response = await axios.get('https://uselessfacts.jsph.pl/api/v2/facts/today', {
      timeout: 5000,
    });
    res.json(response.data);
  } catch (error) {
    log('error', 'failed to fetch fact', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch fact' });
  }
});

app.get('/api/quote', async (req, res) => {
  try {
    const response = await axios.get('https://zenquotes.io/api/today', {
      timeout: 5000,
    });
    const quote = response.data[0];
    res.json({ text: quote.q, author: quote.a });
  } catch (error) {
    log('error', 'failed to fetch quote', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch quote' });
  }
});

app.get('/api/meme', async (req, res) => {
  try {
    const response = await axios.get('https://meme-api.com/gimme', {
      timeout: 5000,
    });
    const { title, url, postLink } = response.data;
    res.json({ title, url, postLink });
  } catch (error) {
    log('error', 'failed to fetch meme', { error: error.message });
    res.status(500).json({ error: 'Failed to fetch meme' });
  }
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = app.listen(PORT, '0.0.0.0', () => {
  log('info', `server started`, { port: PORT });
});

const shutdown = (signal) => {
  log('info', `received ${signal}, shutting down`);
  server.close(() => {
    log('info', 'server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
