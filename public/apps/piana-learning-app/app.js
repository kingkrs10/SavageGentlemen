// --- AUDIO CONTEXT SETUP ---
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx;

const noteFrequencies = {
    'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
    'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
    'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
    'C5': 523.25
};
const whiteKeys = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
const notesArray = Object.keys(noteFrequencies);

// Config
let selectedSynth = 'sine';
let selectedVisual = 'splash';

// --- DOM ELEMENTS ---
const mainMenu = document.getElementById('main-menu');
const hud = document.getElementById('hud');
const pianoContainer = document.getElementById('piano-container');
const waterfallContainer = document.getElementById('waterfall-container');
const btnMenu = document.getElementById('btn-menu');
const modeButtons = document.querySelectorAll('.menu-btn');
const uiSynthVoice = document.getElementById('synth-voice');
const uiVisualStyle = document.getElementById('visual-style');
const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const levelEl = document.getElementById('level');
const messageEl = document.getElementById('message');
const scoreDisplay = document.getElementById('score-display');
const targetSequenceEl = document.getElementById('target-sequence');
const targetNotesEl = document.getElementById('target-notes');

const songSelectorContainer = document.getElementById('song-selector-container');
const songSelector = document.getElementById('song-selector');
const btnStartSong = document.getElementById('btn-start-song');

// --- APP STATE ---
let currentMode = 'freeplay'; // freeplay, bossbattle, fallingkeys, learnsong
let score = 0;
let level = 1;

// Boss Battle state
let bossSequence = [];
let userSequenceIndex = 0;

// Learn Song & Waterfall state
const songs = {
    twinkle: ['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4', '0', 'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4'],
    mary: ['E4', 'D4', 'C4', 'D4', 'E4', 'E4', 'E4', '0', 'D4', 'D4', 'D4', '0', 'E4', 'G4', 'G4'],
    ode: ['E4', 'E4', 'F4', 'G4', 'G4', 'F4', 'E4', 'D4', 'C4', 'C4', 'D4', 'E4', 'E4', 'D4', 'D4'],
    starwars: ['C4', '0', 'G4', '0', 'F4', 'E4', 'D4', 'C5', '0', 'G4', '0', 'F4', 'E4', 'D4', 'C5', '0', 'G4', '0', 'F4', 'E4', 'F4', 'D4'],
    happybday: ['F4', 'F4', 'G4', 'F4', 'A#4', 'A4', '0', 'F4', 'F4', 'G4', 'F4', 'C5', 'A#4'],
    pirates: ['C4', 'D4', 'E4', 'E4', '0', 'E4', 'F#4', 'G4', 'G4', '0', 'G4', 'A4', 'F#4', 'F#4', '0', 'E4', 'D4', 'D4', 'E4']
};
let currentSongTarget = [];
let songIndex = 0;

// Waterfall state
let activeFallingNotes = [];
let lastDropTime = 0;
let dropSpeed = 3000; // ms to reach bottom
let dropInterval = 1000; // ms between drops
let waterfallActive = false;

// --- VISUALS (CANVAS) ---
let width, height;
function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let particles = [];
let soundWaves = [];
let lasers = [];

class Particle {
    constructor(x, y, color, type) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.life = 1.0;
        this.type = type;

