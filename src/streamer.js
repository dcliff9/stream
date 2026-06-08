// Placeholder-stream engine.
//
// Tracks one FFmpeg child process PER live input (keyed by an `id`), so several
// inputs can run placeholder loops at once and each can be started/stopped
// independently. State is derived from the real process lifecycle (spawn →
// survives startup = running; early exit = error), not a hopeful boolean.

const { spawn } = require('child_process');

// id -> { child, status, startedAt, error, stderrTail }
// status: 'starting' | 'running' | 'error' | 'stopped'
const streams = new Map();

const STARTUP_GRACE_MS = 4000; // survive this long without exiting → "running"

function buildArgs(videoPath, target) {
    // Re-encode (don't -c copy): looping with stream copy produces broken,
    // non-monotonic timestamps that Cloudflare rejects. A clean H.264/AAC
    // re-encode with a ~2s GOP is what Live ingest wants.
    return [
        '-re', '-stream_loop', '-1', '-i', videoPath,
        '-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'zerolatency', '-pix_fmt', 'yuv420p',
        '-g', '50', '-keyint_min', '50', '-sc_threshold', '0',
        '-b:v', '2500k', '-maxrate', '2500k', '-bufsize', '5000k',
        '-c:a', 'aac', '-ar', '44100', '-b:a', '128k', '-ac', '2',
        '-f', 'flv', target,
    ];
}

function lastErrLine(tail) {
    const lines = String(tail || '').trim().split('\n').filter(Boolean);
    return lines.length ? lines[lines.length - 1].slice(0, 220) : '';
}

function isLive(status) {
    return status === 'running' || status === 'starting';
}

function startStreaming(id, videoPath, rtmpUrl, rtmpKey) {
    const existing = streams.get(id);
    if (existing && isLive(existing.status)) {
        return { ok: true, status: existing.status, already: true };
    }

    // Join without a double slash (rtmpUrl usually ends with "/live/").
    const target = String(rtmpUrl).replace(/\/+$/, '') + '/' + String(rtmpKey);
    const entry = { child: null, pid: null, status: 'starting', startedAt: Date.now(), error: null, stderrTail: '' };

    let child;
    try {
        child = spawn('ffmpeg', buildArgs(videoPath, target), { stdio: ['ignore', 'ignore', 'pipe'] });
    } catch (e) {
        entry.status = 'error';
        entry.error = 'spawn failed: ' + e.message;
        streams.set(id, entry);
        return { ok: false, status: 'error', error: entry.error };
    }

    entry.child = child;
    entry.pid = child.pid;
    streams.set(id, entry);

    child.stderr.on('data', (d) => { entry.stderrTail = (entry.stderrTail + d.toString()).slice(-2000); });
    child.on('error', (err) => { entry.status = 'error'; entry.error = 'ffmpeg error: ' + err.message; });
    child.on('exit', (code, signal) => {
        if (entry.status === 'stopped') return; // deliberate stop
        if (code === 0) {
            entry.status = 'stopped';
        } else {
            entry.status = 'error';
            entry.error = `ffmpeg exited (code=${code}, signal=${signal || 'none'}). ${lastErrLine(entry.stderrTail)}`;
        }
    });

    // If it's still alive after the grace window, it connected → running.
    setTimeout(() => {
        const e = streams.get(id);
        if (e === entry && entry.status === 'starting') entry.status = 'running';
    }, STARTUP_GRACE_MS);

    console.log(`[stream] start id=${id} pid=${child.pid} -> ${target}`);
    return { ok: true, status: 'starting' };
}

function stopStreaming(id) {
    const entry = streams.get(id);
    if (!entry) return { ok: true, status: 'idle', notRunning: true };
    entry.status = 'stopped';
    try { if (entry.child) entry.child.kill('SIGKILL'); } catch (e) { /* already gone */ }
    streams.delete(id);
    console.log(`[stream] stop id=${id}`);
    return { ok: true, status: 'stopped' };
}

function describe(id, e) {
    return { id, status: e.status, isStreaming: isLive(e.status), since: e.startedAt, error: e.error || null };
}

function getState(id) {
    if (id) {
        const e = streams.get(id);
        return e ? describe(id, e) : { id, status: 'idle', isStreaming: false, since: null, error: null };
    }
    const out = {};
    for (const [k, e] of streams) out[k] = describe(k, e);
    return { streams: out };
}

module.exports = { startStreaming, stopStreaming, getState };
