const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const gameWrap = document.getElementById("gameWrap");

const scoreEl = document.getElementById("score");
const levelEl = document.getElementById("level");
const bestEl = document.getElementById("best");
const levelNameEl = document.getElementById("levelName");
const targetEl = document.getElementById("target");

const message = document.getElementById("message");
const messageIcon = document.getElementById("messageIcon");
const messageTitle = document.getElementById("messageTitle");
const messageText = document.getElementById("messageText");
const startBtn = document.getElementById("startBtn");

const settings = document.getElementById("settings");
const gearBtn = document.getElementById("gearBtn");
const closeSettings = document.getElementById("closeSettings");

const speedRange = document.getElementById("speedRange");
const speedValue = document.getElementById("speedValue");

const obstacleToggle = document.getElementById("obstacleToggle");
const eatSoundToggle = document.getElementById("eatSoundToggle");
const musicToggle = document.getElementById("musicToggle");
const vibrateToggle = document.getElementById("vibrateToggle");

const restartBtn = document.getElementById("restartBtn");
const toast = document.getElementById("toast");

const backgroundSelect =
  document.getElementById("backgroundSelect");

const obstacleLevel =
  document.getElementById("obstacleLevel");


/* =========================================================
   KÍCH THƯỚC
   ========================================================= */

const COLS = 24;
const ROWS = 24;

let cell = 20;


/* =========================================================
   TRẠNG THÁI
   ========================================================= */

let snake = [];
let food = null;
let obstacles = [];

let direction = {
  x: 1,
  y: 0
};

let nextDirection = {
  x: 1,
  y: 0
};

let running = false;
let paused = false;

let score = 0;
let level = 1;
let eaten = 0;

let timer = null;

let levelStartScore = 0;


/* =========================================================
   AUDIO
   ========================================================= */

let audioCtx = null;
let musicTimer = null;


/* =========================================================
   KỶ LỤC
   ========================================================= */

let best =
  Number(localStorage.getItem("snakeBest") || 0);

bestEl.textContent = best;


/* =========================================================
   12 MÀN
   ========================================================= */

const levels = [
  ["Đồng cỏ khởi đầu", 5],
  ["Khu rừng xanh", 7],
  ["Mê cung đá", 9],
  ["Sa mạc nóng", 10],
  ["Hang băng", 12],
  ["Thung lũng", 13],
  ["Rừng đêm", 15],
  ["Đảo vui chơi", 16],
  ["Cổng huyền bí", 18],
  ["Thành trì rắn", 20],
  ["Đường hầm cuối", 22],
  ["Vương quốc rắn", 25]
];


/* =========================================================
   5 BỐI CẢNH
   ========================================================= */

const backgrounds = {

  forest: {
    name: "Rừng",

    bg1: "#071a0d",
    bg2: "#102e18",
    grid: "rgba(91,190,105,.10)",

    obstacleTypes: [
      "tree",
      "rock",
      "bush"
    ]
  },

  mansion: {
    name: "Dinh thự",

    bg1: "#170d19",
    bg2: "#302016",
    grid: "rgba(255,210,120,.08)",

    obstacleTypes: [
      "pillar",
      "table",
      "chair"
    ]
  },

  tunnel: {
    name: "Đường hầm",

    bg1: "#080d17",
    bg2: "#172335",
    grid: "rgba(80,180,255,.08)",

    obstacleTypes: [
      "wall",
      "barrier",
      "lamp"
    ]
  },

  house: {
    name: "Nhà",

    bg1: "#21140b",
    bg2: "#3b2515",
    grid: "rgba(255,195,100,.08)",

    obstacleTypes: [
      "table",
      "chair",
      "cabinet"
    ]
  },

  playground: {
    name: "Khu vui chơi",

    bg1: "#15102c",
    bg2: "#251a48",
    grid: "rgba(210,130,255,.08)",

    obstacleTypes: [
      "fence",
      "bench",
      "slide"
    ]
  }

};


/* =========================================================
   MỨC ĐỘ CHƯỚNG NGẠI VẬT
   ========================================================= */

