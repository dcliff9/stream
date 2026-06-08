const express = require('express');
const router = express.Router();
const { startStreaming, stopStreaming, isStreamActive } = require('../streamer');
const fs = require('fs');
const path = require('path');

const { io } = require('../index.js');

const VIDEO_DIR = path.join(__dirname, '..', 'public', 'videos');
const validVideoExtensions = /\.(mp4|mov)$/i;

// ── API key middleware ──────────────────────────────────────────────
const authenticate = (req, res, next) => {
    const apiKey = req.get('X-API-KEY');
    if (apiKey && apiKey === process.env.API_SECRET_KEY) {
        return next();
    }
    res.status(401).json({ message: 'Invalid or missing API Key' });
};

// EVERY route below requires a valid X-API-KEY. There are no public endpoints.
router.use(authenticate);

// ── Health check (no side effects) ──────────────────────────────────
router.get('/auth-check', (req, res) => {
    res.json({ ok: true, isStreaming: isStreamActive() });
});

// ── Start streaming ─────────────────────────────────────────────────
router.post('/start-streaming', (req, res) => {
    let { videoFile, rtmpsUrl, rtmpsKey } = req.body;
    if (!validVideoExtensions.test(videoFile || '')) {
        return res.status(400).json({ message: 'Invalid video file type.' });
    }
    videoFile = String(videoFile).replace(/^.*[\\/]/, ''); // strip any path traversal
    if (rtmpsUrl && rtmpsKey && videoFile) {
        startStreaming(rtmpsUrl, rtmpsKey, io, videoFile);
        res.json({ message: 'Streaming started' });
    } else {
        res.status(400).json({ message: 'RTMPS URL, key, and video file are required' });
    }
});

// ── Stop streaming ──────────────────────────────────────────────────
router.post('/stop-streaming', (req, res) => {
    stopStreaming(io);
    res.json({ message: 'Streaming stopped successfully' });
});

// ── Stream state ────────────────────────────────────────────────────
router.get('/stream-state', (req, res) => {
    res.json({ isStreaming: isStreamActive() });
});

// ── List placeholder videos ─────────────────────────────────────────
const videoFileFilter = /\.(mp4|mov)$/i;
router.get('/list-videos', (req, res) => {
    fs.readdir(VIDEO_DIR, (err, files) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Error reading directory' });
        }
        res.json(files.filter(f => videoFileFilter.test(f)));
    });
});

// ── Upload a placeholder video ──────────────────────────────────────
// Raw binary body (no multipart needed). Filename comes in the X-Filename
// header so WordPress can proxy a file straight through with the key.
router.post('/upload', express.raw({ type: '*/*', limit: '300mb' }), (req, res) => {
    const name = path.basename(String(req.get('X-Filename') || ''));
    if (!name || !validVideoExtensions.test(name)) {
        return res.status(400).json({ message: 'Invalid filename — only .mp4 or .mov allowed.' });
    }
    if (!req.body || !req.body.length) {
        return res.status(400).json({ message: 'Empty upload.' });
    }
    const target = path.join(VIDEO_DIR, name);
    if (!target.startsWith(VIDEO_DIR + path.sep)) {
        return res.status(400).json({ message: 'Invalid path.' });
    }
    fs.writeFile(target, req.body, (err) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ message: 'Write failed: ' + err.message });
        }
        res.json({ ok: true, file: name });
    });
});

// ── Delete a placeholder video ──────────────────────────────────────
router.post('/delete-video', (req, res) => {
    const name = path.basename(String((req.body && req.body.file) || ''));
    if (!name || !validVideoExtensions.test(name)) {
        return res.status(400).json({ message: 'Invalid filename.' });
    }
    const target = path.join(VIDEO_DIR, name);
    if (!target.startsWith(VIDEO_DIR + path.sep)) {
        return res.status(400).json({ message: 'Invalid path.' });
    }
    fs.unlink(target, (err) => {
        if (err) {
            return res.status(err.code === 'ENOENT' ? 404 : 500).json({ message: err.message });
        }
        res.json({ ok: true, deleted: name });
    });
});

module.exports = router;
