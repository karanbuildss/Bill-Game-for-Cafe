const screen = document.getElementById("screen");
const tapSound = document.getElementById("tapSound");
const winSound = document.getElementById("winSound");
const spinWheelSound = document.getElementById("spinWheelSound");
const bgMusic = document.getElementById("bgMusic");
let players = ["", ""];
let activePlayerIndex = 0;
let lastPlayedGame = "";
const maxPlayerNameLength = 12;
const storageKey = "billRoulettePlayers";
const soundStorageKey = "billRouletteSoundEnabled";
let appAudioContext = null;
let diceRollSoundTimer = null;
let soundEnabled = true;

function playTap() {
  if (!soundEnabled) return;
  playTone(260, 0.045, 0.045, "sine");
}

function restartSound(sound) {
  if (!sound || !soundEnabled) return;

  sound.pause();
  sound.currentTime = 0;
  sound.play().catch(() => {});
}

function playBackgroundMusic() {
  if (!bgMusic || !soundEnabled) return;

  bgMusic.volume = 0.32;
  bgMusic.play().catch(() => {});
}

function stopBackgroundMusic() {
  if (!bgMusic) return;

  bgMusic.pause();
}

function getAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return null;

  if (!appAudioContext) {
    appAudioContext = new AudioContext();
  }

  if (appAudioContext.state === "suspended") {
    appAudioContext.resume().catch(() => {});
  }

  return appAudioContext;
}

function playTone(frequency, duration = 0.08, volume = 0.08, type = "sine") {
  if (!soundEnabled) return;

  const audioContext = getAudioContext();
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, now);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start(now);
  oscillator.stop(now + duration + 0.01);
}

function playAddPlayerSound() {
  if (!soundEnabled) return;
  playTone(420, 0.055, 0.055, "triangle");
  setTimeout(() => playTone(620, 0.06, 0.05, "triangle"), 45);
}

function playRemovePlayerSound() {
  if (!soundEnabled) return;
  playTone(360, 0.055, 0.05, "triangle");
  setTimeout(() => playTone(220, 0.07, 0.045, "triangle"), 45);
}

function playErrorSound() {
  if (!soundEnabled) return;
  playTone(130, 0.12, 0.06, "sawtooth");
  setTimeout(() => playTone(105, 0.1, 0.05, "sawtooth"), 80);

  if (navigator.vibrate) {
    navigator.vibrate(120);
  }
}


function playDiceRollSound() {
  if (!soundEnabled) return;
  stopDiceRollSound();

  const faceTones = [128, 148, 166, 190, 218, 246];

  diceRollSoundTimer = setInterval(() => {
    const face = Math.floor(Math.random() * faceTones.length);
    playDiceFaceHit(faceTones[face]);
  }, 68);
}

function stopDiceRollSound() {
  if (!diceRollSoundTimer) return;

  clearInterval(diceRollSoundTimer);
  diceRollSoundTimer = null;
}

function playDiceLandSound() {
  if (!soundEnabled) return;
  playTone(82, 0.12, 0.12, "triangle");
  setTimeout(() => playTone(124, 0.08, 0.075, "sine"), 45);
}

function playDiceFaceHit(frequency) {
  if (!soundEnabled) return;

  const audioContext = getAudioContext();
  if (!audioContext) return;

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  const now = audioContext.currentTime;

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(frequency, now);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.72, now + 0.045);

  filter.type = "lowpass";
  filter.frequency.setValueAtTime(520, now);
  filter.Q.setValueAtTime(1.4, now);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.09, now + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

  oscillator.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start(now);
  oscillator.stop(now + 0.07);
}

function playNeonHiss() {
  if (!soundEnabled) return;

  const audioContext = getAudioContext();
  if (!audioContext) return;

  const duration = 0.26;
  const sampleCount = audioContext.sampleRate * duration;
  const buffer = audioContext.createBuffer(1, sampleCount, audioContext.sampleRate);
  const data = buffer.getChannelData(0);

  for (let index = 0; index < sampleCount; index += 1) {
    data[index] = (Math.random() * 2 - 1) * (1 - index / sampleCount);
  }

  const noise = audioContext.createBufferSource();
  const filter = audioContext.createBiquadFilter();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;

  noise.buffer = buffer;
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(1400, now);
  filter.frequency.exponentialRampToValueAtTime(4200, now + duration);
  filter.Q.setValueAtTime(7, now);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.105, now + 0.035);
  gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(audioContext.destination);

  noise.start(now);
  noise.stop(now + duration + 0.02);
}

function playPlinkoPegSound(intensity = 1) {
  if (!soundEnabled) return;

  const nowMs = performance.now();
  if (nowMs - lastPlinkoPegSoundTime < 42) return;
  lastPlinkoPegSoundTime = nowMs;

  const audioContext = getAudioContext();
  if (!audioContext) return;

  const now = audioContext.currentTime;
  const volume = clampValue(0.025 + intensity * 0.018, 0.025, 0.07);
  const baseFrequency = 760 + Math.random() * 520;

  const gain = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  filter.type = "bandpass";
  filter.frequency.setValueAtTime(baseFrequency * 1.5, now);
  filter.Q.setValueAtTime(8, now);

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(volume, now + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);

  [baseFrequency, baseFrequency * 1.42].forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    oscillator.type = index === 0 ? "triangle" : "sine";
    oscillator.frequency.setValueAtTime(frequency, now);
    oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.72, now + 0.08);
    oscillator.connect(filter);
    oscillator.start(now);
    oscillator.stop(now + 0.095);
  });

  filter.connect(gain);
  gain.connect(audioContext.destination);
}

function loadSoundPreference() {
  soundEnabled = localStorage.getItem(soundStorageKey) !== "false";
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  localStorage.setItem(soundStorageKey, String(soundEnabled));
  stopDiceRollSound();

  if (!soundEnabled) {
    [tapSound, winSound, spinWheelSound, bgMusic].forEach(sound => {
      if (sound) sound.pause();
    });
  } else {
    playTone(520, 0.06, 0.05, "triangle");
    playBackgroundMusic();
  }

  updateSoundToggle();
}

function updateSoundToggle() {
  const soundToggle = document.getElementById("soundToggle");
  if (!soundToggle) return;

  soundToggle.textContent = soundEnabled ? "Sound On" : "Sound Off";
  soundToggle.setAttribute("aria-pressed", String(soundEnabled));
}

function setScreen(html) {
  cleanupScreenEffects();

  screen.innerHTML = `
    <button 
      id="soundToggle" 
      class="sound-toggle" 
      type="button" 
      aria-pressed="${soundEnabled}" 
      onclick="toggleSound()"
    >
      ${soundEnabled ? "Sound On" : "Sound Off"}
    </button>
    ${html}
  `;

  updateSoundToggle();
}

function cleanupScreenEffects() {
  stopSpinWheel();
  stopDiceRollGame();
}

function savePlayers() {
  const savedPlayers = players.map(player => player.trim()).filter(Boolean);
  localStorage.setItem(storageKey, JSON.stringify(savedPlayers));
}

function loadPlayers() {
  try {
    const savedPlayers = JSON.parse(localStorage.getItem(storageKey));

    if (Array.isArray(savedPlayers) && savedPlayers.length >= 2) {
      players = savedPlayers.slice(0, 12);
      return;
    }
  } catch (error) {
    localStorage.removeItem(storageKey);
  }

  players = ["", ""];
}

function clearSavedPlayers() {
  localStorage.removeItem(storageKey);
  players = ["", ""];
  activePlayerIndex = 0;
}

