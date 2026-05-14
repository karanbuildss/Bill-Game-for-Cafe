const screen = document.getElementById("screen");
const tapSound = document.getElementById("tapSound");
const winSound = document.getElementById("winSound");

let players = ["", ""];
let billAmount = "";
let lastPlayedGame = "";
const maxPlayerNameLength = 12;

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
    <div class="panel setup-panel">
      <h2>Player Setup</h2>
      <p>Add at least two players and enter the bill amount.</p>

      <div id="playerInputs" class="player-input-list">
        ${players.map((name, index) => `
          <div class="player-input-row">
            <input 
            type="text" 
            placeholder="Player ${index + 1} name" 
            value="${name}"
              maxlength="${maxPlayerNameLength}"
            oninput="players[${index}] = this.value"
            />
            ${index >= 2 ? `
              <button 
                class="remove-player-btn" 
                type="button" 
                aria-label="Remove player ${index + 1}"
                onclick="removePlayerInput(${index})"
              >
                ×
              </button>
            ` : ""}
          </div>
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

function removePlayerInput(index) {
  playTap();

  if (players.length <= 2 || index < 2) return;

  players.splice(index, 1);
  showPlayerSetup();
}

function goToGameSelect() {
  playTap();

  const validPlayers = players.map(p => p.trim()).filter(Boolean);
  const normalizedNames = validPlayers.map(name => name.toLowerCase());
  const hasDuplicateNames = normalizedNames.some((name, index) => normalizedNames.indexOf(name) !== index);

  if (validPlayers.length < 2) {
    showPlayerSetup("Please enter at least two player names.");
    return;
  }

  if (validPlayers.some(name => name.length > maxPlayerNameLength)) {
    showPlayerSetup(`Player names must be ${maxPlayerNameLength} characters or less.`);
    return;
  }

  if (hasDuplicateNames) {
    showPlayerSetup("Player names must be unique.");
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
      ${gameButton("Dice Roll", "Highest dice roll pays the bill.", "showDiceRoll")}
      ${gameButton("Plinko Board", "Drop a ball and let luck decide.", "showPlinkoBoard")}

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

  if (action === "showDiceRoll") {
    clickAction = "showDiceRoll()";
  }

  if (action === "showPlinkoBoard") {
    clickAction = "showPlinkoBoard()";
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
  lastPlayedGame = gameName;

  setScreen(`
    <div class="panel">
      <h2>${payer} Pays!</h2>
      <p>${gameName} selected the payer.</p>
      <p>Bill Amount: Rs. ${billAmount}</p>

      <button onclick="playTap(); playAgain()">Play Again</button>
      <button onclick="playTap(); showGameSelect()">Change Game</button>
      <button class="secondary" onclick="playTap(); showPlayerSetup()">Reset Players</button>
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

function showSpinWheel() {
  selectedWheelPayer = null;
  isWheelSpinning = false;
  wheelPlayers = shuffleItems(players);

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

  const selectedIndex = Math.floor(Math.random() * wheelPlayers.length);
  selectedWheelPayer = wheelPlayers[selectedIndex];

  const slice = Math.PI * 2 / wheelPlayers.length;
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

let dicePlayers = [];
let diceScores = [];
let diceCurrentIndex = 0;
let diceIsRolling = false;
let diceRoundNumber = 1;
let diceRoundWins = {};
let diceIsTieBreaker = false;
const diceBestOfRounds = 3;

const diceFaceRotations = {
  1: "rotateX(0deg) rotateY(0deg)",
  2: "rotateX(0deg) rotateY(-90deg)",
  3: "rotateX(-90deg) rotateY(0deg)",
  4: "rotateX(90deg) rotateY(0deg)",
  5: "rotateX(0deg) rotateY(90deg)",
  6: "rotateX(0deg) rotateY(180deg)"
};

function showDiceRoll(roundPlayers = players, message = "Best of 3 rounds. Highest roll wins each round.", roundNumber = 1, roundWins = null, isTieBreaker = false) {
  dicePlayers = [...roundPlayers];
  diceScores = [];
  diceCurrentIndex = 0;
  diceIsRolling = false;
  diceRoundNumber = roundNumber;
  diceRoundWins = roundWins || createScoreMap(players);
  diceIsTieBreaker = isTieBreaker;

  const roundLabel = diceIsTieBreaker ? "Tie Breaker" : `Round ${diceRoundNumber} of ${diceBestOfRounds}`;

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
  diceIsRolling = true;

  const dice = document.getElementById("gameDice");
  const rollBtn = document.getElementById("diceRollBtn");
  const diceValue = document.getElementById("diceValue");
  const currentPlayer = dicePlayers[diceCurrentIndex];
  const value = Math.floor(Math.random() * 6) + 1;
  const tumbleTime = 850 + Math.floor(Math.random() * 550);
  const settleTime = 800 + Math.floor(Math.random() * 280);
  const extraX = 360 * (2 + Math.floor(Math.random() * 4));
  const extraY = 360 * (2 + Math.floor(Math.random() * 4));

  rollBtn.disabled = true;
  diceValue.textContent = `${currentPlayer} is rolling...`;
  dice.classList.add("rolling");
  dice.style.animationDuration = `${360 + Math.floor(Math.random() * 260)}ms`;

  setTimeout(() => {
    dice.classList.remove("rolling");
    dice.style.transitionDuration = `${settleTime}ms`;
    dice.style.transform = `${diceFaceRotations[value]} rotateX(${extraX}deg) rotateY(${extraY}deg) scale(1.08)`;

    setTimeout(() => {
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
        <strong>${score ? score.value : "-"} | ${diceRoundWins[player] || 0}W</strong>
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
    diceMessage.textContent = `${tiedPlayers.join(", ")} tied with ${highest}. Replay this round.`;
    rollBtn.textContent = "Replay Tied Round";
    rollBtn.onclick = function () {
      playTap();
      showDiceRoll(tiedPlayers, `Tie in round ${diceRoundNumber}. Highest roll wins this round.`, diceRoundNumber, diceRoundWins, diceIsTieBreaker);
    };
    return;
  }

  const roundWinner = winners[0].name;
  diceRoundWins[roundWinner] = (diceRoundWins[roundWinner] || 0) + 1;
  renderDiceScoreboard();

  if (!diceIsTieBreaker && diceRoundNumber < diceBestOfRounds) {
    diceTurn.textContent = `${roundWinner} wins round ${diceRoundNumber}`;
    diceMessage.textContent = `${roundWinner} scored a round win.`;
    rollBtn.textContent = `Start Round ${diceRoundNumber + 1}`;
    rollBtn.onclick = function () {
      playTap();
      showDiceRoll(players, "Best of 3 rounds. Highest roll wins each round.", diceRoundNumber + 1, diceRoundWins);
    };
    return;
  }

  const highestWins = Math.max(...Object.values(diceRoundWins));
  const finalWinners = Object.keys(diceRoundWins).filter(player => diceRoundWins[player] === highestWins);

  if (finalWinners.length > 1) {
    diceTurn.textContent = "Final Tie!";
    diceMessage.textContent = `${finalWinners.join(", ")} tied with ${highestWins} round wins.`;
    rollBtn.textContent = "Start Final Tie Breaker";
    rollBtn.onclick = function () {
      playTap();
      showDiceRoll(finalWinners, "Final tie breaker. Highest roll pays.", diceRoundNumber, diceRoundWins, true);
    };
    return;
  }

  const payer = finalWinners[0];
  diceTurn.textContent = `${payer} pays!`;
  diceMessage.textContent = `${payer} won the best of 3.`;
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
const plinkoRows = 9;
const plinkoBestOfRounds = 3;

function showPlinkoBoard() {
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
  const width = plinkoCanvas.clientWidth;
  const height = plinkoCanvas.clientHeight;
  const top = height * 0.1;
  const rowGap = height * 0.062;
  const boardLeft = width * 0.09;
  const boardRight = width * 0.91;
  const maxPegCount = plinkoRows + 1;
  const pegGap = (boardRight - boardLeft) / (maxPegCount - 1);

  plinkoPegs = [];

  for (let row = 0; row < plinkoRows; row += 1) {
    const count = row + 2;
    const rowWidth = (count - 1) * pegGap;
    const startX = width / 2 - rowWidth / 2;
    const y = top + row * rowGap;

    for (let col = 0; col < count; col += 1) {
      plinkoPegs.push({
        x: startX + col * pegGap,
        y,
        radius: Math.max(3.6, width * 0.01)
      });
    }
  }

  createPlinkoSlots();
}

function createPlinkoSlots() {
  const width = plinkoCanvas.clientWidth;
  const height = plinkoCanvas.clientHeight;
  const slotWidth = width / plinkoSlotPlayers.length;
  const slotY = height * 0.78;
  const slotHeight = Math.min(height * 0.115, 58);

  plinkoSlots = plinkoSlotPlayers.map((player, index) => ({
    player,
    x: index * slotWidth,
    y: slotY,
    width: slotWidth,
    height: slotHeight,
    centerX: index * slotWidth + slotWidth / 2
  }));
}

function drawPlinkoBoard() {
  const width = plinkoCanvas.clientWidth;
  const height = plinkoCanvas.clientHeight;

  plinkoCtx.clearRect(0, 0, width, height);
  drawPlinkoBackground(width, height);
  drawPlinkoPegs();
  drawPlinkoSlots();

  if (plinkoBall) {
    drawPlinkoBall(plinkoBall.x, plinkoBall.y, plinkoBall.radius);
  }
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
  const slotFontSize = Math.max(12, Math.min(15, plinkoCanvas.clientWidth / (plinkoSlotPlayers.length * 5.8)));

  plinkoSlots.forEach((slot, index) => {
    plinkoCtx.save();
    plinkoCtx.fillStyle = colors[index % colors.length];
    plinkoCtx.shadowColor = colors[index % colors.length];
    plinkoCtx.shadowBlur = 14;
    plinkoCtx.beginPath();
    drawRoundRect(plinkoCtx, slot.x + 4, slot.y, slot.width - 8, slot.height, 10);
    plinkoCtx.fill();
    plinkoCtx.restore();

    plinkoCtx.save();
    plinkoCtx.fillStyle = index === 2 ? "#05060c" : "#ffffff";
    plinkoCtx.font = `700 ${slotFontSize}px Arial`;
    plinkoCtx.textAlign = "center";
    plinkoCtx.textBaseline = "middle";
    plinkoCtx.fillText(trimPlinkoName(slot.player), slot.centerX, slot.y + slot.height / 2);
    plinkoCtx.restore();
  });
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
  const height = plinkoCanvas.clientHeight;

  result.textContent = "Dropping...";
  dropBtn.disabled = true;

  plinkoSlotPlayers = shuffleItems(plinkoActivePlayers);
  createPlinkoSlots();
  drawPlinkoBoard();

  plinkoBall = {
    x: width / 2 + plinkoRandomBetween(-14, 14),
    y: height * 0.045,
    radius: Math.max(9, width * 0.028),
    vx: plinkoRandomBetween(-1.6, 1.6),
    vy: 0,
    settledFrames: 0,
    stuckFrames: 0,
    lastX: width / 2,
    lastY: height * 0.045,
    payer: ""
  };

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
  const slotTop = height * 0.78;
  const subSteps = 5;
  const step = delta / subSteps;

  for (let i = 0; i < subSteps; i += 1) {
    plinkoBall.vy += 0.22 * step;
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

      if (plinkoBall.settledFrames > 10 || plinkoBall.y > height * 0.925) {
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
  const width = plinkoCanvas.clientWidth;
  const left = width * 0.08 + plinkoBall.radius;
  const right = width * 0.92 - plinkoBall.radius;

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
      const tangentKick = plinkoRandomBetween(-0.08, 0.08);

      plinkoBall.x += nx * overlap;
      plinkoBall.y += ny * overlap;

      if (velocityAlongNormal < 0) {
        plinkoBall.vx -= (1.72 * velocityAlongNormal) * nx;
        plinkoBall.vy -= (1.72 * velocityAlongNormal) * ny;
      }

      plinkoBall.vx += -ny * tangentKick;
      plinkoBall.vy += nx * tangentKick;
      plinkoBall.vx *= 0.985;
      plinkoBall.vy *= 0.992;
    }
  });
}

function slowPlinkoBallNearSlots(slotTop) {
  if (plinkoBall.y > slotTop - 18) {
    plinkoBall.vx *= 0.97;
    plinkoBall.vy = Math.min(plinkoBall.vy, 4.2);
  }
}

function preventStuckPlinkoBall() {
  const movement = Math.hypot(plinkoBall.x - plinkoBall.lastX, plinkoBall.y - plinkoBall.lastY);
  const speed = Math.hypot(plinkoBall.vx, plinkoBall.vy);

  if (movement < 0.18 && speed < 0.55) {
    plinkoBall.stuckFrames += 1;
  } else {
    plinkoBall.stuckFrames = 0;
  }

  if (plinkoBall.stuckFrames > 18) {
    plinkoBall.vx += plinkoRandomBetween(-1.4, 1.4);
    plinkoBall.vy += 1.8;
    plinkoBall.y += plinkoBall.radius * 0.35;
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
    result.textContent = `${plinkoBall.payer} wins the tie breaker and pays Rs. ${billAmount}!`;
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
  result.textContent = `${payer} won best of 3 and pays Rs. ${billAmount}!`;
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