const obstacleAmounts = {

  easy: {
    name: "Dễ",
    amount: 7
  },

  medium: {
    name: "Trung bình",
    amount: 14
  },

  hard: {
    name: "Khó",
    amount: 23
  }

};


/* =========================================================
   BỐI CẢNH HIỆN TẠI
   ========================================================= */

function getBackground() {

  const key =
    backgroundSelect
      ? backgroundSelect.value
      : "forest";

  return backgrounds[key] || backgrounds.forest;
}


/* =========================================================
   MỨC ĐỘ HIỆN TẠI
   ========================================================= */

function getObstacleAmount() {

  const key =
    obstacleLevel
      ? obstacleLevel.value
      : "medium";

  return obstacleAmounts[key]
    || obstacleAmounts.medium;
}


/* =========================================================
   RESIZE
   ========================================================= */

function resizeCanvas() {

  const rect =
    gameWrap.getBoundingClientRect();

  const dpr =
    window.devicePixelRatio || 1;

  canvas.width =
    rect.width * dpr;

  canvas.height =
    rect.height * dpr;

  canvas.style.width =
    rect.width + "px";

  canvas.style.height =
    rect.height + "px";

  ctx.setTransform(
    dpr,
    0,
    0,
    dpr,
    0,
    0
  );

  cell =
    Math.min(
      rect.width / COLS,
      rect.height / ROWS
    );

  draw();
}


window.addEventListener(
  "resize",
  resizeCanvas
);


/* =========================================================
   TOAST
   ========================================================= */

function showToast(text) {

  toast.textContent = text;

  toast.classList.add("show");

  clearTimeout(showToast.timer);

  showToast.timer =
    setTimeout(() => {

      toast.classList.remove("show");

    }, 1800);
}


/* =========================================================
   CẬP NHẬT UI
   ========================================================= */

function updateLevelUI() {

  const current =
    levels[level - 1];

  levelEl.textContent =
    `${level} / ${levels.length}`;

  levelNameEl.textContent =
    current[0];

  targetEl.textContent =
    `Mục tiêu: ${current[1]} mồi`;
}


function updateSpeedUI() {

  if (!speedRange || !speedValue)
    return;

  speedValue.textContent =
    speedRange.value;
}


/* =========================================================
   RESET MÀN
   ========================================================= */

function resetGame() {

  clearInterval(timer);

  const centerX =
    Math.floor(COLS / 2);

  const centerY =
    Math.floor(ROWS / 2);

  snake = [

    {
      x: centerX,
      y: centerY
    },

    {
      x: centerX - 1,
      y: centerY
    },

    {
      x: centerX - 2,
      y: centerY
    }

  ];

  direction = {
    x: 1,
    y: 0
  };

  nextDirection = {
    x: 1,
    y: 0
  };

  eaten = 0;

  running = false;

  paused = false;

  levelStartScore = score;

  generateObstacles();

  spawnFood();

  scoreEl.textContent = score;

  updateLevelUI();

  draw();
}


/* =========================================================
   TẠO CHƯỚNG NGẠI VẬT
   ========================================================= */

function generateObstacles() {

  obstacles = [];

  if (
    !obstacleToggle ||
    !obstacleToggle.checked
  ) {
    return;
  }

  const amount =
    getObstacleAmount().amount;

  const types =
    getBackground().obstacleTypes;

  let tries = 0;

  while (
    obstacles.length < amount &&
    tries < 3000
  ) {

    tries++;

    const p = {

      x:
        Math.floor(
          Math.random() * COLS
        ),

      y:
        Math.floor(
          Math.random() * ROWS
        ),

      type:
        types[
          Math.floor(
            Math.random() *
            types.length
          )
        ]

    };


    /* Khu vực bắt đầu an toàn */

    const centerX =
      Math.floor(COLS / 2);

    const centerY =
      Math.floor(ROWS / 2);

    if (
      Math.abs(p.x - centerX) <= 3 &&
      Math.abs(p.y - centerY) <= 3
    ) {
      continue;
    }


    /* Không trùng */

    if (
      obstacles.some(
        o =>
          o.x === p.x &&
          o.y === p.y
      )
    ) {
      continue;
    }

    obstacles.push(p);
  }
}


