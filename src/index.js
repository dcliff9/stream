const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const { exec } = require("child_process");
const path = require('path');
const multer = require('multer');
const upload = multer({ dest: '/usr/src/app/src/public/videos' });



// Socket.io setup
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// Streamer functions
const { startStreaming, stopStreaming } = require('./streamer');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));


// Middleware to parse JSON bodies
app.use(express.json());

// Start streaming endpoint
app.post('/start-streaming', (req, res) => {
    const { rtmpsUrl, rtmpsKey } = req.body;
    if (rtmpsUrl && rtmpsKey) {
        startStreaming(rtmpsUrl, rtmpsKey, io); // Pass io instance for real-time communication
    } else {
        res.status(400).send('RTMPS URL and key are required');
    }
});

// Stop streaming endpoint
app.post('/stop-streaming', (req, res) => {
    stopStreaming(io); // Pass io instance for real-time communication
});

// Handle socket connection
io.on('connection', socket => {
    console.log('a user connected');
});

app.post('/upload', upload.single('file'), (req, res) => {
    console.log(`File uploaded: ${req.file.path}`);
    io.emit('message', 'File uploaded successfully.');  // Emitting message to the client
    res.send('File uploaded successfully.');
});

// Start the server
server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
