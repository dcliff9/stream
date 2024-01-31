const server = require('http').createServer(app);
const io = require('socket.io')(server);
const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const {
    exec
} = require("child_process");
const path = require('path');

const {
    startStreaming,
    stopStreaming
} = require('./streamer'); // Adjust as necessary
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
    const {
        rtmpsUrl,
        rtmpsKey
    } = req.body; // Extract RTMPS info from the request body
    if (rtmpsUrl && rtmpsKey) {
        startStreaming(rtmpsUrl, rtmpsKey, (logMessage) => {
            res.send(logMessage); // Send log message in the response
        });
    } else {
        res.status(400).send('RTMPS URL and key are required');
    }
});

app.post('/stop-streaming', (req, res) => {
    stopStreaming((logMessage) => {
        res.send(logMessage); // Send log message in the response
    });
});

io.on('connection', socket => {
    console.log('a user connected');
});

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});