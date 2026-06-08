const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

const cors = require('cors');
app.use(cors({
    origin: 'https://hitchstream.com', // WordPress site (server-to-server calls have no Origin and are unaffected)
    methods: 'GET,POST,PUT,DELETE',
    credentials: true
}));

// The manual web panel + its Socket.IO feed were removed. FFmpeg status used to
// be broadcast over Socket.IO to that panel; now it just goes to the server log.
// streamer.js still calls `.emit(...)`, so we hand it this tiny stub. This MUST
// be set on module.exports BEFORE requiring ./routes/apiRoutes (which reads it).
module.exports.io = { emit: (_event, msg) => console.log('[stream]', String(msg)) };

const apiRoutes = require('./routes/apiRoutes');

app.use(express.json());
app.use('/api', apiRoutes);

// Bare health response — no controls, no interface.
app.get('/', (req, res) => res.type('text').send('HitchStream streamer service — API only.'));

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
