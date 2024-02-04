const { exec } = require('child_process');

let ffmpegProcess; // Define the variable at the top level

const streamState = {
    isStreaming: false
};

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
            streamState.isStreaming = false; // Update the state to false, as the stream failed to start
            return;
        }
        if (stderr) {
            console.error(`FFmpeg STDERR: ${stderr}`); // Log any stderr from FFmpeg
        }
        streamState.isStreaming = true; // Update the state to true, as the stream started successfully
    });

    // Emit a message right after starting the FFmpeg process
    io.emit('message', 'Attempting to start streaming...');
    ffmpegPID = ffmpegProcess.pid; //Log PID of ffmpeg process
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

        // Directly use pkill to forcefully terminate the FFmpeg process
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
            streamState.isStreaming = false;
            console.log('FFmpeg process forcefully terminated.');
            socket.emit('message', 'FFmpeg process forcefully terminated.');
        });
    } else {
        console.log('No FFmpeg process to stop.');
        socket.emit('message', 'No streaming process to stop');
    }
}

function isStreamActive() {
    return streamState.isStreaming;
}



module.exports = {
    startStreaming,
    stopStreaming,
    isStreamActive
};
