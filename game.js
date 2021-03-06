function random(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

function randomSign() {
  return Math.random() - 0.5 > 0 ? -1 : 1;
}

(async function (document, window) {
  const gameboardEl = document.getElementById("gameboard");
  const gameboardCtx = gameboardEl.getContext("2d");

  const params = new URLSearchParams(document.location.search.substring(1));
  const orgName = params.get("orgName") || "Headquarters";
  const botName = params.get("botName") || "bot";

  const chatSectionHeight = 40;
  const botIcon = "\uf215";
  const botMessageIcon = "\uf075";
  const visitorMessageIcon = "\uf0e5";
  const sendIcon = "\uf1d9";
  const scoreIcon = "\uf0e6";
  const particleIcon = "\uf164";

  let gameboard;
  let botDx;
  const botSpeed = 5;
  let botPos;
  let keyPressed;
  let botMessages;
  const botMessagesSpeed = 5;
  let lastBotMessageAt;
  let botMessagesPerSecond;
  let visitorMessages;
  let visitorMessagesSpeed;
  let visitorMessagesPerSecond;
  let lastVisitorMessageAt;
  let explosionParticles;
  let isStarted;
  let isOver;
  let score;
  let highscore = 0;

  document.addEventListener("keydown", handleKeydown);
  document.addEventListener("keyup", handleKeyUp);

  function init() {
    gameboard = {
      width: gameboardEl.width,
      height: gameboardEl.height - chatSectionHeight,
    };
    botDx = 0;
    botPos = { x: gameboard.width / 2 - 10, y: gameboard.height - 16 };
    keyPressed;
    botMessages = new Set();
    botMessagesPerSecond = 1.1;
    lastBotMessageAt = Date.now();
    visitorMessages = new Set();
    visitorMessagesPerSecond = 1;
    visitorMessagesSpeed = 0.3;
    lastVisitorMessageAt = Date.now() - 1500;
    explosionParticles = new Set();
    isStarted = false;
    isOver = false;
    score = 0;
  }

  function main() {
    clearBoard();
    drawChatSection();
    drawScore();
    drawBot();
    sendBotMessage();
    drawBotMessages();
    drawVisitorMessages();
    drawExplosionParticles();
    if (!isOver) {
      requestAnimationFrame(main);
    }
  }

  function handleKeydown(event) {
    if (!isStarted) {
      isStarted = true;
      main();
      return;
    }
    if (event.code === "ArrowLeft") {
      keyPressed = event.code;
      botDx = -botSpeed;
    }
    if (event.code === "ArrowRight") {
      keyPressed = event.code;
      botDx = botSpeed;
    }
  }

  function handleKeyUp(event) {
    if (["ArrowLeft", "ArrowRight"].includes(event.code)) {
      keyPressed = undefined;
    }
  }

  function drawBot() {
    if (
      (keyPressed === "ArrowLeft" && botPos.x + botDx > 0) ||
      (keyPressed === "ArrowRight" && botPos.x + botDx < gameboard.width - 22)
    ) {
      botPos.x += botDx;
    }
    drawIcon(botIcon, botPos.x, botPos.y);
  }

  function drawBotMessage(message) {
    if (message.y < -10) {
      botMessages.delete(message);
      return;
    }
    message.y -= botMessagesSpeed;
    drawIcon(botMessageIcon, message.x, message.y);
  }

  function drawIcon(unicode, x, y, color) {
    gameboardCtx.font = "600 16px FontAwesome";
    gameboardCtx.fillStyle = color || "black";
    gameboardCtx.fillText(unicode, x, y + 12);
  }

  function clearBoard() {
    gameboardCtx.fillStyle = "#fff";
    gameboardCtx.fillRect(0, 0, gameboard.width, gameboard.height + chatSectionHeight);
  }

  function drawChatSection() {
    gameboardCtx.strokeStyle = "#999";
    gameboardCtx.lineJoin = "round";
    gameboardCtx.strokeRect(5, gameboard.height, gameboard.width - 10, chatSectionHeight - 10);
    drawIcon(sendIcon, gameboard.width - 30, gameboard.height + 8, "#999");
  }

  function sendBotMessage() {
    if ((Date.now() - lastBotMessageAt) / 1000 < 1 / botMessagesPerSecond) {
      return;
    }
    lastBotMessageAt = Date.now();
    botMessages.add({
      x: botPos.x,
      y: gameboard.height - 16,
    });
  }

  function drawBotMessages() {
    for (const message of botMessages) {
      drawBotMessage(message);
    }
  }

  function drawVisitorMessages() {
    if ((Date.now() - lastVisitorMessageAt) / 1000 > 1 / visitorMessagesPerSecond) {
      visitorMessages.add({ x: random(30, gameboard.width - 30), y: -20 });
      lastVisitorMessageAt = Date.now();
    }
    for (const message of visitorMessages) {
      drawVisitorMessage(message);
    }
  }

  function drawVisitorMessage(message) {
    message.y += visitorMessagesSpeed;
    if (message.y > gameboard.height - 16) {
      visitorMessages.delete(message);
      isOver = true;
      highscore = score > highscore ? score : highscore;
      setTimeout(() => {
        clearBoard();
        drawEndChat();
      }, 1000);
      return;
    }
    for (const botMessage of botMessages) {
      if (
        botMessage.x > message.x - 16 &&
        botMessage.x < message.x + 16 &&
        botMessage.y > message.y - 5 &&
        botMessage.y < message.y + 5
      ) {
        visitorMessages.delete(message);
        botMessages.delete(botMessage);
        explode(message.x, message.y);
        updateScore();
        return;
      }
    }
    drawIcon(visitorMessageIcon, message.x, message.y);
  }

  function updateScore() {
    score += 1;
    if (score % 10 === 0) {
      if (visitorMessagesPerSecond < 2.5) {
        visitorMessagesPerSecond += 0.05;
      }
      if (visitorMessagesSpeed < 1) {
        visitorMessagesSpeed += 0.05;
      }
      if (botMessagesPerSecond < 3) {
        botMessagesPerSecond += 0.1;
      }
    }
  }

  function drawScore() {
    drawIcon(scoreIcon, 10, 12);
    gameboardCtx.font = "400 16px monospace";
    gameboardCtx.fillStyle = "black";
    gameboardCtx.fillText(score, 39, 25);
    if (highscore > 0) {
      gameboardCtx.fillText(`HI ${highscore}`, 10, 45);
    }
  }

  function explode(x, y) {
    for (let i = 0; i < 10; i++) {
      explosionParticles.add({
        x,
        y,
        dx: randomSign() * random(1, 3),
        dy: randomSign() * random(1, 3),
        alpha: 1,
      });
    }
  }

  function drawExplosionParticles() {
    for (const particle of explosionParticles) {
      drawExplosionParticle(particle);
    }
  }

  function drawExplosionParticle(particle) {
    particle.alpha -= 0.05;
    if (particle.alpha <= 0) {
      explosionParticles.delete(particle);
      return;
    }
    particle.x += particle.dx;
    particle.y += particle.dy;
    gameboardCtx.font = "8px FontAwesome";
    gameboardCtx.fillStyle = "black";
    gameboardCtx.save();
    gameboardCtx.globalAlpha = particle.alpha;
    gameboardCtx.fillText(particleIcon, particle.x, particle.y + 12);
    gameboardCtx.restore();
  }

  function drawChatMessages(chatMessages) {
    chatMessages.forEach((message, i) =>
      setTimeout(() => {
        if (!isStarted) {
          drawChatMessage(message);
        }
      }, i * 1500)
    );
  }

  function drawChatMessage({ from, text, y, isLeft }) {
    const indent = 10;
    gameboardCtx.fillStyle = "black";
    gameboardCtx.font = "600 10px monospace";
    const fromMeasure = gameboardCtx.measureText(from);
    gameboardCtx.fillText(
      from,
      isLeft ? indent : gameboard.width - fromMeasure.width - indent,
      y + fromMeasure.actualBoundingBoxAscent
    );
    gameboardCtx.strokeStyle = "#999";
    gameboardCtx.lineJoin = "round";
    gameboardCtx.font = "12px monospace";
    const textMeasure = gameboardCtx.measureText(text);
    gameboardCtx.fillText(
      text,
      isLeft ? indent * 2 : gameboard.width - textMeasure.width - indent * 2,
      y + textMeasure.actualBoundingBoxAscent + indent * 2 + 4
    );
    gameboardCtx.strokeRect(
      isLeft ? indent : gameboard.width - textMeasure.width - 30,
      y + 12,
      textMeasure.width + 20,
      35
    );
  }

  function drawStartChat() {
    drawChatSection();

    const startChatMessages = [
      { from: orgName, text: `Hey, ${botName}!`, y: 10, isLeft: true },
      { from: botName, text: "What's up?", y: 70 },
      { from: orgName, text: "We need help answering messages!", y: 130, isLeft: true },
      { from: botName, text: "Sure thing!", y: 200 },
      { from: orgName, text: "Press any key when ready!", y: 260, isLeft: true },
    ];
    drawChatMessages(startChatMessages);
  }

  function getScoreMessage() {
    if (score < 50) {
      return "You can do better!";
    }
    if (score < 150) {
      return "Not bad!";
    }
    if (score < 300) {
      return "Great work!";
    }
    if (score < 600) {
      return "Awesome!";
    }
    return "Impossible!";
  }

  function drawEndChat() {
    drawChatSection();

    const endChatMessages = [
      { from: orgName, text: `You answered ${score} messages`, y: 10, isLeft: true },
      { from: "", text: getScoreMessage(), y: 50, isLeft: true },
      { from: botName, text: "Got it!", y: 110 },
      { from: orgName, text: "Press any key to play again!", y: 170, isLeft: true },
    ];
    drawChatMessages(endChatMessages);
    init();
  }

  const font = new FontFace(
    "FontAwesome",
    'url("https://cdnjs.cloudflare.com/ajax/libs/font-awesome/4.5.0/fonts/fontawesome-webfont.woff2?v=4.5.0")'
  );
  await font.load();
  document.fonts.add(font);

  let resizeTimeout;
  const resize = () => {
    if (resizeTimeout) {
      window.clearTimeout(resizeTimeout);
    }

    resizeTimeout = setTimeout(() => {
      isOver = true;
      setTimeout(() => {
        gameboardEl.height = Math.max(window.innerHeight, 600);
        gameboardEl.width = Math.min(window.innerWidth, 580);
        init();
        clearBoard();
        drawStartChat();
      }, 50);
    }, 500);
  };
  window.addEventListener("resize", resize);
  resize();
})(document, window);
