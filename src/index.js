const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const { exec } = require("child_process");
const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Configure multer for custom file naming and directory
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/usr/src/app/src/public/videos');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Use the original file name
    }
});

const upload = multer({ storage: storage }); // Use the custom storage configuration




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
    console.log(`File uploaded: ${req.file.filename}`);
    io.emit('message', `File uploaded successfully: ${req.file.filename}`);  // Emitting message to the client with file name
    res.status(200).end(); 
});

app.get('/list-videos', (req, res) => {
    const directoryPath = path.join(__dirname, 'public', 'videos');

    fs.readdir(directoryPath, function (err, files) {
        if (err) {
            console.error('Error getting directory information: ', err);
            res.status(500).send('Unable to list files due to server error');
        } else {
            const videoFiles = files.filter(file => file.match(/\.(mp4|avi)$/)); // Adjust regex as needed
            res.send(videoFiles);
        }
    });
});


// Start the server
server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