function showWelcome() {
  setScreen(`
    <div class="panel welcome-panel">
      <h1><span class="title-small">Bill</span><span class="title-wide">Roulette</span></h1>
      <p>A fun cafe game to decide who pays the bill.</p>
      <button class="start-button" onclick="playTap(); playBackgroundMusic(); showPlayerSetup()">Press To Start</button>
    </div>
  `);
}

function showPlayerSetup(error = "") {
  playBackgroundMusic();
  activePlayerIndex = Math.min(activePlayerIndex, players.length - 1);
  const activeName = players[activePlayerIndex] || "";
  const previousPlayers = players.slice(0, activePlayerIndex);

  setScreen(`
    <div class="panel setup-panel">
      <h2>Player Setup</h2>
      <p>Enter one player at a time. Minimum 2 players required.</p>

      <div class="player-summary">
        ${previousPlayers.length ? previousPlayers.map((name, index) => `
          <div class="player-chip">
            <span>${index + 1}. ${escapeHTML(name || `Player ${index + 1}`)}</span>
            ${index >= 2 ? `<button type="button" onclick="removePlayerInput(${index})">×</button>` : ""}
          </div>
        `).join("") : `<div class="player-empty">No players added yet</div>`}
      </div>

      <div class="active-player-card">
        <div class="active-player-label">Player ${activePlayerIndex + 1}</div>
        <input
          id="activePlayerInput"
          type="text"
          placeholder="Enter player name"
          value="${escapeHTML(activeName)}"
          maxlength="${maxPlayerNameLength}"
          oninput="updatePlayerName(${activePlayerIndex}, this.value)"
        />
      </div>

      <div class="setup-actions">
        ${activePlayerIndex > 0 ? `<button class="secondary" onclick="goToPreviousPlayerInput()">Previous</button>` : ""}
        ${activePlayerIndex < players.length - 1
          ? `<button class="secondary" onclick="goToNextPlayerInput()">Next Player</button>`
          : `<button class="secondary" onclick="addPlayerInput()">Add Another Player</button>`
        }
      </div>

      <button onclick="goToGameSelect()">Continue</button>

      ${error ? `<div class="error">${error}</div>` : ""}
    </div>
  `);

  const activeInput = document.getElementById("activePlayerInput");
  if (activeInput) activeInput.focus();
}

