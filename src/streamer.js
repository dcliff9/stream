const {
    exec
} = require('child_process');

let ffmpegProcess; // Define the variable at the top level

function startStreaming(rtmpsUrl, rtmpsKey, logCallback) {
    const ffmpegCommand = `ffmpeg -re -i /usr/src/app/src/public/testvideo.mp4 -c copy -f flv ${rtmpsUrl}/${rtmpsKey}`;
    ffmpegProcess = exec(ffmpegCommand, (error, stdout, stderr) => {
        if (error) {
            logCallback(`Error: ${error.message}`);
            return;
        }
        if (stderr) {
            logCallback(`FFmpeg: ${stderr}`); // Send FFmpeg messages to the log callback
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