/* =========================================================
   TẠO MỒI
   ========================================================= */

function spawnFood() {

  let tries = 0;

  while (tries < 2000) {

    tries++;

    const candidate = {

      x:
        Math.floor(
          Math.random() * COLS
        ),

      y:
        Math.floor(
          Math.random() * ROWS
        )

    };


    const inSnake =
      snake.some(
        s =>
          s.x === candidate.x &&
          s.y === candidate.y
      );


    const inObstacle =
      obstacles.some(
        o =>
          o.x === candidate.x &&
          o.y === candidate.y
      );


    if (
      !inSnake &&
      !inObstacle
    ) {

      food = candidate;

      return;
    }
  }

  food = {
    x: 2,
    y: 2
  };
}


/* =========================================================
   BẮT ĐẦU GAME
   ========================================================= */

function startGame() {

  if (running)
    return;

  running = true;

  paused = false;

  message.classList.add(
    "hidden"
  );

  initAudio();

  startMusic();

  scheduleLoop();
}


/* =========================================================
   TỐC ĐỘ
   ========================================================= */

function scheduleLoop() {

  clearInterval(timer);

  const speed =
    Number(
      speedRange
        ? speedRange.value
        : 5
    );

  const ms =
    Math.max(
      55,
      225 -
      speed * 17 -
      level * 3
    );

  timer =
    setInterval(
      step,
      ms
    );
}


/* =========================================================
   VÒNG LẶP
   ========================================================= */

function step() {

  if (
    !running ||
    paused
  ) {
    return;
  }


  direction = {
    ...nextDirection
  };


  const head = {

    x:
      snake[0].x +
      direction.x,

    y:
      snake[0].y +
      direction.y

  };


  /* ĐỤNG TƯỜNG */

  if (
    head.x < 0 ||
    head.x >= COLS ||
    head.y < 0 ||
    head.y >= ROWS
  ) {

    gameOver();

    return;
  }


  /* ĐỤNG THÂN */

  if (
    snake.some(
      (s, index) =>
        index > 0 &&
        s.x === head.x &&
        s.y === head.y
    )
  ) {

    gameOver();

    return;
  }


  /* ĐỤNG VẬT CẢN */

  if (
    obstacles.some(
      o =>
        o.x === head.x &&
        o.y === head.y
    )
  ) {

    gameOver();

    return;
  }


  snake.unshift(head);


  /* ĂN MỒI */

  if (
    food &&
    head.x === food.x &&
    head.y === food.y
  ) {

    eaten++;

    score += 10 * level;

    if (score > best) {

      best = score;

      localStorage.setItem(
        "snakeBest",
        best
      );
    }

    scoreEl.textContent =
      score;

    bestEl.textContent =
      best;

    playEat();

    vibrate(25);

    spawnFood();


    const target =
      levels[level - 1][1];


    if (eaten >= target) {

      nextLevel();

      return;
    }

  } else {

    snake.pop();
  }


  draw();
}


/* =========================================================
   QUA MÀN
   ========================================================= */

function nextLevel() {

  clearInterval(timer);

  running = false;


  if (
    level <
    levels.length
  ) {

    messageIcon.textContent =
      "🎉";

    messageTitle.textContent =
      `Hoàn thành màn ${level}!`;

    messageText.textContent =
      `Bạn có ${score} điểm. Màn tiếp theo sẽ khó hơn.`;

    startBtn.textContent =
      "Sang màn tiếp";

    message.classList.remove(
      "hidden"
    );


    startBtn.onclick =
      () => {

        level++;

        levelStartScore =
          score;

        resetGame();

        startBtn.textContent =
          "Bắt đầu";

        startBtn.onclick =
          startGame;

        startGame();
      };

  } else {

    messageIcon.textContent =
      "🏆";

    messageTitle.textContent =
      "Bạn đã hoàn thành tất cả!";

    messageText.textContent =
      `12 màn đã được chinh phục. Tổng điểm: ${score}`;

    startBtn.textContent =
      "Chơi lại từ đầu";

    message.classList.remove(
      "hidden"
    );


    startBtn.onclick =
      () => {

        level = 1;

        score = 0;

        levelStartScore = 0;

        resetGame();

        startBtn.textContent =
          "Bắt đầu";

        startBtn.onclick =
          startGame;

        startGame();
      };
  }
}