function escapeHTML(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function updatePlayerName(index, value) {
  players[index] = value;
  savePlayers();
}

function currentPlayerNameIsEmpty() {
  return !players[activePlayerIndex] || !players[activePlayerIndex].trim();
}

function goToNextPlayerInput() {
  playTap();

  if (currentPlayerNameIsEmpty()) {
    playErrorSound();
    showPlayerSetup(`Please enter Player ${activePlayerIndex + 1}'s name first.`);
    return;
  }

  activePlayerIndex += 1;
  showPlayerSetup();
}

function goToPreviousPlayerInput() {
  playTap();
  activePlayerIndex = Math.max(0, activePlayerIndex - 1);
  showPlayerSetup();
}

function addPlayerInput() {
  if (currentPlayerNameIsEmpty()) {
    playErrorSound();
    showPlayerSetup(`Please enter Player ${activePlayerIndex + 1}'s name first.`);
    return;
  }

  playAddPlayerSound();
  players.push("");
  activePlayerIndex = players.length - 1;
  savePlayers();
  showPlayerSetup();
}

function removePlayerInput(index) {
  if (players.length <= 2 || index < 2) return;

  playRemovePlayerSound();
  players.splice(index, 1);
  activePlayerIndex = Math.min(activePlayerIndex, players.length - 1);
  savePlayers();
  showPlayerSetup();
}

function goToGameSelect() {
  playTap();

  const validPlayers = players.map(p => p.trim()).filter(Boolean);
  const normalizedNames = validPlayers.map(name => name.toLowerCase());
  const hasDuplicateNames = normalizedNames.some((name, index) => normalizedNames.indexOf(name) !== index);

  if (validPlayers.length < 2) {
    playErrorSound();
    showPlayerSetup("Please enter at least two player names.");
    return;
  }

  if (validPlayers.some(name => name.length > maxPlayerNameLength)) {
    playErrorSound();
    showPlayerSetup(`Player names must be ${maxPlayerNameLength} characters or less.`);
    return;
  }

  if (hasDuplicateNames) {
    playErrorSound();
    showPlayerSetup("Player names must be unique.");
    return;
  }

  players = validPlayers;
  savePlayers();
  showGameSelect();
}

function showGameSelect() {
  playBackgroundMusic();
  setScreen(`
    <div class="panel game-select-panel">
      <h2>Pick a Game</h2>
      <p>${players.length} players ready</p>

      ${gameButton("Spin Wheel", "Color wheel decides who pays.", "showSpinWheel")}
      ${gameButton("Finger Chooser", "Place fingers on screen and randomly choose payer.", "showFingerChooser")}
      ${gameButton("Dice Roll", "Highest dice roll pays the bill.", "showDiceRoll")}
      ${gameButton("Plinko Board", "Drop a ball and let luck decide.", "showPlinkoBoard")}

      <button class="secondary" onclick="playTap(); showPlayerSetup()">Edit Players</button>
    </div>
  `);
}

function gameButton(title, desc, action) {
  let clickAction = `showPlaceholderResult('${title}')`;
  const iconClass = action.replace("show", "").replace("Board", "").replace("Roll", "").toLowerCase();
  const buttonLabel = {
    showSpinWheel: "Spin Now",
    showFingerChooser: "Choose Now",
    showDiceRoll: "Roll Dice",
    showPlinkoBoard: "Drop Ball"
  }[action] || "Open";

  if (action === "showSpinWheel") {
    clickAction = "showSpinWheel()";
  }

  if (action === "showFingerChooser") {
    clickAction = "showFingerChooser()";
  }

  if (action === "showDiceRoll") {
    clickAction = "showDiceRoll()";
  }

  if (action === "showPlinkoBoard") {
    clickAction = "showPlinkoBoard()";
  }

  return `
    <div class="game-card">
      <div class="arcade-marquee">${title}</div>
      <div class="game-preview ${iconClass}">${getGamePreview(action)}</div>
      <strong>${title}</strong>
      <p>${desc}</p>
      <button onclick="playTap(); ${clickAction}">${buttonLabel}</button>
    </div>
  `;
}

function getGamePreview(action) {
  const previewImages = {
    showSpinWheel: "spinwheel-card.png",
    showFingerChooser: "fingerchooser-card.png",
    showDiceRoll: "diceroll-card.png",
    showPlinkoBoard: "plinkoboard-carrd.png"
  };

  const imageName = previewImages[action];

  if (!imageName) return "";

  return `<img src="assets/images/${imageName}" alt="" aria-hidden="true">`;
}


function showPlaceholderResult(gameName) {
  playTap();

  const payer = players[Math.floor(Math.random() * players.length)];

  setTimeout(() => {
    if (winSound) winSound.play().catch(() => {});
    showResult(payer, gameName);
  }, 300);
}

function showResult(payer, gameName) {
  lastPlayedGame = gameName;
  playBackgroundMusic();

  setScreen(`
    <div class="panel">
      <h2>${payer} Pays!</h2>
      <p>${gameName} selected the payer.</p>

      <button onclick="playTap(); playAgain()">Play Again</button>
      <button onclick="playTap(); showGameSelect()">Change Game</button>
      <button class="secondary" onclick="playTap(); clearSavedPlayers(); showPlayerSetup()">Reset Players</button>
    </div>
  `);
}

function playAgain() {
  if (lastPlayedGame === "Spin Wheel") {
    showSpinWheel();
    return;
  }

  if (lastPlayedGame === "Finger Chooser") {
    showFingerChooser();
    return;
  }

  if (lastPlayedGame === "Dice Roll") {
    showDiceRoll();
    return;
  }

  if (lastPlayedGame === "Plinko Board") {
    showPlinkoBoard();
    return;
  }

  showGameSelect();
}

let wheelAngle = 0;
let isWheelSpinning = false;
let selectedWheelPayer = null;
let wheelPlayers = [];
let lastTickSliceIndex = -1;
let wheelSwipeState = null;
let wheelAnimationFrame = null;

function playWheelTick(sliceIndex) {
  if (!soundEnabled) return;

  const audioContext = getAudioContext();
  if (!audioContext) return;

  const tones = [520, 620, 740, 860, 980];
  const frequency = tones[sliceIndex % tones.length];

  const oscillator = audioContext.createOscillator();
  const gain = audioContext.createGain();
  const now = audioContext.currentTime;

  oscillator.type = "triangle";
  oscillator.frequency.value = frequency;

  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

  oscillator.connect(gain);
  gain.connect(audioContext.destination);

  oscillator.start(now);
  oscillator.stop(now + 0.09);
}

function showSpinWheel() {
  stopBackgroundMusic();
  stopSpinWheel();
  selectedWheelPayer = null;
  isWheelSpinning = false;
  wheelPlayers = shuffleItems(players);

  setScreen(`
    <div class="panel">
      <h2>Spin Wheel</h2>
      <p>Spin the wheel and let luck choose who pays.</p>

      <div class="pointer"></div>

<div class="wheel-wrap">
  <div class="wheel-stage" id="wheelStage">
    <canvas id="wheelCanvas" width="420" height="420"></canvas>
    <div id="wheelHint" class="wheel-hint">Tap or swipe to spin</div>
  </div>
</div>


      <div id="spinResult"></div>

      <button id="spinBtn" onclick="spinWheel()">Spin</button>
      <button class="secondary" onclick="playTap(); showGameSelect()">Back</button>
    </div>
  `);

  drawWheel();
  setupWheelSwipe();
}

function stopSpinWheel() {
  if (wheelAnimationFrame) {
    cancelAnimationFrame(wheelAnimationFrame);
    wheelAnimationFrame = null;
  }

  wheelSwipeState = null;
  isWheelSpinning = false;

  if (spinWheelSound) {
    spinWheelSound.pause();
    spinWheelSound.currentTime = 0;
  }

  if (winSound) {
    winSound.pause();
    winSound.currentTime = 0;
  }
}

function drawWheel() {
  const canvas = document.getElementById("wheelCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const center = size / 2;
  const radius = center - 10;
  const slice = Math.PI * 2 / wheelPlayers.length;

const colors = [
  "#ff1744", // neon red
  "#ff9100", // orange
  "#ffea00", // yellow
  "#00e676", // green
  "#00b0ff", // sky blue
  "#651fff", // purple
  "#f50057", // pink
  "#00e5ff", // cyan
  "#76ff03", // lime
  "#ff3d00"  // deep orange
];

  ctx.clearRect(0, 0, size, size);

  wheelPlayers.forEach((player, index) => {
    const start = wheelAngle + index * slice;
    const end = start + slice;

    ctx.save();

    ctx.shadowColor = colors[index % colors.length];
    ctx.shadowBlur = 18;

    ctx.beginPath();
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, start, end);
    ctx.closePath();
    ctx.fillStyle = colors[index % colors.length];
    ctx.fill();

    ctx.restore();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.stroke();


    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(start + slice / 2);

    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.font = "bold 24px Arial";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillStyle = "#ffffff";

    ctx.strokeText(player, radius - 26, 0);
    ctx.fillText(player, radius - 26, 0);

    ctx.restore();

  });

  ctx.beginPath();
  ctx.arc(center, center, 42, 0, Math.PI * 2);
  ctx.fillStyle = "#070812";
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";
  ctx.fillText("PAY", center, center + 5);
}

function setupWheelSwipe() {
  const stage = document.getElementById("wheelStage");
  if (!stage) return;

  stage.addEventListener("pointerdown", event => {
    if (isWheelSpinning || selectedWheelPayer) return;

    stage.setPointerCapture(event.pointerId);
    const angle = getPointerWheelAngle(event, stage);
    wheelSwipeState = {
      pointerId: event.pointerId,
      startAngle: angle,
      lastAngle: angle,
      startTime: performance.now(),
      totalMovement: 0
    };
  });

  stage.addEventListener("pointermove", event => {
    if (!wheelSwipeState || wheelSwipeState.pointerId !== event.pointerId || isWheelSpinning) return;

    const angle = getPointerWheelAngle(event, stage);
    const delta = shortestAngleDelta(angle, wheelSwipeState.lastAngle);
    wheelSwipeState.totalMovement += Math.abs(delta);
    wheelSwipeState.lastAngle = angle;
    wheelAngle += delta;
    drawWheel();
  });

  stage.addEventListener("pointerup", event => finishWheelSwipe(event, stage));
  stage.addEventListener("pointercancel", () => {
    wheelSwipeState = null;
  });
}

function finishWheelSwipe(event, stage) {
  if (!wheelSwipeState || wheelSwipeState.pointerId !== event.pointerId || isWheelSpinning || selectedWheelPayer) {
    wheelSwipeState = null;
    return;
  }

  const elapsed = Math.max(performance.now() - wheelSwipeState.startTime, 1);
  const signedTravel = shortestAngleDelta(wheelSwipeState.lastAngle, wheelSwipeState.startAngle);
  const travel = Math.max(Math.abs(signedTravel), wheelSwipeState.totalMovement);
  const velocity = travel / elapsed;
  const isTap = travel < 0.18;
  const minTravel = 0.55;
  const minVelocity = 0.0048;

  wheelSwipeState = null;

  if (isTap) {
    spinWheel(1);
    return;
  }

  if (travel < minTravel || velocity < minVelocity) {
    const wheelHint = document.getElementById("wheelHint");
    if (wheelHint) {
      wheelHint.classList.remove("hidden");
      wheelHint.textContent = "Swipe faster";
    }
    playErrorSound();
    return;
  }

  const power = clampValue((velocity / minVelocity) * 0.7 + (travel / (Math.PI * 2)) * 0.55, 0.85, 2.4);
  spinWheel(power);
}

function getPointerWheelAngle(event, element) {
  const rect = element.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;
  return Math.atan2(event.clientY - centerY, event.clientX - centerX);
}

function shortestAngleDelta(angle, previousAngle) {
  let delta = angle - previousAngle;

  if (delta > Math.PI) delta -= Math.PI * 2;
  if (delta < -Math.PI) delta += Math.PI * 2;

  return delta;
}

function spinWheel(power = 1) {
  if (isWheelSpinning || selectedWheelPayer) return;

  playTap();
  lastTickSliceIndex = -1;
  isWheelSpinning = true;
  power = clampValue(power, 0.8, 2.4);

  const spinBtn = document.getElementById("spinBtn");
  const resultBox = document.getElementById("spinResult");

  const wheelHint = document.getElementById("wheelHint");
if (wheelHint) wheelHint.classList.add("hidden");


  spinBtn.disabled = true;
  resultBox.innerHTML = "";

  const selectedIndex = Math.floor(Math.random() * wheelPlayers.length);
  selectedWheelPayer = wheelPlayers[selectedIndex];

  const slice = Math.PI * 2 / wheelPlayers.length;
  const pointerAngle = -Math.PI / 2;
  const targetAngle = pointerAngle - selectedIndex * slice - slice / 2;

  const startAngle = wheelAngle;
  const extraSpins = Math.round(4 + power * 3.2 + Math.floor(Math.random() * 2));
  const currentRotation = startAngle % (Math.PI * 2);
  const neededRotation = normalizeAngle(targetAngle - currentRotation);
  const finalAngle = startAngle + extraSpins * Math.PI * 2 + neededRotation;

  const duration = 2400 + power * 900;
  const startTime = performance.now();

  function animate(now) {
    if (!document.getElementById("wheelCanvas")) {
      stopSpinWheel();
      return;
    }

    const progress = Math.min((now - startTime) / duration, 1);
    const eased = easeOutCubic(progress);

    wheelAngle = startAngle + (finalAngle - startAngle) * eased;
    drawWheel();

    const currentTickSlice = getSliceUnderPointer();

    if (currentTickSlice !== lastTickSliceIndex) {
      playWheelTick(currentTickSlice);
      lastTickSliceIndex = currentTickSlice;
    }

    if (progress < 1) {
      wheelAnimationFrame = requestAnimationFrame(animate);
    } else {
      wheelAnimationFrame = null;
      finishSpin();
    }
  }

  wheelAnimationFrame = requestAnimationFrame(animate);
}

function getSliceUnderPointer() {
  const slice = Math.PI * 2 / wheelPlayers.length;
  const pointerAngle = -Math.PI / 2;
  const normalizedPointer = normalizeAngle(pointerAngle - wheelAngle);
  return Math.floor(normalizedPointer / slice) % wheelPlayers.length;
}

function finishSpin() {
  isWheelSpinning = false;

  const spinBtn = document.getElementById("spinBtn");
  const resultBox = document.getElementById("spinResult");

  restartSound(winSound);

  resultBox.innerHTML = `
    <div class="result-pop">
      ${selectedWheelPayer} pays the full bill!
    </div>
  `;

  spinBtn.textContent = "Continue";
  spinBtn.disabled = false;
  spinBtn.onclick = function () {
    playTap();
    showResult(selectedWheelPayer, "Spin Wheel");
  };
}

function normalizeAngle(angle) {
  const fullCircle = Math.PI * 2;
  return ((angle % fullCircle) + fullCircle) % fullCircle;
}

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

let dicePlayers = [];
let diceScores = [];
let diceCurrentIndex = 0;
let diceIsRolling = false;
let diceRoundNumber = 1;
let diceRoundWins = {};
let diceIsTieBreaker = false;
let diceTumbleTimeout = null;
let diceSettleTimeout = null;

const diceFaceRotations = {
  1: "rotateX(-22deg) rotateY(34deg) rotateZ(-8deg)",
  2: "rotateX(-20deg) rotateY(-58deg) rotateZ(8deg)",
  3: "rotateX(-104deg) rotateY(30deg) rotateZ(-9deg)",
  4: "rotateX(76deg) rotateY(30deg) rotateZ(9deg)",
  5: "rotateX(-20deg) rotateY(122deg) rotateZ(-8deg)",
  6: "rotateX(-22deg) rotateY(214deg) rotateZ(8deg)"
};

const diceFaceClasses = {
  1: "showing-front",
  2: "showing-right",
  3: "showing-top",
  4: "showing-bottom",
  5: "showing-left",
  6: "showing-back"
};

function showDiceRoll(roundPlayers = players, message = "Highest roll pays the bill. Tie breaker only if needed.", roundNumber = 1, roundWins = null, isTieBreaker = false) {
  stopBackgroundMusic();
  stopDiceRollGame();
  dicePlayers = [...roundPlayers];
  diceScores = [];
  diceCurrentIndex = 0;
  diceIsRolling = false;
  diceRoundNumber = roundNumber;
  diceRoundWins = roundWins || createScoreMap(players);
  diceIsTieBreaker = isTieBreaker;

  const roundLabel = diceIsTieBreaker ? "Tie Breaker" : "One Round";

  setScreen(`
    <div class="panel dice-panel">
      <h2>Dice Roll</h2>
      <p id="diceMessage">${message}</p>

      <div class="round-label">${roundLabel}</div>
      <div id="diceTurn" class="dice-turn">${dicePlayers[0]}'s turn</div>

      <div class="dice-scene" onclick="rollDiceForPlayer()">
        <div id="gameDice" class="game-dice">
          ${getDiceFacesHtml()}
        </div>
      </div>

      <div id="diceValue" class="dice-value">Tap dice or button to roll</div>
      <div id="diceScoreboard" class="dice-scoreboard"></div>

      <button id="diceRollBtn" onclick="rollDiceForPlayer()">Roll Dice</button>
      <button class="secondary" onclick="playTap(); showGameSelect()">Back</button>
    </div>
  `);

  renderDiceScoreboard();
}

function stopDiceRollGame() {
  if (diceTumbleTimeout) {
    clearTimeout(diceTumbleTimeout);
    diceTumbleTimeout = null;
  }

  if (diceSettleTimeout) {
    clearTimeout(diceSettleTimeout);
    diceSettleTimeout = null;
  }

  stopDiceRollSound();
  diceIsRolling = false;
}

function getDiceFacesHtml() {
  return `
    <div class="dice-face dice-front">
      <span class="dice-dot dice-center"></span>
    </div>
    <div class="dice-face dice-right">
      <span class="dice-dot dice-top-left"></span>
      <span class="dice-dot dice-bottom-right"></span>
    </div>
    <div class="dice-face dice-top">
      <span class="dice-dot dice-top-left"></span>
      <span class="dice-dot dice-center"></span>
      <span class="dice-dot dice-bottom-right"></span>
    </div>
    <div class="dice-face dice-bottom">
      <span class="dice-dot dice-top-left"></span>
      <span class="dice-dot dice-top-right"></span>
      <span class="dice-dot dice-bottom-left"></span>
      <span class="dice-dot dice-bottom-right"></span>
    </div>
    <div class="dice-face dice-left">
      <span class="dice-dot dice-top-left"></span>
      <span class="dice-dot dice-top-right"></span>
      <span class="dice-dot dice-center"></span>
      <span class="dice-dot dice-bottom-left"></span>
      <span class="dice-dot dice-bottom-right"></span>
    </div>
    <div class="dice-face dice-back">
      <span class="dice-dot dice-top-left"></span>
      <span class="dice-dot dice-top-right"></span>
      <span class="dice-dot dice-middle-left"></span>
      <span class="dice-dot dice-middle-right"></span>
      <span class="dice-dot dice-bottom-left"></span>
      <span class="dice-dot dice-bottom-right"></span>
    </div>
  `;
}

function rollDiceForPlayer() {
  if (diceIsRolling || diceCurrentIndex >= dicePlayers.length) return;

  playTap();
  playDiceRollSound();
  diceIsRolling = true;

  const dice = document.getElementById("gameDice");
  const rollBtn = document.getElementById("diceRollBtn");
  const diceValue = document.getElementById("diceValue");
  const currentPlayer = dicePlayers[diceCurrentIndex];
  const value = Math.floor(Math.random() * 6) + 1;
  const tumbleTime = 850 + Math.floor(Math.random() * 550);
  const settleTime = 800 + Math.floor(Math.random() * 280);
  const extraX = 360 * (5 + Math.floor(Math.random() * 4));
  const extraY = 360 * (6 + Math.floor(Math.random() * 4));
  const extraZ = 360 * (4 + Math.floor(Math.random() * 4));

  rollBtn.disabled = true;
  diceValue.textContent = `${currentPlayer} is rolling...`;
  dice.classList.remove("landed", ...Object.values(diceFaceClasses));
  dice.classList.add("rolling");
  dice.style.animationDuration = `${250 + Math.floor(Math.random() * 170)}ms`;

  diceTumbleTimeout = setTimeout(() => {
    diceTumbleTimeout = null;

    if (!document.getElementById("gameDice")) {
      stopDiceRollGame();
      return;
    }

    dice.classList.remove("rolling");
    stopDiceRollSound();
    playDiceLandSound();
    dice.style.transitionDuration = `${settleTime}ms`;
    dice.style.transform = `${diceFaceRotations[value]} rotateX(${extraX}deg) rotateY(${extraY}deg) rotateZ(${extraZ}deg) scale(1.08)`;

    diceSettleTimeout = setTimeout(() => {
      diceSettleTimeout = null;

      if (!document.getElementById("gameDice")) {
        stopDiceRollGame();
        return;
      }

      dice.classList.add("landed", diceFaceClasses[value]);
      playNeonHiss();
      diceScores.push({ name: currentPlayer, value });
      diceValue.textContent = `${currentPlayer} rolled ${value}`;
      diceCurrentIndex += 1;
      diceIsRolling = false;
      rollBtn.disabled = false;

      renderDiceScoreboard();

      if (diceCurrentIndex < dicePlayers.length) {
        document.getElementById("diceTurn").textContent = `${dicePlayers[diceCurrentIndex]}'s turn`;
      } else {
        finishDiceRound();
      }
    }, settleTime);
  }, tumbleTime);
}

function renderDiceScoreboard() {
  const scoreboard = document.getElementById("diceScoreboard");
  if (!scoreboard) return;

  scoreboard.innerHTML = dicePlayers.map(player => {
    const score = diceScores.find(item => item.name === player);
    return `
      <div class="dice-score-row">
        <span>${player}</span>
        <strong>${score ? score.value : "-"}</strong>
      </div>
    `;
  }).join("");
}

function finishDiceRound() {
  const rollBtn = document.getElementById("diceRollBtn");
  const diceTurn = document.getElementById("diceTurn");
  const diceMessage = document.getElementById("diceMessage");
  const highest = Math.max(...diceScores.map(score => score.value));
  const winners = diceScores.filter(score => score.value === highest);

  rollBtn.disabled = false;

  if (winners.length > 1) {
    const tiedPlayers = winners.map(score => score.name);
    diceTurn.textContent = "Tie!";
    diceMessage.textContent = `${tiedPlayers.join(", ")} tied with ${highest}. Tie breaker decides now.`;
    rollBtn.textContent = "Start Tie Breaker";
    rollBtn.onclick = function () {
      playTap();
      showDiceRoll(tiedPlayers, "Tie breaker. Highest roll pays.", diceRoundNumber, diceRoundWins, true);
    };
    return;
  }

  const payer = winners[0].name;
  diceTurn.textContent = `${payer} pays!`;
  diceMessage.textContent = `${payer} rolled the highest number.`;
  rollBtn.textContent = "Continue";
  rollBtn.onclick = function () {
    playTap();
    showResult(payer, "Dice Roll");
  };

  if (winSound) winSound.play().catch(() => {});
}

let plinkoCanvas = null;
let plinkoCtx = null;
let plinkoPegs = [];
let plinkoSlots = [];
let plinkoSlotPlayers = [];
let plinkoBall = null;
let plinkoDropping = false;
let plinkoLastTime = 0;
let plinkoAnimationFrame = null;
let plinkoRoundNumber = 1;
let plinkoRoundWins = {};
let plinkoActivePlayers = [];
let plinkoIsTieBreaker = false;
let plinkoGeometry = null;
let lastPlinkoPegSoundTime = 0;
const plinkoBestOfRounds = 3;

function showPlinkoBoard() {
  stopBackgroundMusic();
  stopPlinkoBoard();
  plinkoRoundNumber = 1;
  plinkoRoundWins = createScoreMap(players);
  plinkoActivePlayers = [...players];
  plinkoSlotPlayers = [...plinkoActivePlayers];
  plinkoIsTieBreaker = false;

  setScreen(`
    <div class="panel plinko-panel">
      <h2>Plinko Board</h2>
      <p>Best of 3 drops. Most slot wins pays the bill.</p>

      <div class="plinko-board-wrap">
        <canvas id="plinkoCanvas"></canvas>
      </div>

      <div id="plinkoRoundLabel" class="round-label">Drop 1 of 3</div>
      <div id="plinkoResult" class="plinko-result">Ready to drop</div>

      <button id="plinkoDropBtn" onclick="dropPlinkoBall()">Drop Ball</button>
      <button class="secondary" onclick="playTap(); stopPlinkoBoard(); showGameSelect()">Back</button>
    </div>
  `);

  plinkoCanvas = document.getElementById("plinkoCanvas");
  plinkoCtx = plinkoCanvas.getContext("2d");
  plinkoCanvas.addEventListener("click", dropPlinkoBall);
  setupPlinkoCanvas();
}

function setupPlinkoCanvas() {
  const rect = plinkoCanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;

  plinkoCanvas.width = rect.width * dpr;
  plinkoCanvas.height = rect.height * dpr;
  plinkoCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  createPlinkoBoard();
  drawPlinkoBoard();
}

function createPlinkoBoard() {
  plinkoGeometry = getPlinkoGeometry();
  const {
    rows,
    top,
    rowGap,
    pegGap,
    pegRadius
  } = plinkoGeometry;
  const width = plinkoCanvas.clientWidth;

  plinkoPegs = [];

  for (let row = 0; row < rows; row += 1) {
    const count = row + 2;
    const rowWidth = (count - 1) * pegGap;
    const startX = width / 2 - rowWidth / 2;
    const y = top + row * rowGap;

    for (let col = 0; col < count; col += 1) {
      plinkoPegs.push({
        x: startX + col * pegGap,
        y,
        radius: pegRadius
      });
    }
  }

  createPlinkoSlots();
}

function createPlinkoSlots() {
  if (!plinkoGeometry) {
    plinkoGeometry = getPlinkoGeometry();
  }

  const boardLeft = plinkoGeometry.wallLeft;
  const boardWidth = plinkoGeometry.wallRight - plinkoGeometry.wallLeft;
  const slotWidth = boardWidth / plinkoSlotPlayers.length;
  const slotY = plinkoGeometry.slotY;
  const slotHeight = plinkoGeometry.slotHeight;

  plinkoSlots = plinkoSlotPlayers.map((player, index) => ({
    player,
    x: boardLeft + index * slotWidth,
    y: slotY,
    width: slotWidth,
    height: slotHeight,
    centerX: boardLeft + index * slotWidth + slotWidth / 2
  }));
}

function drawPlinkoBoard() {
  const width = plinkoCanvas.clientWidth;
  const height = plinkoCanvas.clientHeight;

  plinkoCtx.clearRect(0, 0, width, height);
  drawPlinkoBackground(width, height);
  drawPlinkoPegs();

  if (plinkoBall) {
    drawPlinkoBall(plinkoBall.x, plinkoBall.y, plinkoBall.radius);
  }

  drawPlinkoSlots();
}

function drawPlinkoBackground(width, height) {
  plinkoCtx.save();
  plinkoCtx.fillStyle = "rgba(255, 61, 242, 0.08)";
  plinkoCtx.beginPath();
  drawRoundRect(plinkoCtx, width * 0.07, height * 0.08, width * 0.86, height * 0.72, 22);
  plinkoCtx.fill();
  plinkoCtx.strokeStyle = "rgba(0, 255, 200, 0.22)";
  plinkoCtx.lineWidth = 2;
  plinkoCtx.stroke();
  plinkoCtx.restore();
}

function drawPlinkoPegs() {
  plinkoPegs.forEach(peg => {
    plinkoCtx.save();
    plinkoCtx.shadowColor = "#ffffff";
    plinkoCtx.shadowBlur = 10;
    plinkoCtx.fillStyle = "#ffffff";
    plinkoCtx.beginPath();
    plinkoCtx.arc(peg.x, peg.y, peg.radius, 0, Math.PI * 2);
    plinkoCtx.fill();
    plinkoCtx.restore();
  });
}

function drawPlinkoSlots() {
  const colors = ["#ff1744", "#ff9100", "#ffea00", "#00e676", "#00b0ff", "#651fff", "#f50057"];

  plinkoSlots.forEach((slot, index) => {
    const x = slot.x + 4;
    const y = slot.y;
    const width = slot.width - 8;
    const height = slot.height;
    const color = colors[index % colors.length];

    plinkoCtx.save();
    plinkoCtx.fillStyle = "rgba(7, 8, 18, 0.82)";
    plinkoCtx.fillRect(x, y, width, height);

    const gradient = plinkoCtx.createLinearGradient(x, y, x + width, y);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, "rgba(255, 255, 255, 0.18)");

    plinkoCtx.strokeStyle = gradient;
    plinkoCtx.lineWidth = 4;
    plinkoCtx.shadowColor = color;
    plinkoCtx.shadowBlur = 13;
    plinkoCtx.beginPath();
    plinkoCtx.moveTo(x, y + 2);
    plinkoCtx.lineTo(x, y + height - 8);
    plinkoCtx.quadraticCurveTo(x, y + height, x + 8, y + height);
    plinkoCtx.lineTo(x + width - 8, y + height);
    plinkoCtx.quadraticCurveTo(x + width, y + height, x + width, y + height - 8);
    plinkoCtx.lineTo(x + width, y + 2);
    plinkoCtx.stroke();

    plinkoCtx.shadowBlur = 0;
    plinkoCtx.fillStyle = "#ffffff";
    plinkoCtx.textAlign = "center";
    plinkoCtx.textBaseline = "middle";
    plinkoCtx.lineWidth = 3;
    plinkoCtx.strokeStyle = "rgba(0, 0, 0, 0.65)";
    drawFittedPlinkoText(trimPlinkoName(slot.player), slot.centerX, slot.y + slot.height / 2, width - 10, height);
    plinkoCtx.restore();
  });
}

