const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
const { width, height } = canvas;
const ROWS = 22;
const COLS = 16;
const LEFT_BOUND = 0;
const RIGHT_BOUND = COLS - 1;
const BOTTOM_BOUND = ROWS - 1;
const SCALE = 30;
const UNIT = 1;
const STEP = 1;
const COLORS = {
  background: '#fff',
  stroke: '#ffefff',
  landed: '#75dbcd',
  I: '#43aa8b',
  J: '#ff5A5f',
  O: '#f17f29',
  S: '#00a8e8',
  T: '#58a4b0',
};
const multiplier = 10;
const BLOCKS = {
  I: [
    { col: 0, row: 0 },
    { col: 1, row: 0 },
    { col: 2, row: 0 },
    { col: 3, row: 0 },
  ],
  J: [
    { col: 1, row: 0 },
    { col: 1, row: 1 },
    { col: 1, row: 2 },
    { col: 0, row: 2 },
  ],
  O: [
    { col: 0, row: 0 },
    { col: 0, row: 1 },
    { col: 1, row: 0 },
    { col: 1, row: 1 },
  ],
  S: [
    { col: 0, row: 0 },
    { col: 1, row: 0 },
    { col: 1, row: 1 },
    { col: 2, row: 1 },
  ],
  T: [
    { col: 1, row: 0 },
    { col: 0, row: 1 },
    { col: 1, row: 1 },
    { col: 2, row: 1 },
  ],
};

// `currentBoard` is a 2d array with initial values of zero
let currentBoard;
let currentBlock;
let positions;
let completedLines;
let offsetX = 0;
let offsetY = 0;
// Origin is position where we rotate around
let originX;
let originY;
let direction;
let gravity;
let timer;
let seconds = 0;
let score = 0;
let audioPlay = true;

context.scale(SCALE, SCALE);

function init() {
  console.log('Init');

  currentBlock = getNextBlock();
  positions = [...BLOCKS[currentBlock]];
  originX = positions[2].col;
  originY = positions[2].row;

  createBlock(positions);
}

/** Create a board with 22 rows and 16 cols */
function createBoard() {
  let matrix = [];

  for (let row = 0; row < ROWS; row += 1) {
    let newRow = [];
    for (let col = 0; col < COLS; col += 1) {
      newRow.push(0);
    }
    matrix.push(newRow);
  }

  currentBoard = matrix;
  drawGrid();

  /**
   * [ [0,0,0,0,0,0,0,0,0,0],
   *   [0,0,0,0,0,0,0,0,0,0],
   *   [0,0,0,0,0,0,0,0,0,0],
   *   ...
   * ]
   */
}

function recreateBoard() {
  clearBoard();

  // Check if a row is filled yet
  // If it is, then clear that row and reset `completedLines`
  // and update board
  if (isRowFilled()) {
    clearRow();
    updateScore();
    completedLines = [];
  }

  for (let row = 0; row < currentBoard.length; row += 1) {
    for (let col = 0; col < currentBoard[row].length; col += 1) {
      if (currentBoard[row][col] === 1) {
        drawSquare(col, row, COLORS.landed);
      }
    }
  }
}

function updateBoard() {
  let x;
  let y;

  positions.forEach((pos) => {
    x = pos.col + offsetX;
    y = pos.row + offsetY;
    currentBoard[y][x] = 1;
  });
}

function createBlock(positions) {
  let x;
  let y;

  positions.forEach((p) => {
    x = p.col + offsetX;
    y = p.row + offsetY;

    if (isGameOver(x, y)) {
      stopGravity();
      showGameOver();
      resetTime();
      return;
    }

    drawSquare(x, y, COLORS[currentBlock]);
  });
}

function drawSquare(x, y, color) {
  context.fillStyle = color;
  context.strokeStyle = COLORS.stroke;
  // .fillRect(X,Y,W,H) where X and Y are square positions and W and H is width and height
  context.fillRect(x, y, UNIT, UNIT);
  context.strokeRect(x, y, UNIT, UNIT);
}