/* =========================================================
   GAME OVER
   ========================================================= */

function gameOver() {

  clearInterval(timer);

  running = false;

  stopMusic();

  messageIcon.textContent =
    "💥";

  messageTitle.textContent =
    "Game Over";

  messageText.textContent =
    `Bạn đạt ${score} điểm ở màn ${level}.`;

  startBtn.textContent =
    "Chơi lại";

  message.classList.remove(
    "hidden"
  );


  startBtn.onclick =
    () => {

      score =
        levelStartScore;

      resetGame();

      startBtn.textContent =
        "Bắt đầu";

      startBtn.onclick =
        startGame;

      startGame();
    };
}


/* =========================================================
   ĐIỀU KHIỂN
   ========================================================= */

function setDirection(x, y) {

  if (!running) {
    startGame();
  }


  /* Không cho quay ngược */

  if (
    x === -direction.x &&
    y === -direction.y
  ) {
    return;
  }


  nextDirection = {
    x,
    y
  };
}


/* =========================================================
   VUỐT ĐIỆN THOẠI
   ========================================================= */

let touchStart = null;


gameWrap.addEventListener(
  "touchstart",
  event => {

    const touch =
      event.changedTouches[0];

    touchStart = {

      x: touch.clientX,

      y: touch.clientY

    };

    event.preventDefault();

  },
  {
    passive: false
  }
);


gameWrap.addEventListener(
  "touchend",
  event => {

    if (!touchStart)
      return;

    const touch =
      event.changedTouches[0];

    const dx =
      touch.clientX -
      touchStart.x;

    const dy =
      touch.clientY -
      touchStart.y;

    touchStart = null;


    if (
      Math.max(
        Math.abs(dx),
        Math.abs(dy)
      ) < 18
    ) {
      return;
    }


    if (
      Math.abs(dx) >
      Math.abs(dy)
    ) {

      setDirection(
        Math.sign(dx),
        0
      );

    } else {

      setDirection(
        0,
        Math.sign(dy)
      );
    }

    event.preventDefault();

  },
  {
    passive: false
  }
);


/* =========================================================
   BÀN PHÍM
   ========================================================= */

document.addEventListener(
  "keydown",
  event => {

    const keys = {

      ArrowUp: [0, -1],

      ArrowDown: [0, 1],

      ArrowLeft: [-1, 0],

      ArrowRight: [1, 0],

      w: [0, -1],

      W: [0, -1],

      s: [0, 1],

      S: [0, 1],

      a: [-1, 0],

      A: [-1, 0],

      d: [1, 0],

      D: [1, 0]

    };


    if (keys[event.key]) {

      event.preventDefault();

      setDirection(
        ...keys[event.key]
      );
    }


    if (
      event.key === " " &&
      running
    ) {

      paused = !paused;

      showToast(
        paused
          ? "⏸ Đã tạm dừng"
          : "▶ Tiếp tục"
      );
    }

  }
);


/* =========================================================
   HÀM VẼ HÌNH CHỮ NHẬT BO GÓC
   ========================================================= */

function roundedRect(
  x,
  y,
  width,
  height,
  radius
) {

  ctx.beginPath();

  ctx.roundRect(
    x,
    y,
    width,
    height,
    radius
  );

  ctx.fill();
}


/* =========================================================
   VẼ NỀN
   ========================================================= */