function drawFittedPlinkoText(text, x, y, maxWidth, slotHeight) {
  let fontSize = Math.min(15, Math.max(9, slotHeight * 0.32));

  do {
    plinkoCtx.font = `900 ${fontSize}px Arial`;
    if (plinkoCtx.measureText(text).width <= maxWidth || fontSize <= 8) break;
    fontSize -= 1;
  } while (fontSize > 8);

  plinkoCtx.strokeText(text, x, y);
  plinkoCtx.fillText(text, x, y);
}

function drawPlinkoBall(x, y, radius) {
  const gradient = plinkoCtx.createRadialGradient(x - radius * 0.4, y - radius * 0.4, 2, x, y, radius);
  gradient.addColorStop(0, "#ffffff");
  gradient.addColorStop(0.45, "#00ffc8");
  gradient.addColorStop(1, "#008f84");

  plinkoCtx.save();
  plinkoCtx.shadowColor = "#00ffc8";
  plinkoCtx.shadowBlur = 18;
  plinkoCtx.fillStyle = gradient;
  plinkoCtx.beginPath();
  plinkoCtx.arc(x, y, radius, 0, Math.PI * 2);
  plinkoCtx.fill();
  plinkoCtx.restore();
}

function dropPlinkoBall() {
  if (plinkoDropping) return;

  playTap();
  plinkoDropping = true;

  const result = document.getElementById("plinkoResult");
  const dropBtn = document.getElementById("plinkoDropBtn");
  const width = plinkoCanvas.clientWidth;

  result.textContent = "Dropping...";
  dropBtn.disabled = true;

  createPlinkoBoard();
  plinkoSlotPlayers = shuffleItems(plinkoActivePlayers);
  createPlinkoSlots();
  drawPlinkoBoard();

  plinkoBall = {
    x: width / 2 + plinkoRandomBetween(-plinkoGeometry.pegGap * 0.18, plinkoGeometry.pegGap * 0.18),
    y: plinkoGeometry.spawnY,
    radius: plinkoGeometry.ballRadius,
    vx: plinkoRandomBetween(-plinkoGeometry.pegGap * 0.035, plinkoGeometry.pegGap * 0.035),
    vy: 0,
    settledFrames: 0,
    stuckFrames: 0,
    lastX: width / 2,
    lastY: plinkoGeometry.spawnY,
    payer: ""
  };

  lastPlinkoPegSoundTime = 0;
  plinkoLastTime = performance.now();
  plinkoAnimationFrame = requestAnimationFrame(animatePlinkoDrop);
}

