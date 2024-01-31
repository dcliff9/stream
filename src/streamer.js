const {
    exec
} = require('child_process');

let ffmpegProcess; // Define the variable at the top level

function startStreaming(srtUrl, logCallback) {
    const ffmpegCommand = `ffmpeg -re -i /usr/src/app/public/testvideo.mp4 -c copy -f mpegts ${srtUrl}`;
    ffmpegProcess = exec(ffmpegCommand, (error, stdout, stderr) => {
        if (error) {
            logCallback(`Error: ${error.message}`);
        }
        if (stderr) {
            logCallback(`FFmpeg Stderr: ${stderr}`);
        }
    });
}

function stopStreaming(logCallback) {
    if (ffmpegProcess) {
        ffmpegProcess.kill('SIGINT');
        logCallback('Streaming stopped');
    } else {
        logCallback('No streaming process to stop');
    }
}


module.exports = {
    startStreaming,
    stopStreaming
};