function drawBackground() {

  const bg =
    getBackground();

  const width =
    COLS * cell;

  const height =
    ROWS * cell;


  const gradient =
    ctx.createLinearGradient(
      0,
      0,
      width,
      height
    );

  gradient.addColorStop(
    0,
    bg.bg2
  );

  gradient.addColorStop(
    1,
    bg.bg1
  );

  ctx.fillStyle =
    gradient;

  ctx.fillRect(
    0,
    0,
    width,
    height
  );


  /* LƯỚI */

  ctx.strokeStyle =
    bg.grid;

  ctx.lineWidth = 1;


  for (
    let x = 0;
    x <= COLS;
    x++
  ) {

    ctx.beginPath();

    ctx.moveTo(
      x * cell,
      0
    );

    ctx.lineTo(
      x * cell,
      height
    );

    ctx.stroke();
  }


  for (
    let y = 0;
    y <= ROWS;
    y++
  ) {

    ctx.beginPath();

    ctx.moveTo(
      0,
      y * cell
    );

    ctx.lineTo(
      width,
      y * cell
    );

    ctx.stroke();
  }
}


/* =========================================================
   VẼ CHƯỚNG NGẠI VẬT
   ========================================================= */

function drawObstacle(obstacle) {

  const x =
    obstacle.x * cell;

  const y =
    obstacle.y * cell;

  const type =
    obstacle.type;


  /* -------------------------
     RỪNG
     ------------------------- */

  if (type === "tree") {

    ctx.fillStyle =
      "#5a341b";

    ctx.fillRect(
      x + cell * .38,
      y + cell * .40,
      cell * .24,
      cell * .50
    );

    ctx.fillStyle =
      "#24733c";

    ctx.beginPath();

    ctx.arc(
      x + cell * .5,
      y + cell * .35,
      cell * .35,
      0,
      Math.PI * 2
    );

    ctx.fill();

    return;
  }


  if (type === "rock") {

    ctx.fillStyle =
      "#68726d";

    roundedRect(
      x + 3,
      y + 5,
      cell - 6,
      cell - 7,
      5
    );

    return;
  }


  if (type === "bush") {

    ctx.fillStyle =
      "#176331";

    ctx.beginPath();

    ctx.arc(
      x + cell * .35,
      y + cell * .55,
      cell * .28,
      0,
      Math.PI * 2
    );

    ctx.arc(
      x + cell * .62,
      y + cell * .48,
      cell * .32,
      0,
      Math.PI * 2
    );

    ctx.fill();

    return;
  }


  /* -------------------------
     DINH THỰ
     ------------------------- */

  if (type === "pillar") {

    ctx.fillStyle =
      "#b7a47c";

    ctx.fillRect(
      x + cell * .30,
      y + 2,
      cell * .40,
      cell - 4
    );

    ctx.fillStyle =
      "#e0cc9c";

    ctx.fillRect(
      x + cell * .22,
      y + 2,
      cell * .56,
      4
    );

    return;
  }


  if (
    type === "table" ||
    type === "chair"
  ) {

    ctx.fillStyle =
      "#77451f";

    ctx.fillRect(
      x + cell * .18,
      y + cell * .25,
      cell * .64,
      cell * .22
    );

    ctx.fillRect(
      x + cell * .25,
      y + cell * .47,
      cell * .12,
      cell * .38
    );

    ctx.fillRect(
      x + cell * .63,
      y + cell * .47,
      cell * .12,
      cell * .38
    );

    return;
  }


  /* -------------------------
     ĐƯỜNG HẦM
     ------------------------- */

  if (type === "wall") {

    ctx.fillStyle =
      "#4e5965";

    roundedRect(
      x + 2,
      y + 2,
      cell - 4,
      cell - 4,
      3
    );

    ctx.strokeStyle =
      "#8995a3";

    ctx.stroke();

    return;
  }


  if (type === "barrier") {

    ctx.fillStyle =
      "#c13d36";

    ctx.fillRect(
      x + 2,
      y + cell * .30,
      cell - 4,
      cell * .25
    );

    ctx.fillStyle =
      "#d6dbe0";

    ctx.fillRect(
      x + 3,
      y + cell * .58,
      cell - 6,
      3
    );

    return;
  }


  if (type === "lamp") {

    ctx.fillStyle =
      "#e5c85e";

    ctx.beginPath();

    ctx.arc(
      x + cell / 2,
      y + cell * .35,
      cell * .22,
      0,
      Math.PI * 2
    );

    ctx.fill();

    ctx.strokeStyle =
      "#566372";

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.moveTo(
      x + cell / 2,
      y + cell * .55
    );

    ctx.lineTo(
      x + cell / 2,
      y + cell
    );

    ctx.stroke();

    return;
  }


  /* -------------------------
     NHÀ
     ------------------------- */

  if (type === "cabinet") {

    ctx.fillStyle =
      "#75431f";

    roundedRect(
      x + 3,
      y + 2,
      cell - 6,
      cell - 4,
      3
    );

    ctx.strokeStyle =
      "#d09048";

    ctx.lineWidth = 2;

    ctx.strokeRect(
      x + cell * .25,
      y + cell * .18,
      cell * .5,
      cell * .64
    );

    return;
  }


  /* -------------------------
     KHU VUI CHƠI
     ------------------------- */

  if (type === "fence") {

    ctx.strokeStyle =
      "#e85d75";

    ctx.lineWidth = 3;

    ctx.beginPath();

    ctx.moveTo(
      x + cell * .15,
      y + cell * .75
    );

    ctx.lineTo(
      x + cell * .85,
      y + cell * .75
    );

    ctx.moveTo(
      x + cell * .25,
      y + cell * .25
    );

    ctx.lineTo(
      x + cell * .25,
      y + cell * .85
    );

    ctx.moveTo(
      x + cell * .70,
      y + cell * .25
    );

    ctx.lineTo(
      x + cell * .70,
      y + cell * .85
    );

    ctx.stroke();

    return;
  }


  if (type === "bench") {

    ctx.fillStyle =
      "#e4a936";

    ctx.fillRect(
      x + cell * .15,
      y + cell * .30,
      cell * .70,
      cell * .18
    );

    ctx.fillRect(
      x + cell * .20,
      y + cell * .52,
      cell * .60,
      cell * .16
    );

    return;
  }


  if (type === "slide") {

    ctx.strokeStyle =
      "#63b6ff";

    ctx.lineWidth = 4;

    ctx.beginPath();

    ctx.moveTo(
      x + cell * .20,
      y + cell * .20
    );

    ctx.lineTo(
      x + cell * .65,
      y + cell * .20
    );

    ctx.lineTo(
      x + cell * .78,
      y + cell * .78
    );

    ctx.stroke();

    return;
  }
}