        if (type === 'fireworks') {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 8 + 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.radius = Math.random() * 4 + 2;
            this.decay = Math.random() * 0.02 + 0.01;
        } else {
            // Splash
            this.vx = (Math.random() - 0.5) * 20;
            this.vy = (Math.random() - 0.5) * 20 - 5;
            this.radius = Math.random() * 15 + 5;
            this.decay = Math.random() * 0.02 + 0.01;
        }
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        if (this.type === 'splash') this.vy += 0.5; // gravity
        if (this.type === 'fireworks') this.vy += 0.1;
        this.life -= this.decay;
        this.radius *= 0.95;
    }
    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${this.color}, ${this.life})`;
        ctx.fill();
    }
}

class SoundWave {
    constructor(freq) {
        this.freq = freq;
        this.life = 1.0;
        this.yOff = Math.random() * 1000;
    }
    update() { this.life -= 0.02; }
    draw(ctx) {
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        const amplitude = 100 * this.life;
        const wavelength = 2000 / this.freq;
        for (let i = 0; i < width; i += 10) {
            // If robot/square synth, make it look jagged
            let val = Math.sin(i / wavelength + this.yOff);
            if (selectedSynth === 'square') val = val > 0 ? 1 : -1;
            ctx.lineTo(i, height / 2 + val * amplitude);
        }
        ctx.strokeStyle = `rgba(0, 243, 255, ${this.life})`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class Laser {
    constructor(x, color) {
        this.x = x;
        this.color = color;
        this.life = 1.0;
        this.width = Math.random() * 10 + 5;
    }
    update() { this.life -= 0.05; }
    draw(ctx) {
        ctx.fillStyle = `rgba(${this.color}, ${this.life * 0.8})`;
        ctx.fillRect(this.x - this.width / 2, 0, this.width, height);
        // Core
        ctx.fillStyle = `rgba(255,255,255, ${this.life})`;
        ctx.fillRect(this.x - 2, 0, 4, height);
    }
}

function animate(timestamp) {
    // Background based on mode
    ctx.fillStyle = selectedVisual === 'engineering' ? 'rgba(5, 5, 16, 0.2)' : 'rgba(10, 10, 42, 0.2)';
    ctx.fillRect(0, 0, width, height);

    if (selectedVisual === 'engineering') {
        ctx.strokeStyle = 'rgba(157, 0, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < width; i += 50) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke(); }
        for (let i = 0; i < height; i += 50) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke(); }

        soundWaves = soundWaves.filter(w => w.life > 0);
        soundWaves.forEach(w => { w.update(); w.draw(ctx); });
    } else if (selectedVisual === 'lasers') {
        lasers = lasers.filter(l => l.life > 0);
        lasers.forEach(l => { l.update(); l.draw(ctx); });
    } else {
        particles = particles.filter(p => p.life > 0);
        particles.forEach(p => { p.update(); p.draw(ctx); });
    }

    // Waterfall Loop
    if (currentMode === 'fallingkeys' && waterfallActive) {
        updateWaterfall(timestamp);
    }

    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

// --- AUDIO SYNTHESIS ---
function playTone(freq) {
    if (!audioCtx) audioCtx = new AudioContext();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = selectedSynth;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.5);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 1.5);
}

// --- VISUAL TRIGGERS ---
function getRandomColor() {
    const colors = ['255, 0, 234', '0, 243, 255', '157, 0, 255', '255, 255, 0', '0, 255, 106'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function triggerVisuals(note, rect) {
    if (selectedVisual === 'engineering') {
        soundWaves.push(new SoundWave(noteFrequencies[note]));
    } else if (selectedVisual === 'lasers') {
        const x = rect.left + rect.width / 2;
        lasers.push(new Laser(x, getRandomColor()));
    } else {
        const x = rect.left + rect.width / 2;
        const y = rect.top;
        const color = getRandomColor();
        const count = selectedVisual === 'fireworks' ? 40 : 20;
        for (let i = 0; i < count; i++) {
            particles.push(new Particle(x, y, color, selectedVisual));
        }
    }
}

// --- GAMIFICATION LOGIC ---

function updateScore(points) {
    score += points;
    scoreEl.innerText = score;
    scaleHUD(scoreEl);
}

function scaleHUD(el) {
    el.style.transform = 'scale(1.5)';
    setTimeout(() => el.style.transform = 'scale(1)', 200);
}

function handleInput(note) {
    // Freeplay / General visuals
    if (currentMode === 'freeplay') {
        updateScore(1);
    }
    else if (currentMode === 'bossbattle') {
        if (note === bossSequence[userSequenceIndex]) {
            // Hit
            userSequenceIndex++;
            updateScore(10);
            renderBossNotes();

            if (userSequenceIndex === bossSequence.length) {
                // Won round
                messageEl.innerText = "Boss Defeated! Level Up!";
                level++;
                levelEl.innerText = level;
                updateScore(100);
                setTimeout(startBossBattleRound, 2000); // start next

                // Blast confetti
                for (let i = 0; i < 100; i++) particles.push(new Particle(width / 2, height, getRandomColor(), 'fireworks'));
            }
        } else {
            // Miss
            userSequenceIndex = 0;
            score = Math.max(0, score - 5);
            scoreEl.innerText = score;
            messageEl.innerText = "Wrong! Try again!";
            renderBossNotes();
        }
    }
    else if (currentMode === 'learnsong') {
        if (currentSongTarget[songIndex] === '0') songIndex++; // skip rests

        if (note === currentSongTarget[songIndex]) {
            songIndex++;
            updateScore(15);
            if (songIndex >= currentSongTarget.length) {
                messageEl.innerText = "Song Completed! Brilliant!";
                clearHighlights();
                setTimeout(() => setMode('freeplay'), 3000);
            } else {
                updateSongHighlight();
            }
        } else {
            score = Math.max(0, score - 5);
            scoreEl.innerText = score;
        }
    }
    else if (currentMode === 'fallingkeys') {
        // Find if a falling note matches and is within hit range
        let hitMade = false;
        for (let i = 0; i < activeFallingNotes.length; i++) {
            const fn = activeFallingNotes[i];

            if (fn.note === note && !fn.hit) {
                // Calculate position percentage
                const elapsed = performance.now() - fn.startTime;
                const progress = elapsed / dropSpeed;

                // If it's near the bottom (0.75 to 1.0)
                if (progress > 0.75 && progress < 1.1) {
                    fn.hit = true;
                    fn.element.remove();
                    updateScore(20);
                    hitMade = true;
                    // Sparkles inside the piano container!
                    triggerVisuals(note, document.querySelector(`.key[data-note="${note}"]`).getBoundingClientRect());
                    break;
                }
            }
        }
    }
}

// Boss Battle
function startBossBattleRound() {
    userSequenceIndex = 0;
    bossSequence = [];
    messageEl.innerText = "Boss Battle! Play the sequence.";

    // Difficulty increases with level
    const len = Math.min(3 + level, 8);
    for (let i = 0; i < len; i++) {
        bossSequence.push(whiteKeys[Math.floor(Math.random() * whiteKeys.length)]);
    }
    renderBossNotes();
}

function renderBossNotes() {
    let html = '';
    bossSequence.forEach((note, index) => {
        if (index < userSequenceIndex) html += `<span class="note-hit">${note}</span> `;
        else if (index === userSequenceIndex) html += `<span class="note-pending">${note}</span> `;
        else html += `<span style="opacity:0.2">${note}</span> `;
    });
    targetNotesEl.innerHTML = html;
}

// Learn Song
function updateSongHighlight() {
    clearHighlights();

    // Skip rests automatically
    if (currentSongTarget[songIndex] === '0') {
        songIndex++;
        if (songIndex >= currentSongTarget.length) return;
    }

    const note = currentSongTarget[songIndex];
    if (note) {
        document.querySelector(`.key[data-note="${note}"]`).classList.add('highlight');
        messageEl.innerText = `Play: ${note}`;
    }
}
function clearHighlights() {
    document.querySelectorAll('.key.highlight').forEach(el => el.classList.remove('highlight'));
}

// Waterfall / Falling Keys Song Challenge
function spawnFallingNote() {
    if (songIndex >= currentSongTarget.length) {
        // Song finished generating drops. Wait for them to land.
        if (activeFallingNotes.length === 0) {
            waterfallActive = false;
            messageEl.innerText = "Song Completed! Great Job!";
            setTimeout(() => setMode('menu'), 4000);
        }
        return;
    }

    const note = currentSongTarget[songIndex];
    songIndex++;

    if (note === '0') {
        // Rest - no note spawns this beat
        return;
    }

    const isBlack = note.includes('#');

    // Determine positioning logic mirroring style.css (simplified)
    const baseOffset = (whiteKeys.indexOf(note.replace('#', '')) / 8) * 100;
    let leftPct = baseOffset;
    if (note === 'C#4') leftPct = 12.5 * 1 - 4;
    else if (note === 'D#4') leftPct = 12.5 * 2 - 4;
    else if (note === 'F#4') leftPct = 12.5 * 4 - 4;
    else if (note === 'G#4') leftPct = 12.5 * 5 - 4;
    else if (note === 'A#4') leftPct = 12.5 * 6 - 4;

    const el = document.createElement('div');
    el.className = `falling-note ${isBlack ? 'black-key' : ''}`;
    el.style.left = `${leftPct}%`;
    el.style.top = '-50px';
    waterfallContainer.appendChild(el);

    activeFallingNotes.push({
        note: note,
        element: el,
        startTime: performance.now(),
        hit: false
    });
}

function updateWaterfall(timestamp) {
    if (timestamp - lastDropTime > dropInterval) {
        spawnFallingNote();
        lastDropTime = timestamp;
        // gradually increase speed
        if (dropInterval > 600) dropInterval -= 10;
        if (dropSpeed > 1000) dropSpeed -= 5;
    }

    // animate drop
    for (let i = activeFallingNotes.length - 1; i >= 0; i--) {
        const fn = activeFallingNotes[i];
        if (fn.hit) {
            activeFallingNotes.splice(i, 1);
            continue;
        }

        const elapsed = timestamp - fn.startTime;
        const progress = elapsed / dropSpeed;

        if (progress > 1.2) {
            // Missed entirely
            fn.element.remove();
            activeFallingNotes.splice(i, 1);
            score = Math.max(0, score - 5);
            scoreEl.innerText = score;
        } else {
            // Move down vertically. Container height represents 100% distance to keys
            fn.element.style.transform = `translateY(${progress * waterfallContainer.clientHeight}px)`;

            // Highlight note warning when it gets low
            if (progress > 0.8) {
                fn.element.style.boxShadow = `0 0 20px var(--neon-pink)`;
                fn.element.style.backgroundColor = `var(--neon-pink)`;
            }
        }
    }
}


// --- DOM EVENT LISTENERS ---

uiSynthVoice.addEventListener('change', (e) => selectedSynth = e.target.value);
uiVisualStyle.addEventListener('change', (e) => selectedVisual = e.target.value);

btnMenu.addEventListener('click', () => {
    mainMenu.classList.remove('hidden');
    hud.classList.add('hidden');
    pianoContainer.classList.add('hidden');
    waterfallContainer.classList.add('hidden');
    currentMode = 'menu';
    waterfallActive = false;
    clearHighlights();
    activeFallingNotes.forEach(fn => fn.element.remove());
    activeFallingNotes = [];
});

modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        setMode(btn.dataset.mode);
    });
});

btnStartSong.addEventListener('click', () => {
    currentSongTarget = songs[songSelector.value];
    songIndex = 0;

    if (currentMode === 'learnsong') {
        updateSongHighlight();
        messageEl.innerText = "Follow the highlighted keys!";
    } else if (currentMode === 'fallingkeys') {
        waterfallActive = true;
        lastDropTime = performance.now();
        messageEl.innerText = "Hit the keys before they land!";
        songSelectorContainer.classList.add('hidden'); // Hide selector while playing
    }
});

function setMode(mode) {
    currentMode = mode;
    score = 0;
    level = 1;
    scoreEl.innerText = "0";
    levelEl.innerText = "1";

    // Hide all
    mainMenu.classList.add('hidden');
    hud.classList.remove('hidden');
    pianoContainer.classList.remove('hidden');
    waterfallContainer.classList.add('hidden');
    songSelectorContainer.classList.add('hidden');
    targetSequenceEl.classList.add('hidden');
    scoreDisplay.classList.remove('hidden');
    clearHighlights();
    messageEl.innerText = "";
    activeFallingNotes.forEach(fn => fn.element.remove());
    activeFallingNotes = [];

    // Reset Audio context (browser requirement)
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

    if (mode === 'freeplay') {
        messageEl.innerText = "Play anything! Make some noise!";
    }
    else if (mode === 'bossbattle') {
        targetSequenceEl.classList.remove('hidden');
        startBossBattleRound();
    }
    else if (mode === 'fallingkeys') {
        waterfallContainer.classList.remove('hidden');
        songSelectorContainer.classList.remove('hidden');
        messageEl.innerText = "Select a song for the Waterfall Challenge!";
        waterfallActive = false;
        dropSpeed = 3500; // slower for learning
        dropInterval = 1200;
    }
    else if (mode === 'learnsong') {
        songSelectorContainer.classList.remove('hidden');
        messageEl.innerText = "Select a song to learn!";
        scoreDisplay.classList.add('hidden');
    }
}

// Input Handling
const keys = document.querySelectorAll('.key');

const playHandler = (e) => {
    if (e.cancelable) e.preventDefault();
    const key = e.currentTarget;
    if (!key.classList.contains('active')) {
        key.classList.add('active');
        const note = key.getAttribute('data-note');
        playTone(noteFrequencies[note]);
        triggerVisuals(note, key.getBoundingClientRect());
        handleInput(note);
    }
};

const stopHandler = (e) => {
    if (e.cancelable) e.preventDefault();
    e.currentTarget.classList.remove('active');
};

keys.forEach(key => {
    key.addEventListener('mousedown', playHandler);
    key.addEventListener('mouseup', stopHandler);
    key.addEventListener('mouseleave', stopHandler);

    key.addEventListener('touchstart', playHandler, { passive: false });
    key.addEventListener('touchend', stopHandler, { passive: false });
    key.addEventListener('touchcancel', stopHandler, { passive: false });
});

const keyboardMap = {
    'a': 'C4', 'w': 'C#4', 's': 'D4', 'e': 'D#4', 'd': 'E4',
    'f': 'F4', 't': 'F#4', 'g': 'G4', 'y': 'G#4', 'h': 'A4',
    'u': 'A#4', 'j': 'B4', 'k': 'C5'
};

window.addEventListener('keydown', (e) => {
    if (e.repeat) return; // ignore hold
    const note = keyboardMap[e.key.toLowerCase()];
    if (note) {
        const keyEl = document.querySelector(`.key[data-note="${note}"]`);
        if (keyEl) {
            keyEl.classList.add('active');
            playTone(noteFrequencies[note]);
            triggerVisuals(note, keyEl.getBoundingClientRect());
            handleInput(note);
        }
    }
});

window.addEventListener('keyup', (e) => {
    const note = keyboardMap[e.key.toLowerCase()];
    if (note) {
        const keyEl = document.querySelector(`.key[data-note="${note}"]`);
        if (keyEl) keyEl.classList.remove('active');
    }
});

// --- MIDI HARDWARE SUPPORT ---
/* 
Standard MIDI mapping:
C4 (Middle C) = 60. Hardware C5 = 72. 
*/
const midiToNoteMap = {
    60: 'C4', 61: 'C#4', 62: 'D4', 63: 'D#4',
    64: 'E4', 65: 'F4', 66: 'F#4', 67: 'G4',
    68: 'G#4', 69: 'A4', 70: 'A#4', 71: 'B4',
    72: 'C5'
};

if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess()
        .then(onMIDISuccess, onMIDIFailure);
} else {
    console.warn("Web MIDI API not supported in this browser.");
}

function onMIDISuccess(midiAccess) {
    console.log('MIDI Input Successful');

    // Check if any inputs are already connected
    const inputs = midiAccess.inputs.values();
    for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
        input.value.onmidimessage = handleMIDIMessage;
        setMIDIStatus(true);
    }

    // Listen for new connections/disconnections
    midiAccess.onstatechange = (e) => {
        if (e.port.type === 'input') {
            if (e.port.state === 'connected') {
                e.port.onmidimessage = handleMIDIMessage;
                setMIDIStatus(true);
            } else {
                setMIDIStatus(false);
            }
        }
    };
}

function onMIDIFailure() {
    console.warn('Could not access your MIDI devices.');
}

function setMIDIStatus(online) {
    if (online) {
        midiStatusEl.classList.remove('offline');
        midiStatusEl.classList.add('online');
        midiStatusEl.innerText = "MIDI: Online";
    } else {
        midiStatusEl.classList.remove('online');
        midiStatusEl.classList.add('offline');
        midiStatusEl.innerText = "MIDI: Offline";
    }
}

function handleMIDIMessage(event) {
    // Determine the type of MIDI message
    const command = event.data[0];
    const midiNote = event.data[1];
    const velocity = (event.data.length > 2) ? event.data[2] : 0; // Volume

    // Command 144 is NoteOn, Command 128 is NoteOff.
    // Some keyboards send NoteOn with velocity 0 instead of NoteOff.
    const noteVal = midiToNoteMap[midiNote];

    if (!noteVal) return; // Ignore notes outside our C4-C5 range

    if (command === 144 && velocity > 0) {
        // Trigger Note On
        const keyEl = document.querySelector(`.key[data-note="${noteVal}"]`);
        if (keyEl && !keyEl.classList.contains('active')) {
            keyEl.classList.add('active');
            playTone(noteFrequencies[noteVal]);
            triggerVisuals(noteVal, keyEl.getBoundingClientRect());
            handleInput(noteVal);
        }
    } else if (command === 128 || (command === 144 && velocity === 0)) {
        // Trigger Note Off
        const keyEl = document.querySelector(`.key[data-note="${noteVal}"]`);
        if (keyEl) {
            keyEl.classList.remove('active');
        }
    }
}
