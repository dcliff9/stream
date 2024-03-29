const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
module.exports.io = io;
const apiRoutes = require('./routes/apiRoutes');
const port = process.env.PORT || 3000;
const {
    exec
} = require("child_process");
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const cors = require('cors');
app.use(cors({
    origin: 'https://hitchstream.com', // Replace with your WordPress site's URL
    methods: 'GET,POST,PUT,DELETE',
    credentials: true
}));

app.use(express.json());
app.use('/api', apiRoutes); // Mount the API routes under the '/api' path

// Configure multer for custom file naming and directory
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, '/usr/src/app/src/public/videos');
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname); // Use the original file name
    }
});

const upload = multer({
    storage: storage
}); // Use the custom storage configuration







// Streamer functions
const {
    startStreaming,
    stopStreaming
} = require('./streamer');

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));


// Middleware to parse JSON bodies
app.use(express.json());

// Start streaming endpoint

const validVideoExtensions = /\.(mp4|mov)$/;

app.post('/start-streaming', (req, res) => {
    let {
        videoFile,
        rtmpsUrl,
        rtmpsKey
    } = req.body;
    console.log(`Received - VideoFile: ${videoFile}, RTMPS URL: ${rtmpsUrl}, RTMPS Key: ${rtmpsKey}`);
    // Check for valid video file extension
    if (!validVideoExtensions.test(videoFile)) {
        return res.status(400).send('Invalid video file type.');
    }

    // Remove any path traversal characters
    videoFile = videoFile.replace(/^.*[\\\/]/, '');

    if (rtmpsUrl && rtmpsKey && videoFile) {
        startStreaming(rtmpsUrl, rtmpsKey, io, videoFile); // Pass the video filename to startStreaming
        res.send({
            message: 'Streaming started'
        });
    } else {
        res.status(400).send('RTMPS URL, key, and video file are required');
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
    io.emit('message', `File uploaded successfully: ${req.file.filename}`); // Emitting message to the client with file name
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