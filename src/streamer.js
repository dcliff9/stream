const { exec } = require('child_process');

let ffmpegProcess; // Define the variable at the top level

function startStreaming(rtmpsUrl, rtmpsKey, io, filename) {
    console.log(`Start streaming called with filename: ${filename}`); // Log the received filename
    const videoPath = `/usr/src/app/src/public/videos/${filename}`; // Set the path directly
    console.log(`Constructed video path: ${videoPath}`); // Log the constructed video path

    // Emit a message to the client with the filename
    io.emit('message', `File ${filename} started streaming.`);
    const ffmpegCommand = `ffmpeg -stream_loop -1 -re -i "${videoPath}" -c copy -f flv ${rtmpsUrl}/${rtmpsKey}`;
    console.log(`FFmpeg command: ${ffmpegCommand}`); // Log the FFmpeg command

    ffmpegProcess = exec(ffmpegCommand, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`); // Log any errors from FFmpeg
            io.emit('message', `Error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`FFmpeg STDERR: ${stderr}`); // Log any stderr from FFmpeg
        }
    });

    // Emit a message right after starting the FFmpeg process
    io.emit('message', 'Attempting to start streaming...');

    ffmpegProcess.stderr.on('data', (data) => {
        console.error(`FFmpeg: ${data}`); // Log any data received from FFmpeg's stderr
        io.emit('message', `FFmpeg: ${data}`);
    });

    ffmpegProcess.on('close', (code) => {
        console.log(`FFmpeg process exited with code ${code}`); // Log the exit code of FFmpeg
        io.emit('message', `FFmpeg process exited with code ${code}`);
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
