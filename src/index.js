const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const cors = require('cors');
app.use(cors({
    origin: 'https://hitchstream.com', // WordPress site (server-to-server calls have no Origin and are unaffected)
    methods: 'GET,POST,PUT,DELETE',
    credentials: true
}));

// The manual web panel + its Socket.IO feed were removed; FFmpeg status now
// just goes to the server log (see streamer.js).
const apiRoutes = require('./routes/apiRoutes');

app.use(express.json());
app.use('/api', apiRoutes);

// Bare health response — no controls, no interface.
app.get('/', (req, res) => res.type('text').send('HitchStream streamer service — API only.'));

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
