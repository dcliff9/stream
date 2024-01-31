const { exec } = require('child_process');

let ffmpegProcess; // Define the variable at the top level

function startStreaming(rtmpsUrl, rtmpsKey, socket) {
    const ffmpegCommand = `ffmpeg -stream_loop -1 -re -i /usr/src/app/src/public/videos/testvideo.mp4 -c copy -f flv ${rtmpsUrl}/${rtmpsKey}`;
    ffmpegProcess = exec(ffmpegCommand, (error, stdout, stderr) => {
        if (error) {
            socket.emit('message', `Error: ${error.message}`);
            return;
        }
    });

    // Emit a message right after starting the FFmpeg process
    socket.emit('message', 'Attempting to start streaming...');

    ffmpegProcess.stderr.on('data', (data) => {
        socket.emit('message', `FFmpeg: ${data}`);
    });

    ffmpegProcess.on('close', (code) => {
        socket.emit('message', `FFmpeg process exited with code ${code}`);
    });
}



function stopStreaming(socket) {
    if (ffmpegProcess) {
        console.log('Attempting to stop FFmpeg process...');
        socket.emit('message', 'Attempting to stop FFmpeg process...');

        // Try sending SIGTERM first
        ffmpegProcess.kill('SIGTERM');

        // Set a timeout to forcefully kill the process if it doesn't exit
        setTimeout(() => {
            console.log('Forcefully terminating FFmpeg process...');
            exec(`pkill -f ffmpeg`, (error, stdout, stderr) => {
                if (error) {
                    console.log(`Error while forcefully terminating FFmpeg: ${error}`);
                    socket.emit('message', `Error while forcefully terminating FFmpeg: ${error}`);
                    return;
                }
                if (stderr) {
                    console.log(`FFmpeg termination STDERR: ${stderr}`);
                }
                console.log('FFmpeg process forcefully terminated.');
                socket.emit('message', 'FFmpeg process forcefully terminated.');
            });
        }, 5000); // 5 seconds timeout for graceful shutdown

    } else {
        console.log('No FFmpeg process to stop.');
        socket.emit('message', 'No streaming process to stop');
    }
}



module.exports = {
    startStreaming,
    stopStreaming
};
