const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const { exec } = require("child_process");
const path = require('path');

const { startStreaming, stopStreaming } = require('./streamer'); // Adjust as necessary
// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// FFmpeg version check endpoint
app.get('/ffmpeg-version', (req, res) => {
  exec("ffmpeg -version", (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return res.send(`Error occurred: ${error.message}`);
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return res.send(`Error occurred: ${stderr}`);
    }
    res.send(`FFmpeg version: ${stdout}`);
  });
});

// Endpoint to start streaming
app.use(express.json()); // to parse JSON bodies

app.post('/start-streaming', (req, res) => {
    const { srtUrl } = req.body; // Extract the SRT URL from the request body
    if (srtUrl) {
        startStreaming(srtUrl);
        res.send('Streaming started with SRT URL: ' + srtUrl);
    } else {
        res.status(400).send('SRT URL is required');
    }
});

// Endpoint to stop streaming
app.post('/stop-streaming', (req, res) => {
    stopStreaming();
    res.send('Streaming stopped');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
