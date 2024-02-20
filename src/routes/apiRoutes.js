const express = require('express');
const router = express.Router();
const { stopStreaming } = require('../streamer');
const { startStreaming } = require('../streamer'); 
const { isStreamActive } = require('../streamer'); 
const fs = require('fs');


const { io } = require('../index.js'); 


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
        startStreaming(rtmpsUrl, rtmpsKey, io, videoFile); 
        res.json({ message: 'Streaming started' });
    } else {
        res.status(400).json({ message: 'RTMPS URL, key, and video file are required' });
    }
});


// Define the /stop-streaming API endpoint
router.post('/stop-streaming', authenticate, (req, res) => {
    console.log(`API Received stop request`);
    
    // Call the stopStreaming function to handle stopping the stream
    // Pass the io instance for real-time communication
    stopStreaming(io);
    
    // Respond to the client indicating the stream has been stopped
    res.json({ message: 'Streaming stopped successfully' });
});

router.get('/stream-state', (req, res) => {
    const state = isStreamActive();
    res.json({ isStreaming: state });
});

// File list
const videoFileFilter = /\.(mp4|avi|mkv)$/;

router.get('/list-videos', (req, res) => {
  const directoryPath = path.join(__dirname, 'public/videos'); 
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error(err);
      res.status(500).send('Error reading directory');
      return;
    }
    
    const videoFiles = files.filter(file => videoFileFilter.test(file));

    res.json(videoFiles);
  });
});



module.exports = router;
