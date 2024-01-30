const express = require('express');
const app = express();
const port = process.env.PORT || 3000;
const { exec } = require("child_process");

// Serve static files from the "public" directory
app.use(express.static('public'));

// FFmpeg version check endpoint
app.get('/ffmpeg-version', (req, res) => {
  exec("ffmpeg -version", (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`);
      return res.send(`Error occurred: ${error.message}`);
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`);
      return res.send(`Error occurred: ${stderr}`);
    }
    res.send(`FFmpeg version: ${stdout}`);
  });
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
