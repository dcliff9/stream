const express = require('express');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { startStreaming, stopStreaming } = require('./streamer'); // Make sure to require the streamer.js

const port = process.env.PORT || 3000;

app.use(express.static('public')); // Serve static files
app.use(express.json()); // for parsing application/json

io.on('connection', (socket) => {
    console.log('a user connected');

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });

    app.post('/start-streaming', (req, res) => {
        const { rtmpsUrl, rtmpsKey } = req.body;
        startStreaming(rtmpsUrl, rtmpsKey, socket);
        res.status(200).send('Streaming started');
    });

    app.post('/stop-streaming', (req, res) => {
        stopStreaming(socket);
        res.status(200).send('Stop streaming requested');
    });
});

server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