function animatePlinkoDrop(now) {
  const delta = Math.min((now - plinkoLastTime) / 16.67, 2.4);
  plinkoLastTime = now;

  updatePlinkoPhysics(delta);
  drawPlinkoBoard();

  if (plinkoDropping) {
    plinkoAnimationFrame = requestAnimationFrame(animatePlinkoDrop);
  } else {
    finishPlinkoDrop();
  }
}

function updatePlinkoPhysics(delta) {
  const height = plinkoCanvas.clientHeight;
  const slotTop = plinkoGeometry.slotY;
  const subSteps = 5;
  const step = delta / subSteps;

  for (let i = 0; i < subSteps; i += 1) {
    plinkoBall.vy += plinkoGeometry.gravity * step;
    plinkoBall.x += plinkoBall.vx * step;
    plinkoBall.y += plinkoBall.vy * step;

    keepPlinkoBallInsideWalls();
    collidePlinkoBallWithPegs();
    preventStuckPlinkoBall();
    slowPlinkoBallNearSlots(slotTop);

    if (plinkoBall.y + plinkoBall.radius >= slotTop + 12) {
      plinkoBall.vx *= 0.86;
      plinkoBall.vy *= 0.82;
      plinkoBall.settledFrames += 1;

      if (plinkoBall.settledFrames > 10 || plinkoBall.y > plinkoGeometry.slotY + plinkoGeometry.slotHeight * 0.55) {
        const slot = getPlinkoSlotFromX(plinkoBall.x);
        plinkoBall.payer = slot.player;
        plinkoBall.x += (slot.centerX - plinkoBall.x) * 0.14;
        plinkoBall.y = Math.min(plinkoBall.y, slot.y + slot.height * 0.45);
        plinkoDropping = false;
        return;
      }
    }
  }
}

