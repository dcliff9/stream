const { exec } = require('child_process');

function startStreaming() {
    const ffmpegCommand = `ffmpeg -re -i public/testvideo.mp4 -c copy -f mpegts srt://live.cloudflare.com:778?passphrase=35bbea4e2f113e275deb2ac0d6faa73ck9691471ab502a7d6da1cc1ac66ef7b4b&streamid=9691471ab502a7d6da1cc1ac66ef7b4b`;
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

module.exports = { startStreaming };
