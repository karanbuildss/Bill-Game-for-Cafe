const screen = document.getElementById("screen");
const tapSound = document.getElementById("tapSound");
const winSound = document.getElementById("winSound");

let players = ["", ""];
let billAmount = "";

function playTap() {
  if (!tapSound) return;
  tapSound.currentTime = 0;
  tapSound.play().catch(() => {});
}

function setScreen(html) {
  screen.innerHTML = html;
}

function showWelcome() {
  setScreen(`
    <div class="panel">
      <h1>Bill Roulette</h1>
      <p>A fun cafe game to decide who pays the bill.</p>
      <button onclick="playTap(); showPlayerSetup()">Start Game</button>
    </div>
  `);
}

function showPlayerSetup(error = "") {
  setScreen(`
    <div class="panel">
      <h2>Player Setup</h2>
      <p>Add at least two players and enter the bill amount.</p>

      <div id="playerInputs">
        ${players.map((name, index) => `
          <input 
            type="text" 
            placeholder="Player ${index + 1} name" 
            value="${name}"
            oninput="players[${index}] = this.value"
          />
        `).join("")}
      </div>

      <input 
        type="number" 
        placeholder="Bill amount" 
        value="${billAmount}"
        oninput="billAmount = this.value"
      />

      <button class="secondary" onclick="addPlayerInput()">Add Another Player</button>
      <button onclick="goToGameSelect()">Continue</button>

      ${error ? `<div class="error">${error}</div>` : ""}
    </div>
  `);
}

function addPlayerInput() {
  playTap();
  players.push("");
  showPlayerSetup();
}

function goToGameSelect() {
  playTap();

  const validPlayers = players.map(p => p.trim()).filter(Boolean);

  if (validPlayers.length < 2) {
    showPlayerSetup("Please enter at least two player names.");
    return;
  }

  if (!billAmount || Number(billAmount) <= 0) {
    showPlayerSetup("Please enter a valid bill amount.");
    return;
  }

  players = validPlayers;
  showGameSelect();
}

function showGameSelect() {
  setScreen(`
    <div class="panel">
      <h2>Pick a Game</h2>
      <p>${players.length} players | Bill Rs. ${billAmount}</p>

      ${gameButton("Spin Wheel", "Color wheel decides who pays.", "showSpinWheel")}
      ${gameButton("Finger Chooser", "Place fingers on screen and randomly choose payer.", "showFingerChooser")}
      ${gameButton("Dice Roll", "Highest dice roll pays the bill.", "showPlaceholderResult")}
      ${gameButton("Plinko Board", "Drop a ball and let luck decide.", "showPlaceholderResult")}

      <button class="secondary" onclick="playTap(); showPlayerSetup()">Edit Players</button>
    </div>
  `);
}

function gameButton(title, desc, action) {
  let clickAction = `showPlaceholderResult('${title}')`;

  if (action === "showSpinWheel") {
    clickAction = "showSpinWheel()";
  }

  if (action === "showFingerChooser") {
    clickAction = "showFingerChooser()";
  }

  return `
    <div class="game-card">
      <strong>${title}</strong>
      <p>${desc}</p>
      <button onclick="playTap(); ${clickAction}">Open</button>
    </div>
  `;
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
  setScreen(`
    <div class="panel">
      <h2>${payer} Pays!</h2>
      <p>${gameName} selected the payer.</p>
      <p>Bill Amount: Rs. ${billAmount}</p>

      <button onclick="playTap(); showGameSelect()">Change Game</button>
      <button class="secondary" onclick="playTap(); showPlayerSetup()">Reset Players</button>
    </div>
  `);
}

let wheelAngle = 0;
let isWheelSpinning = false;
let selectedWheelPayer = null;

function showSpinWheel() {
  selectedWheelPayer = null;
  isWheelSpinning = false;

  setScreen(`
    <div class="panel">
      <h2>Spin Wheel</h2>
      <p>Spin the wheel and let luck choose who pays.</p>

      <div class="pointer"></div>

<div class="wheel-wrap">
  <div class="wheel-stage" onclick="spinWheel()">
    <canvas id="wheelCanvas" width="420" height="420"></canvas>
    <div id="wheelHint" class="wheel-hint">Tap to spin wheel</div>
  </div>
</div>


      <div id="spinResult"></div>

      <button id="spinBtn" onclick="spinWheel()">Spin</button>
      <button class="secondary" onclick="playTap(); showGameSelect()">Back</button>
    </div>
  `);

  drawWheel();
}