function keepPlinkoBallInsideWalls() {
  const left = plinkoGeometry.wallLeft + plinkoBall.radius;
  const right = plinkoGeometry.wallRight - plinkoBall.radius;

  if (plinkoBall.x < left) {
    plinkoBall.x = left;
    plinkoBall.vx = Math.abs(plinkoBall.vx) * 0.72;
  }

  if (plinkoBall.x > right) {
    plinkoBall.x = right;
    plinkoBall.vx = -Math.abs(plinkoBall.vx) * 0.72;
  }
}

function collidePlinkoBallWithPegs() {
  plinkoPegs.forEach(peg => {
    const dx = plinkoBall.x - peg.x;
    const dy = plinkoBall.y - peg.y;
    const distance = Math.hypot(dx, dy);
    const minDistance = plinkoBall.radius + peg.radius + 1;

    if (distance > 0 && distance < minDistance) {
      const nx = dx / distance;
      const ny = dy / distance;
      const overlap = minDistance - distance;
      const velocityAlongNormal = plinkoBall.vx * nx + plinkoBall.vy * ny;
      const impactStrength = Math.abs(velocityAlongNormal) + Math.hypot(plinkoBall.vx, plinkoBall.vy) * 0.18;
      const tangentKick = plinkoRandomBetween(-0.08, 0.08);
      const isBalancedOnTop = Math.abs(dx) < peg.radius * 1.25 && dy < 0;

      plinkoBall.x += nx * overlap;
      plinkoBall.y += ny * overlap;

      if (velocityAlongNormal < 0) {
        plinkoBall.vx -= (1.72 * velocityAlongNormal) * nx;
        plinkoBall.vy -= (1.72 * velocityAlongNormal) * ny;
        playPlinkoPegSound(impactStrength);
      }

      plinkoBall.vx += -ny * tangentKick;
      plinkoBall.vy += nx * tangentKick;

      if (isBalancedOnTop) {
        plinkoBall.vx += plinkoRandomBetween(-1.25, 1.25);
        plinkoBall.vy += 0.55;
      }

      plinkoBall.vy = Math.max(plinkoBall.vy, -1.1);
      plinkoBall.vx *= 0.985;
      plinkoBall.vy *= 0.992;
    }
  });
}

