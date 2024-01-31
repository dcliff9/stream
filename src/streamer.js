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
        console.log('Attempting to stop FFmpeg process...');
        socket.emit('message', 'Attempting to stop FFmpeg process...');

        ffmpegProcess.kill('SIGINT');

        ffmpegProcess.on('close', (code, signal) => {
            console.log(`FFmpeg process terminated with code: ${code}, signal: ${signal}`);
            socket.emit('message', `FFmpeg process terminated with code: ${code}, signal: ${signal}`);
        });

        ffmpegProcess.on('error', (err) => {
            console.log(`Failed to stop FFmpeg process: ${err}`);
            socket.emit('message', `Failed to stop FFmpeg process: ${err}`);
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