/* =========================================================
   VẼ MỒI
   ========================================================= */

function drawFood() {

  if (!food)
    return;

  const cx =
    food.x * cell +
    cell / 2;

  const cy =
    food.y * cell +
    cell / 2;

  const radius =
    cell * .30;


  ctx.shadowColor =
    "#ff4b5c";

  ctx.shadowBlur = 12;

  ctx.fillStyle =
    "#ff4355";

  ctx.beginPath();

  ctx.arc(
    cx,
    cy,
    radius,
    0,
    Math.PI * 2
  );

  ctx.fill();

  ctx.shadowBlur = 0;


  /* Lá */

  ctx.fillStyle =
    "#4edb72";

  ctx.beginPath();

  ctx.ellipse(
    cx + cell * .14,
    cy - cell * .29,
    cell * .12,
    cell * .07,
    -0.5,
    0,
    Math.PI * 2
  );

  ctx.fill();
}


/* =========================================================
   VẼ RẮN
   ========================================================= */

function drawSnake() {

  snake.forEach(
    (part, index) => {

      const x =
        part.x * cell;

      const y =
        part.y * cell;


      if (index === 0) {

        ctx.shadowColor =
          "#49e38a";

        ctx.shadowBlur = 10;

        ctx.fillStyle =
          "#50ed91";

      } else {

        ctx.shadowBlur = 0;

        ctx.fillStyle =
          index % 2 === 0
            ? "#2bbd6a"
            : "#36d879";
      }


      roundedRect(
        x + 2,
        y + 2,
        cell - 4,
        cell - 4,
        cell * .25
      );

      ctx.shadowBlur = 0;


      /* Mắt */

      if (index === 0) {

        ctx.fillStyle =
          "#06100a";

        const eyeOffset =
          cell * .22;

        let eye1;
        let eye2;


        if (direction.x !== 0) {

          eye1 = {
            x:
              x +
              cell / 2 +
              direction.x * cell * .20,

            y:
              y +
              cell * .32
          };

          eye2 = {
            x:
              x +
              cell / 2 +
              direction.x * cell * .20,

            y:
              y +
              cell * .68
          };

        } else {

          eye1 = {
            x:
              x +
              cell * .32,

            y:
              y +
              cell / 2 +
              direction.y * cell * .20
          };

          eye2 = {
            x:
              x +
              cell * .68,

            y:
              y +
              cell / 2 +
              direction.y * cell * .20
          };
        }


        ctx.beginPath();

        ctx.arc(
          eye1.x,
          eye1.y,
          cell * .055,
          0,
          Math.PI * 2
        );

        ctx.arc(
          eye2.x,
          eye2.y,
          cell * .055,
          0,
          Math.PI * 2
        );

        ctx.fill();
      }
    }
  );
}


