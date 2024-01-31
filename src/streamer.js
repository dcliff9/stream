const {
    exec
} = require('child_process');

let ffmpegProcess; // Define the variable at the top level

function startStreaming(srtUrl) {
    const ffmpegCommand = `ffmpeg -re -i public/testvideo.mp4 -c copy -f mpegts ${srtUrl}`;
    ffmpegProcess = exec(ffmpegCommand, (error, stdout, stderr) => { // Assign the process here
        if (error) {
            console.error(`Error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return;
        }
        console.log(`Stdout: ${stdout}`);
    });
}

function stopStreaming() {
    if (ffmpegProcess) {
        ffmpegProcess.kill('SIGINT'); // Sends SIGINT to stop FFmpeg gracefully
    }
}

module.exports = {
    startStreaming,
    stopStreaming
};