function drawGrid() {
  context.beginPath();

  for (let x = 0; x <= width; x += STEP) {
    context.moveTo(x, 0);
    context.lineTo(x, height);
  }

  context.strokeStyle = COLORS.stroke;
  context.lineWidth = 0.1;
  context.stroke();

  context.beginPath();

  for (let y = 0; y <= height; y += STEP) {
    context.moveTo(0, y);
    context.lineTo(width, y);
  }

  context.strokeStyle = COLORS.stroke;
  context.lineWidth = 0.1;
  context.stroke();
}

/** Clear by changing color to background */
function clearBlock(x, y) {
  context.fillStyle = COLORS.background;
  context.strokeStyle = COLORS.stroke;
  context.fillRect(x, y, UNIT, UNIT);
  context.strokeRect(x, y, UNIT, UNIT);
}

/** Reset and clear entire board */
function clearBoard() {
  context.clearRect(0, 0, width, height);
  drawGrid();
}

function clearPreviousBlock() {
  positions.forEach((pos) => {
    clearBlock(pos.col + offsetX, pos.row + offsetY);
  });
}

function isGameOver(x, y) {
  return currentBoard[y][x] && currentBoard[y][x] !== 0;
}

function isRowFilled() {
  const COMPLETED_LINES = [];
  let counter = 0;

  for (let row = 0; row < currentBoard.length; row += 1) {
    counter = 0;
    for (let col = 0; col < currentBoard[row].length; col += 1) {
      counter += currentBoard[row][col];

      if (counter === COLS) {
        COMPLETED_LINES.push(row);
      }
    }
  }

  completedLines = COMPLETED_LINES;
  return COMPLETED_LINES.length;
}

function clearRow() {
  completedLines.forEach((row) => {
    currentBoard.splice(row, 1);
    currentBoard.unshift(Array.from(Array(COLS), () => 0));
  });
}

function moveDown() {
  clearPreviousBlock();
  createBlock(positions.map((pos) => ({ col: pos.col, row: pos.row + 1 })));
}

function canDrop() {
  return positions.every((pos) => {
    return (
      pos.row + offsetY < BOTTOM_BOUND &&
      currentBoard[pos.row + offsetY][pos.col + offsetX] !== 1 &&
      currentBoard[pos.row + offsetY + 1][pos.col + offsetX] !== 1
    );
  });
}

/** Check if we can move block without colliding into walls */
function canMove() {
  // If col is less than 0 or greater than 15
  // or row is greater than 21, then block is out of bounds
  // and we return false
  let x;
  let y;

  return positions.every((pos) => {
    x = pos.col + offsetX;
    y = pos.row + offsetY;

    if (direction === 'left') {
      return (
        x > LEFT_BOUND &&
        currentBoard[y][x] !== 1 &&
        currentBoard[y][x - 1] !== 1 &&
        y < BOTTOM_BOUND
      );
    }

    if (direction === 'right') {
      return (
        x < RIGHT_BOUND &&
        currentBoard[y][x] !== 1 &&
        currentBoard[y][x + 1] !== 1 &&
        y < BOTTOM_BOUND
      );
    }
  });
}

function canRotate() {
  let x;
  let y;
  let rotatedY;
  let rotatedX;

  return positions.every((pos) => {
    x = pos.col - originX;
    y = pos.row - originY;

    rotatedY = -x;
    rotatedX = y;

    x = originX + rotatedX + offsetX;
    y = originY + rotatedY + offsetY;

    return y >= 0 && y < BOTTOM_BOUND && x >= 0 && currentBoard[y][x] === 0;
  });
}

function updateGame() {
  updateBoard();
  offsetX = 0;
  offsetY = 0;
  recreateBoard();
  init();
}

function drop() {
  if (canDrop()) {
    moveDown();
    offsetY += 1;
  } else {
    console.log('Landed!');
    updateGame();
  }
}

function moveLeftOrRight() {
  positions.forEach((pos) => {
    drawSquare(pos.col + offsetX, pos.row + offsetY, COLORS[currentBlock]);
  });
}

