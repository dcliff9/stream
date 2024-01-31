const {
    exec
} = require('child_process');

let ffmpegProcess; // Define the variable at the top level

function startStreaming(rtmpsUrl, rtmpsKey, logCallback) {
    const ffmpegCommand = `ffmpeg -stream_loop -1 -re -i /usr/src/app/src/public/testvideo.mp4 ` +
        `-c:v libx264 -b:v 3000k -maxrate 3000k -bufsize 6000k ` + // Video bitrate 3000 kbps max
        `-c:a aac -b:a 192k -ar 48000 ` + // Audio bitrate 192 kbps, sample rate 48 kHz
        `-s 1920x1080 -r 30 ` + // Resolution 1920x1080 and 30 fps
        `-f flv ${rtmpsUrl}/${rtmpsKey}`; // Output format and RTMPS destination
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