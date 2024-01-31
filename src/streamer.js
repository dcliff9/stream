const {
    exec
} = require('child_process');

function startStreaming(srtUrl) {
    const ffmpegCommand = `ffmpeg -re -i public/testvideo.mp4 -c copy -f mpegts ${srtUrl}`;
    exec(ffmpegCommand, (error, stdout, stderr) => {
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