/* =========================================================
   VẼ GAME
   ========================================================= */

function draw() {

  if (!canvas)
    return;


  drawBackground();


  obstacles.forEach(
    drawObstacle
  );


  drawFood();

  drawSnake();
}


/* =========================================================
   AUDIO
   ========================================================= */

function initAudio() {

  if (!audioCtx) {

    const AudioContext =
      window.AudioContext ||
      window.webkitAudioContext;

    if (!AudioContext)
      return;

    audioCtx =
      new AudioContext();
  }

  if (
    audioCtx.state ===
    "suspended"
  ) {
    audioCtx.resume();
  }
}


function playEat() {

  if (
    !eatSoundToggle ||
    !eatSoundToggle.checked
  ) {
    return;
  }

  initAudio();

  if (!audioCtx)
    return;


  const oscillator =
    audioCtx.createOscillator();

  const gain =
    audioCtx.createGain();


  oscillator.type =
    "sine";

  oscillator.frequency.setValueAtTime(
    520,
    audioCtx.currentTime
  );

  oscillator.frequency.exponentialRampToValueAtTime(
    850,
    audioCtx.currentTime + 0.08
  );


  gain.gain.setValueAtTime(
    0.0001,
    audioCtx.currentTime
  );

  gain.gain.exponentialRampToValueAtTime(
    0.12,
    audioCtx.currentTime + 0.01
  );

  gain.gain.exponentialRampToValueAtTime(
    0.0001,
    audioCtx.currentTime + 0.12
  );


  oscillator.connect(gain);

  gain.connect(
    audioCtx.destination
  );


  oscillator.start();

  oscillator.stop(
    audioCtx.currentTime + 0.13
  );
}


/* =========================================================
   NHẠC NỀN
   ========================================================= */

function startMusic() {

  if (
    !musicToggle ||
    !musicToggle.checked
  ) {
    return;
  }

  if (musicTimer)
    return;

  initAudio();

  if (!audioCtx)
    return;


  const notes = [
    261.63,
    329.63,
    392.00,
    329.63,
    293.66,
    349.23,
    440.00,
    349.23
  ];

  let index = 0;


  musicTimer =
    setInterval(() => {

      if (
        !running ||
        paused ||
        !musicToggle.checked
      ) {
        return;
      }


      const osc =
        audioCtx.createOscillator();

      const gain =
        audioCtx.createGain();


      osc.type =
        "triangle";

      osc.frequency.value =
        notes[index % notes.length];


      gain.gain.setValueAtTime(
        0.0001,
        audioCtx.currentTime
      );

      gain.gain.exponentialRampToValueAtTime(
        0.025,
        audioCtx.currentTime + 0.02
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        audioCtx.currentTime + 0.22
      );


      osc.connect(gain);

      gain.connect(
        audioCtx.destination
      );


      osc.start();

      osc.stop(
        audioCtx.currentTime + 0.24
      );


      index++;

    }, 420);
}