/** Rotate current block 90 deg */
function rotate() {
  let x;
  let y;
  let rotatedX;
  let rotatedY;
  let col;
  let row;

  const copy = positions.map((p) => {
    // Rotating counterclockwise is (x, y) -> (y, -x)
    // We rotate around a point, which is (originX, originY)
    x = p.col - originX;
    y = p.row - originY;
    rotatedX = y;
    rotatedY = -x;
    col = originX + rotatedX;
    row = originY + rotatedY;

    drawSquare(col + offsetX, row + offsetY, COLORS[currentBlock]);

    // Use spread operator to prevent mutating original blocks
    return { ...{ col }, ...{ row } };
  });

  positions = copy;
}

function moveBlock(e) {
  switch (e.keyCode) {
    case 37:
      direction = 'left';
      if (canMove()) {
        clearPreviousBlock();
        offsetX -= 1;
        moveLeftOrRight();
      }
      break;
    case 39:
      direction = 'right';
      if (canMove()) {
        clearPreviousBlock();
        offsetX += 1;
        moveLeftOrRight();
      }
      break;
    case 40:
      direction = 'down';
      if (canDrop()) {
        moveDown();
        offsetY += 1;
      } else {
        console.log('Landed!');
        updateGame();
      }
      break;
    case 38:
      direction = 'up';
      if (canRotate()) {
        clearPreviousBlock();
        rotate();
      }
      break;
    case 32:
      e.preventDefault();

      if (audioPlay === true) {
        stopAudio();
        return;
      }

      startAudio();
      break;
    default:
      break;
  }
}

/** Return a random block from 5 options */
function getNextBlock() {
  const BLOCKS = ['I', 'J', 'O', 'S', 'T'];
  const index = Math.floor(Math.random() * BLOCKS.length);
  return BLOCKS[index];
}

function updateScore() {
  const container = document.querySelector('.score');
  // Multiple level one score by number of rows cleared
  // and add to total score so far
  score += multiplier * completedLines.length;
  container.innerHTML = score;
}

function resetScore() {
  const container = document.querySelector('.score');

  score = 0;
  container.innerHTML = score;
}

function startTime() {
  timer = setInterval(updateTime, 1000);
}

function updateTime() {
  seconds += 1;

  const container = document.querySelector('.time');
  const min = seconds > 0 ? parseInt(seconds / 60, 10) : '0';
  const sec = seconds > 0 ? seconds % 60 : '0';

  container.innerHTML = formatTime(min, sec);
}

function resetTime() {
  seconds = 0;
  clearInterval(timer);
}

function formatTime(min, sec) {
  min = String(min).length < 2 ? '0' + min : min;
  sec = String(sec).length < 2 ? '0' + sec : sec;

  return min + ':' + sec;
}

function showGameOver() {
  const modal = document.querySelector('.modal');
  const container = document.querySelector('.container');
  const finalScore = document.querySelector('.final-score');
  const audio = document.getElementById('game-over');

  finalScore.innerHTML = score;
  modal.className = 'flex-col modal';
  container.style.filter = 'brightness(50%)';
  audio.play();
}

function hideGameOver() {
  const modal = document.querySelector('.modal');
  const container = document.querySelector('.container');

  modal.className = 'hidden modal';
  container.style.filter = 'none';
}

function tryAgain() {
  clearBoard();
  createBoard();
  hideGameOver();
  resetScore();
  init();
  startGravity();
  startTime();
}

function startGravity() {
  gravity = setInterval(drop, 300);
}

function stopGravity() {
  clearInterval(gravity);
}

function startAudio() {
  const audio = document.getElementById('audio');
  audioPlay = true;
  audio.play();
}

function stopAudio() {
  const audio = document.getElementById('audio');
  audioPlay = false;
  audio.pause();
}

document.addEventListener('DOMContentLoaded', () => {
  document.addEventListener('keydown', moveBlock);
  document.addEventListener('click', (e) => {
    if (e.target.tagName.toLowerCase() === 'button') {
      tryAgain();
    }
  });

  startAudio();
  createBoard();
  init();
  startGravity();
  startTime();
});
