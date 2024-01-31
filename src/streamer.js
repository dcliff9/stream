const {
    exec
} = require('child_process');

let ffmpegProcess; // Define the variable at the top level

function startStreaming(rtmpsUrl, rtmpsKey, logCallback) {
    const ffmpegCommand = `ffmpeg -stream_loop -1 -re -i /usr/src/app/src/public/testvideo.mp4 -c copy -f flv ${rtmpsUrl}/${rtmpsKey}`;
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
        console.log('Sending SIGINT to FFmpeg process...');
        ffmpegProcess.kill('SIGINT');
        ffmpegProcess.on('close', () => {
            logCallback('Streaming stopped');
            console.log('FFmpeg process terminated.');
        });
    } else {
        console.log('No FFmpeg process to stop.');
        logCallback('No streaming process to stop');
    }
}



module.exports = {
    startStreaming,
    stopStreaming
};