function slowPlinkoBallNearSlots(slotTop) {
  if (plinkoBall.y > slotTop - 18) {
    plinkoBall.vx *= 0.97;
    plinkoBall.vy = Math.min(plinkoBall.vy, plinkoGeometry.maxFallSpeed);
  }
}

function preventStuckPlinkoBall() {
  const movement = Math.hypot(plinkoBall.x - plinkoBall.lastX, plinkoBall.y - plinkoBall.lastY);
  const verticalMovement = Math.abs(plinkoBall.y - plinkoBall.lastY);
  const speed = Math.hypot(plinkoBall.vx, plinkoBall.vy);
  const isNearTop = plinkoBall.y < plinkoCanvas.clientHeight * 0.35;

  if ((movement < 0.26 || verticalMovement < 0.08) && speed < 1.35) {
    plinkoBall.stuckFrames += 1;
  } else {
    plinkoBall.stuckFrames = 0;
  }

  if (plinkoBall.stuckFrames > (isNearTop ? 10 : 18)) {
    plinkoBall.vx += plinkoRandomBetween(-2.2, 2.2);
    plinkoBall.vy += isNearTop ? 2.8 : 1.8;
    plinkoBall.y += plinkoBall.radius * (isNearTop ? 0.9 : 0.35);
    plinkoBall.stuckFrames = 0;
  }

  plinkoBall.lastX = plinkoBall.x;
  plinkoBall.lastY = plinkoBall.y;
}

function finishPlinkoDrop() {
  const result = document.getElementById("plinkoResult");
  const dropBtn = document.getElementById("plinkoDropBtn");
  const roundLabel = document.getElementById("plinkoRoundLabel");

  dropBtn.disabled = false;
  plinkoRoundWins[plinkoBall.payer] = (plinkoRoundWins[plinkoBall.payer] || 0) + 1;

  if (plinkoIsTieBreaker) {
    result.textContent = `${plinkoBall.payer} wins the tie breaker and pays!`;
    roundLabel.textContent = "Final Result";
    if (winSound) winSound.play().catch(() => {});

    dropBtn.textContent = "Continue";
    dropBtn.onclick = function () {
      playTap();
      showResult(plinkoBall.payer, "Plinko Board");
    };
    return;
  }

  if (plinkoRoundNumber < plinkoBestOfRounds) {
    result.textContent = `${plinkoBall.payer} wins drop ${plinkoRoundNumber}.`;
    plinkoRoundNumber += 1;
    roundLabel.textContent = `Drop ${plinkoRoundNumber} of ${plinkoBestOfRounds}`;
    dropBtn.textContent = `Drop ${plinkoRoundNumber}`;
    dropBtn.onclick = dropPlinkoBall;
    return;
  }

  const highestWins = Math.max(...Object.values(plinkoRoundWins));
  const winners = Object.keys(plinkoRoundWins).filter(player => plinkoRoundWins[player] === highestWins);

  if (winners.length > 1) {
    plinkoActivePlayers = winners;
    plinkoSlotPlayers = shuffleItems(winners);
    plinkoIsTieBreaker = true;
    createPlinkoSlots();
    plinkoBall = null;
    drawPlinkoBoard();

    result.textContent = `${winners.join(", ")} tied. One final drop decides.`;
    roundLabel.textContent = "Tie Breaker";
    dropBtn.textContent = "Drop Tie Breaker";
    dropBtn.onclick = dropPlinkoBall;
    return;
  }

  const payer = winners[0];
  result.textContent = `${payer} won best of 3 and pays!`;
  roundLabel.textContent = "Final Result";
  if (winSound) winSound.play().catch(() => {});

  dropBtn.textContent = "Continue";
  dropBtn.onclick = function () {
    playTap();
    showResult(payer, "Plinko Board");
  };
}

function stopPlinkoBoard() {
  if (plinkoAnimationFrame) cancelAnimationFrame(plinkoAnimationFrame);
  plinkoDropping = false;
  plinkoBall = null;
}

function getPlinkoSlotFromX(x) {
  return plinkoSlots.find(slot => x >= slot.x && x < slot.x + slot.width) || plinkoSlots[plinkoSlots.length - 1];
}

function createScoreMap(items) {
  return items.reduce((scores, item) => {
    scores[item] = 0;
    return scores;
  }, {});
}

function shuffleItems(items) {
  const shuffled = [...items];

  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }

  return shuffled;
}

function plinkoRandomBetween(min, max) {
  return Math.random() * (max - min) + min;
}

function trimPlinkoName(name) {
  return name.length > 7 ? `${name.slice(0, 6)}.` : name;
}

function getPlinkoBallRadius() {
  return (plinkoGeometry || getPlinkoGeometry()).ballRadius;
}

function getPlinkoGeometry() {
  const width = plinkoCanvas.clientWidth;
  const height = plinkoCanvas.clientHeight;
  const rows = height < 260 ? 7 : height < 360 ? 8 : 9;
  const wallLeft = width * 0.09;
  const wallRight = width * 0.91;
  const boardWidth = wallRight - wallLeft;
  const slotY = height * 0.78;
  const slotHeight = Math.min(height * 0.115, 58);
  const top = height * 0.16;
  const availableHeight = Math.max(80, slotY - top - slotHeight * 0.18);
  const rowGap = availableHeight / Math.max(1, rows);
  const pegGap = boardWidth / rows;
  const centerDistance = Math.min(pegGap, rowGap);
  const pegRadius = clampValue(centerDistance * 0.075, 2.4, 4.8);
  const clearGap = Math.max(6, centerDistance - pegRadius * 2);
  const ballDiameter = clearGap * 0.7;
  const ballRadius = clampValue(ballDiameter / 2, 5.2, 13);

  return {
    rows,
    top,
    rowGap,
    pegGap,
    pegRadius,
    ballRadius,
    slotY,
    slotHeight,
    wallLeft,
    wallRight,
    spawnY: Math.max(ballRadius + 4, top - rowGap * 0.9),
    gravity: clampValue(centerDistance * 0.013, 0.16, 0.24),
    maxFallSpeed: clampValue(centerDistance * 0.18, 2.8, 4.6)
  };
}

function clampValue(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function drawRoundRect(ctx, x, y, width, height, radius) {
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, width, height, radius);
    return;
  }

  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}