function drawWheel() {
  const canvas = document.getElementById("wheelCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const size = canvas.width;
  const center = size / 2;
  const radius = center - 10;
  const slice = Math.PI * 2 / players.length;

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

  players.forEach((player, index) => {
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
  ctx.fillText("BILL", center, center + 5);
}

function spinWheel() {
  if (isWheelSpinning) return;

  playTap();
  isWheelSpinning = true;

  const spinBtn = document.getElementById("spinBtn");
  const resultBox = document.getElementById("spinResult");

  const wheelHint = document.getElementById("wheelHint");
if (wheelHint) wheelHint.classList.add("hidden");


  spinBtn.disabled = true;
  resultBox.innerHTML = "";

  const selectedIndex = Math.floor(Math.random() * players.length);
  selectedWheelPayer = players[selectedIndex];

  const slice = Math.PI * 2 / players.length;
  const pointerAngle = -Math.PI / 2;
  const targetAngle = pointerAngle - selectedIndex * slice - slice / 2;

  const startAngle = wheelAngle;
  const extraSpins = 6 + Math.floor(Math.random() * 3);
  const currentRotation = startAngle % (Math.PI * 2);
  const neededRotation = normalizeAngle(targetAngle - currentRotation);
  const finalAngle = startAngle + extraSpins * Math.PI * 2 + neededRotation;

  const duration = 3600;
  const startTime = performance.now();

  function animate(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = easeOutCubic(progress);

    wheelAngle = startAngle + (finalAngle - startAngle) * eased;
    drawWheel();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      finishSpin();
    }
  }

  requestAnimationFrame(animate);
}

function finishSpin() {
  isWheelSpinning = false;

  const spinBtn = document.getElementById("spinBtn");
  const resultBox = document.getElementById("spinResult");

  if (winSound) winSound.play().catch(() => {});

  resultBox.innerHTML = `
    <div class="result-pop">
      ${selectedWheelPayer} pays the full bill of Rs. ${billAmount}!
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
let fingerCountdownValue = 2;
let fingerChoosingDone = false;

function showFingerChooser() {
  activeFingers = new Map();
  fingerCountdownTimer = null;
  fingerCountdownValue = 2;
  fingerChoosingDone = false;

  setScreen(`
    <div id="fingerGame" class="finger-game">
      <button class="secondary finger-back" onclick="playTap(); stopFingerChooser(); showGameSelect()">Back</button>

      <div class="finger-message">
        Make at least 2 players place one finger on the screen.
        <br>
        Keep holding until the countdown ends.
        <span id="fingerCountdown" class="finger-countdown"></span>
      </div>
    </div>
  `);

  const area = document.getElementById("fingerGame");

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

  const circle = document.createElement("div");
  circle.className = "finger-circle";
  circle.textContent = playerName;
  circle.style.background = getFingerColor(activeFingers.size);
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

  if (activeFingers.size < 2) {
    cancelFingerCountdown();
  }
}

function checkFingerCountdown() {
  if (activeFingers.size >= 2 && !fingerCountdownTimer) {
    startFingerCountdown();
  }
}

function startFingerCountdown() {
  const countdown = document.getElementById("fingerCountdown");
  fingerCountdownValue = 2;
  countdown.textContent = fingerCountdownValue;

  fingerCountdownTimer = setInterval(() => {
    fingerCountdownValue -= 1;

    if (fingerCountdownValue > 0) {
      countdown.textContent = fingerCountdownValue;
    } else {
      clearInterval(fingerCountdownTimer);
      fingerCountdownTimer = null;
      chooseFingerWinner();
    }
  }, 1000);
}

function cancelFingerCountdown() {
  clearInterval(fingerCountdownTimer);
  fingerCountdownTimer = null;
  fingerCountdownValue = 2;

  const countdown = document.getElementById("fingerCountdown");
  if (countdown) countdown.textContent = "";
}

function chooseFingerWinner() {
  if (activeFingers.size < 2) {
    cancelFingerCountdown();
    return;
  }

  fingerChoosingDone = true;

  const fingers = Array.from(activeFingers.values());
  const winner = fingers[Math.floor(Math.random() * fingers.length)];

  fingers.forEach(finger => {
    if (finger.id !== winner.id) {
      finger.circle.style.opacity = "0.2";
      finger.circle.style.transform = "scale(0.75)";
    }
  });

  winner.circle.classList.add("winner");
  winner.circle.textContent = `${winner.name} pays`;

  if (winSound) winSound.play().catch(() => {});

  setTimeout(() => {
    stopFingerChooser();
    showResult(winner.name, "Finger Chooser");
  }, 1800);
}

function stopFingerChooser() {
  cancelFingerCountdown();
  activeFingers.clear();
  fingerChoosingDone = false;
}

function getNextFingerPlayerName() {
  const usedNames = Array.from(activeFingers.values()).map(finger => finger.name);
  const availableName = players.find(player => !usedNames.includes(player));

  return availableName || players[activeFingers.size % players.length];
}

function getFingerColor(index) {
  const colors = [
    "#00ffc8",
    "#ff3df2",
    "#ffea00",
    "#00b0ff",
    "#ff1744",
    "#76ff03",
    "#ff9100",
    "#b197fc"
  ];

  return colors[index % colors.length];
}

drawBackground();
showWelcome();
