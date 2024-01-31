const { exec } = require('child_process');

let ffmpegProcess; // Define the variable at the top level

function startStreaming(rtmpsUrl, rtmpsKey, socket) {
    const ffmpegCommand = `ffmpeg -stream_loop -1 -re -i /usr/src/app/src/public/testvideo.mp4 -c copy -f flv ${rtmpsUrl}/${rtmpsKey}`;
    ffmpegProcess = exec(ffmpegCommand, (error, stdout, stderr) => {
        if (error) {
            socket.emit('message', `Error: ${error.message}`);
            return;
        }
        if (stderr) {
            socket.emit('message', `FFmpeg: ${stderr}`); // Send FFmpeg messages to the socket
        }
    });
}

function stopStreaming(socket) {
    if (ffmpegProcess) {
        console.log('Sending SIGINT to FFmpeg process...');
        ffmpegProcess.kill('SIGINT');
        ffmpegProcess.on('close', () => {
            socket.emit('message', 'Streaming stopped');
            console.log('FFmpeg process terminated.');
        });
    } else {
        console.log('No FFmpeg process to stop.');
        socket.emit('message', 'No streaming process to stop');
    }
}

module.exports = {
    startStreaming,
    stopStreaming
};