function drawBackground() {
  const canvas = document.getElementById("bgCanvas");
  const ctx = canvas.getContext("2d");

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#070812";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(0,255,200,0.16)";
    ctx.beginPath();
    ctx.arc(canvas.width * 0.2, canvas.height * 0.2, 130, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "rgba(255,61,242,0.14)";
    ctx.beginPath();
    ctx.arc(canvas.width * 0.8, canvas.height * 0.3, 180, 0, Math.PI * 2);
    ctx.fill();

    requestAnimationFrame(draw);
  }

  resize();
  window.addEventListener("resize", resize);
  draw();
}
let activeFingers = new Map();
let fingerCountdownTimer = null;
let fingerGlowTimer = null;
let fingerResultTimer = null;
let fingerCountdownValue = 5;
let fingerChoosingDone = false;
let fingerPlayerOrder = [];

function showFingerChooser() {
  stopBackgroundMusic();
  activeFingers = new Map();
  fingerCountdownTimer = null;
  fingerGlowTimer = null;
  fingerResultTimer = null;
  fingerCountdownValue = 5;
  fingerChoosingDone = false;
  fingerPlayerOrder = [...players];

  setScreen(`
    <div id="fingerGame" class="finger-game">
      <button class="secondary finger-back" onclick="playTap(); stopFingerChooser(); showGameSelect()">Back</button>

      <div class="finger-message">
        <div class="finger-notice">Best on mobile or touch screen</div>
        <div id="fingerPrompt" class="finger-prompt"></div>
        <div id="fingerProgress" class="finger-progress"></div>
        <span id="fingerCountdown" class="finger-countdown"></span>
      </div>
    </div>
  `);

  const area = document.getElementById("fingerGame");
  updateFingerPrompt();

  area.addEventListener("pointerdown", handleFingerDown);
  area.addEventListener("pointermove", handleFingerMove);
  area.addEventListener("pointerup", handleFingerUp);
  area.addEventListener("pointercancel", handleFingerUp);
  area.addEventListener("pointerleave", handleFingerUp);
}

function handleFingerDown(event) {
  if (fingerChoosingDone) return;
  if (event.target.classList.contains("finger-back")) return;

  event.preventDefault();

  const area = document.getElementById("fingerGame");
  const playerName = getNextFingerPlayerName();

  if (!playerName) {
    updateFingerPrompt();
    return;
  }

  const circle = document.createElement("div");
  circle.className = "finger-circle";
  circle.title = playerName;
  circle.style.left = `${event.clientX}px`;
  circle.style.top = `${event.clientY}px`;

  area.appendChild(circle);

  activeFingers.set(event.pointerId, {
    id: event.pointerId,
    name: playerName,
    x: event.clientX,
    y: event.clientY,
    circle
  });

  area.setPointerCapture(event.pointerId);

  updateFingerPrompt();
  checkFingerCountdown();
}

function handleFingerMove(event) {
  if (!activeFingers.has(event.pointerId) || fingerChoosingDone) return;

  event.preventDefault();

  const finger = activeFingers.get(event.pointerId);
  finger.x = event.clientX;
  finger.y = event.clientY;
  finger.circle.style.left = `${event.clientX}px`;
  finger.circle.style.top = `${event.clientY}px`;
}

function handleFingerUp(event) {
  if (!activeFingers.has(event.pointerId) || fingerChoosingDone) return;

  const finger = activeFingers.get(event.pointerId);
  finger.circle.remove();
  activeFingers.delete(event.pointerId);

  if (activeFingers.size !== fingerPlayerOrder.length) {
    cancelFingerCountdown();
  }

  updateFingerPrompt();
}

function checkFingerCountdown() {
  if (activeFingers.size === fingerPlayerOrder.length && !fingerCountdownTimer) {
    startFingerCountdown();
  }
}

function startFingerCountdown() {
  const countdown = document.getElementById("fingerCountdown");
  updateFingerPrompt("Everyone hold still...");
  fingerCountdownValue = 5;
  countdown.textContent = fingerCountdownValue;
  startFingerGlowCycle();

  fingerCountdownTimer = setInterval(() => {
    fingerCountdownValue -= 1;

    if (fingerCountdownValue > 0) {
      countdown.textContent = fingerCountdownValue;
    } else {
      clearInterval(fingerCountdownTimer);
      fingerCountdownTimer = null;
      stopFingerGlowCycle();
      chooseFingerWinner();
    }
  }, 1000);
}

function cancelFingerCountdown() {
  clearInterval(fingerCountdownTimer);
  fingerCountdownTimer = null;
  stopFingerGlowCycle();
  fingerCountdownValue = 5;

  const countdown = document.getElementById("fingerCountdown");
  if (countdown) countdown.textContent = "";
  activeFingers.forEach(finger => {
    finger.circle.classList.remove("scanning");
  });
  updateFingerPrompt();
}

function startFingerGlowCycle() {
  stopFingerGlowCycle();

  fingerGlowTimer = setInterval(() => {
    const fingers = Array.from(activeFingers.values());
    if (!fingers.length) return;

    fingers.forEach(finger => finger.circle.classList.remove("scanning"));
    const activeFinger = fingers[Math.floor(Math.random() * fingers.length)];
    activeFinger.circle.classList.add("scanning");
  }, 170);
}

function stopFingerGlowCycle() {
  if (!fingerGlowTimer) return;

  clearInterval(fingerGlowTimer);
  fingerGlowTimer = null;
}

function chooseFingerWinner() {
  if (activeFingers.size < 2 || activeFingers.size !== fingerPlayerOrder.length) {
    cancelFingerCountdown();
    return;
  }

  fingerChoosingDone = true;

  const fingers = Array.from(activeFingers.values());
  const winner = fingers[Math.floor(Math.random() * fingers.length)];

  fingers.forEach(finger => {
    if (finger.id !== winner.id) {
      finger.circle.classList.add("not-winner");
    }

    if (finger.id === winner.id) {
      finger.circle.classList.remove("scanning");
    }
  });

  winner.circle.classList.add("winner");
  updateFingerPrompt("Selected finger pays the bill!");

  if (navigator.vibrate) {
    navigator.vibrate([140, 70, 180, 70, 240]);
  }

  fingerResultTimer = setTimeout(() => {
    fingerResultTimer = null;
    stopFingerChooser();
    showResult("Selected Finger", "Finger Chooser");
  }, 2200);
}

function stopFingerChooser() {
  cancelFingerCountdown();
  if (fingerResultTimer) {
    clearTimeout(fingerResultTimer);
    fingerResultTimer = null;
  }

  activeFingers.clear();
  fingerChoosingDone = false;
  fingerPlayerOrder = [];
}

function getNextFingerPlayerName() {
  const usedNames = Array.from(activeFingers.values()).map(finger => finger.name);
  const availableName = fingerPlayerOrder.find(player => !usedNames.includes(player));

  return availableName || "";
}

function updateFingerPrompt(message = "") {
  const prompt = document.getElementById("fingerPrompt");
  const progress = document.getElementById("fingerProgress");

  if (!prompt || !progress) return;

  const usedNames = Array.from(activeFingers.values()).map(finger => finger.name);
  const nextPlayer = fingerPlayerOrder.find(player => !usedNames.includes(player));

  if (message) {
    prompt.textContent = message;
  } else if (nextPlayer) {
    prompt.textContent = `Touch for ${nextPlayer}`;
  } else {
    prompt.textContent = "Everyone keep holding";
  }

  progress.textContent = `${usedNames.length} of ${fingerPlayerOrder.length} players placed`;
}

function trimFingerName(name) {
  return name.length > 12 ? `${name.slice(0, 11)}.` : name;
}

loadSoundPreference();
loadPlayers();
drawBackground();
showWelcome();
