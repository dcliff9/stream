const express = require('express');
const router = express.Router();
const { startStreaming } = require('../streamer'); // Ensure correct path

// Middleware for API Key verification
const authenticate = (req, res, next) => {
    const apiKey = req.get('X-API-KEY'); // Assumes API key comes in the header named 'X-API-KEY'
    if (apiKey && apiKey === process.env.API_SECRET_KEY) {
        next(); // API Key is valid, proceed to the next middleware/route handler
    } else {
        res.status(401).json({ message: 'Invalid or missing API Key' }); // API Key is missing or invalid, return error
    }
};

const validVideoExtensions = /\.(mp4|mov)$/;
// Define your API routes


// Define the /start-streaming API endpoint
router.post('/start-streaming', authenticate, (req, res) => {
    let { videoFile, rtmpsUrl, rtmpsKey } = req.body;
    console.log(`API Received - VideoFile: ${videoFile}, RTMPS URL: ${rtmpsUrl}, RTMPS Key: ${rtmpsKey}`);
    
    // Check for valid video file extension
    if (!validVideoExtensions.test(videoFile)) {
        return res.status(400).json({ message: 'Invalid video file type.' });
    }

    // Remove any path traversal characters
    videoFile = videoFile.replace(/^.*[\\\/]/, '');

    if (rtmpsUrl && rtmpsKey && videoFile) {
        startStreaming(rtmpsUrl, rtmpsKey, videoFile); // Ensure this function matches your actual implementation
        res.json({ message: 'Streaming started' });
    } else {
        res.status(400).json({ message: 'RTMPS URL, key, and video file are required' });
    }
});


// ... other API routes

module.exports = router;