function stopMusic() {

  clearInterval(
    musicTimer
  );

  musicTimer = null;
}


/* =========================================================
   RUNG
   ========================================================= */

function vibrate(ms) {

  if (
    vibrateToggle &&
    vibrateToggle.checked &&
    navigator.vibrate
  ) {

    navigator.vibrate(ms);
  }
}


/* =========================================================
   CÀI ĐẶT
   ========================================================= */

if (gearBtn) {

  gearBtn.addEventListener(
    "click",
    () => {

      settings.classList.toggle(
        "show"
      );

    }
  );
}


if (closeSettings) {

  closeSettings.addEventListener(
    "click",
    () => {

      settings.classList.remove(
        "show"
      );

    }
  );
}


/* =========================================================
   ĐỔI TỐC ĐỘ
   ========================================================= */

if (speedRange) {

  speedRange.addEventListener(
    "input",
    () => {

      updateSpeedUI();

      if (running) {
        scheduleLoop();
      }

    }
  );
}


/* =========================================================
   ĐỔI BỐI CẢNH
   ========================================================= */

if (backgroundSelect) {

  backgroundSelect.addEventListener(
    "change",
    () => {

      localStorage.setItem(
        "snakeBackground",
        backgroundSelect.value
      );

      generateObstacles();

      spawnFood();

      draw();

      showToast(
        `🌍 Bối cảnh: ${getBackground().name}`
      );
    }
  );
}


/* =========================================================
   ĐỔI MỨC ĐỘ
   ========================================================= */

if (obstacleLevel) {

  obstacleLevel.addEventListener(
    "change",
    () => {

      localStorage.setItem(
        "snakeObstacleLevel",
        obstacleLevel.value
      );

      generateObstacles();

      spawnFood();

      draw();

      showToast(
        `🧱 Chướng ngại vật: ${getObstacleAmount().name}`
      );
    }
  );
}


/* =========================================================
   BẬT / TẮT CHƯỚNG NGẠI VẬT
   ========================================================= */

if (obstacleToggle) {

  obstacleToggle.addEventListener(
    "change",
    () => {

      generateObstacles();

      spawnFood();

      draw();

    }
  );
}


/* =========================================================
   ÂM THANH
   ========================================================= */

if (musicToggle) {

  musicToggle.addEventListener(
    "change",
    () => {

      if (musicToggle.checked) {

        startMusic();

      } else {

        stopMusic();
      }

    }
  );
}


/* =========================================================
   RESTART
   ========================================================= */

if (restartBtn) {

  restartBtn.addEventListener(
    "click",
    () => {

      score = 0;

      level = 1;

      levelStartScore = 0;

      resetGame();

      settings.classList.remove(
        "show"
      );

      messageIcon.textContent =
        "🐍";

      messageTitle.textContent =
        "Rắn săn mồi";

      messageText.textContent =
        "Ăn mồi, lớn lên và vượt qua tất cả các màn!";

      startBtn.textContent =
        "Bắt đầu";

      startBtn.onclick =
        startGame;

      message.classList.remove(
        "hidden"
      );

    }
  );
}


/* =========================================================
   LƯU / KHÔI PHỤC CÀI ĐẶT
   ========================================================= */

function loadSettings() {

  if (backgroundSelect) {

    const savedBackground =
      localStorage.getItem(
        "snakeBackground"
      );

    if (
      savedBackground &&
      backgrounds[savedBackground]
    ) {

      backgroundSelect.value =
        savedBackground;
    }
  }


  if (obstacleLevel) {

    const savedObstacleLevel =
      localStorage.getItem(
        "snakeObstacleLevel"
      );

    if (
      savedObstacleLevel &&
      obstacleAmounts[
        savedObstacleLevel
      ]
    ) {

      obstacleLevel.value =
        savedObstacleLevel;
    }
  }


  updateSpeedUI();
}


/* =========================================================
   KHỞI TẠO
   ========================================================= */

loadSettings();

resetGame();

resizeCanvas();

startBtn.onclick =
  startGame;