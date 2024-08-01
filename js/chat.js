const e = (() => {
  "use strict";

  const domID = (id) => document.getElementById(id);
  let socket;
  const welcomeScreen = domID("welcomeScreen");
  const chatWindow = domID("chatWindow");
  const chatMain = domID("chatMain");
  const chatMainDiv = domID("chatMainDiv");
  const chatArea = domID("chatArea");
  const disconnectButton = domID("disconnectButton");
  const startButton = domID("startButton");
  let typingtimer = null;
  let isTyping = false;
  const isTypingDiv = domID("isTypingDiv");
  
  let strangerTyping = false;
  let disconnectType = false;
  let peopleOnline = 0;
  const peopleOnlineSpan = domID("peopleOnlineSpan");
  const alertSound = domID("alertSound");
  let isBlurred = false;
  let notify = 0;
  let firstNotify = true;
  let lastNotify = null;
  let notifyTimer = null;
  const url_pattern = /https?:\/\/([-\w\.]+)+(:\d+)?(\/([\w/_\.]*(\?\S+)?)?)?/;

  alertSound.volume = 1.0;

  const setTyping = (state) => {
    isTypingDiv.style.bottom = state
      ? "80px"
      : `${80 - isTypingDiv.offsetHeight}px`;
    strangerTyping = state;
  };

  const createConnection = () => {
    socket = io.connect(null, {
      reconnect: false,
      "force new connection": true,
    });

    chatMainDiv.innerHTML = "";
    logChat(0, "Connecting to server...");

    socket.on("connect", () => {
      chatMainDiv.innerHTML = "";
      logChat(0, "Waiting for a stranger ...");
      setTyping(false);
    });

    socket.on("conn", () => {
      chatMainDiv.innerHTML = "";
      logChat(0, "You are now chatting with a random stranger. Say Hi!");
      disconnectButton.disabled = false;
      disconnectButton.value = "Disconnect";
      chatArea.disabled = false;
      chatArea.value = "";
      chatArea.focus();
    });

    socket.on("disconn", (data) => {
      const { who, reason } = data;
      chatArea.disabled = true;

      if (who === 1) {
        logChat(0, "You have disconnected.");
      } else if (who === 2) {
        logChat(0, "Stranger has disconnected.");
        if (reason) {
          logChat(0, `Reason: ${reason}`);
        }
      }
      clearTimeout(typingtimer);
      isTyping = false;
      setTyping(false);
      disconnectType = true;
      disconnectButton.disabled = false;
      disconnectButton.value = "New"; // TODO:Next bottom
      chatArea.disabled = true;
      chatArea.focus();
    });

    socket.on("chat", (message) => {
      logChat(2, message);
      alertSound.currentTime = 0;
      if (isBlurred) {
        alertSound.play();
      }
    });

    socket.on("typing", (state) => setTyping(state));

    socket.on("stats", (stats) => {
      if (stats.people !== undefined) {
        peopleOnlineSpan.innerHTML = stats.people;
      }
    });

    socket.on("disconnect", () => {
      logChat(0, "Connection lost");
      logChat(
        -1,
        "<input type='button' value='Reconnect' onclick='e.startChat();'>"
      );
      peopleOnlineSpan.innerHTML = "0";
      chatArea.disabled = true;
      disconnectButton.disabled = true;
      setTyping(false);
      disconnectType = false;
    });

    socket.on("error", () => {
      logChat(0, "Connection error");
      logChat(
        -1,
        "<input type='button' value='Reconnect' onclick='e.startChat();'>"
      );
      peopleOnlineSpan.innerHTML = "0";
      chatArea.disabled = true;
      disconnectButton.disabled = true;
      setTyping(false);
      disconnectType = false;
    });
  };
  // color messages yellow and blue

  const logChat = (type, message) => {
    let who = "";
    let who2 = "";
    let message2 = message;
    const node = document.createElement("div");
    if (type > 0) {
      if (type === 2) {
        who = "<span class='strangerChat'>Stranger:</span>";
        who2 = "Stranger: ";
      } else {
        who = "<span class='youChat'>You:</span>";
      }
      if (message.startsWith("/me ")) {
        message = message.substring(4);
        if (type === 2) {
          who = "<span class='strangerChat'>*** Stranger</span>";
          who2 = "*** Stranger ";
        } else {
          who = "<span class='youChat'>*** You</span>";
        }
      }
      message = message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const msg = message
        .split(" ")
        .map((part) =>
          url_pattern.test(part) && !part.includes('"')
            ? `<a href="${part.replace(
                /\n/g,
                ""
              )}" target="_blank">${part.replace(/\n/g, "<br>")}</a>`
            : part.replace(/\n/g, "<br>")
        )
        .join(" ");
      node.innerHTML = who + msg;
    } else {
      node.innerHTML = `<span class='consoleChat'>${message}</span>`;
    }
    chatMainDiv.appendChild(node);
    chatMain.scrollTop = chatMain.scrollHeight;
    chatMain.scrollLeft = 0;
    if (isBlurred && (type === 0 || type === 2)) {
      alertSound.play();
      if (
        firstNotify &&
        notify > 0 &&
        window.webkitNotifications.checkPermission() === 0
      ) {
        clearTimeout(notifyTimer);
        if (lastNotify) lastNotify.cancel();
        lastNotify = window.webkitNotifications.createNotification(
          "img/beliTalks_logo32.png",
          "BeliTalks" + (type === 0 ? " Message" : ""),
          who2 + message2
        );
        lastNotify.show();
        firstNotify = false;
        notifyTimer = setTimeout(() => lastNotify.cancel(), 7000);
      }
    }
  };

  const startChat = () => {
    if (window.webkitNotifications && notify === 0) {
      if (window.webkitNotifications.checkPermission() === 0) {
        notify = 2;
      } else {
        window.webkitNotifications.requestPermission();
        notify = 1;
      }
    }
    welcomeScreen.style.display = "none";
    chatWindow.style.display = "block";
    createConnection();
  };
  const newStranger = () => {
    if (socket) {
      chatArea.disabled = true;
      disconnectButton.disabled = true;
      socket.emit("new");
      chatArea.value = "";
      chatArea.focus();
      chatMainDiv.innerHTML = "";
      logChat(0, "Waiting for a stranger...");
      setTyping(false);
      disconnectType = false;
      disconnectButton.value = "Disconnect";
    }
  };
  const doDisconnect = () => {
    if (disconnectType) {
      disconnectType = false;
      disconnectButton.value = "Disconnect";
      newStranger();
    } else if (socket) {
      socket.emit("disconn");
      chatArea.disabled = true;
      chatArea.focus();
      disconnectType = true;
      disconnectButton.disabled = true;
      disconnectButton.value = "Disconnect";
    }
  };
  const onReady = () => {
    startButton.disabled = false;
    startButton.focus();
  };

  setTimeout(onReady, 0);

  const blurred = () => {
    isBlurred = true;
    firstNotify = true;
  };

  const focused = () => {
    isBlurred = false;
    if (lastNotify) lastNotify.cancel();
    if (notifyTimer) clearTimeout(notifyTimer);
  };
  window.addEventListener("blur", blurred, false);
  window.addEventListener("focus", focused, false);
  disconnectButton.addEventListener("click", doDisconnect, false);
  chatArea.addEventListener(
    "keypress",
    (e) => {
      if (e.keyCode === 13 && !e.shiftKey) {
        const msg = chatArea.value;
        if (msg.length > 0) {
          if (typingtimer !== null) {
            clearTimeout(typingtimer);
          }
          if (isTyping) {
            socket.emit("typing", false);
          }
          isTyping = false;
          socket.emit("chat", msg);
          logChat(1, msg);
          chatArea.value = "";
          e.preventDefault();
          return false;
        }
      }
    },
    false
  );
  chatArea.addEventListener(
    "keyup",
    () => {
      if (socket) {
        if (typingtimer !== null) {
          clearTimeout(typingtimer);
        }

        if (chatArea.value === "" && isTyping) {
          socket.emit("typing", false);
          isTyping = false;
        } else if (!isTyping && chatArea.value.length > 0) {
          socket.emit("typing", true);
          isTyping = true;
        }

        typingtimer = setTimeout(() => {
          if (socket && isTyping) {
            socket.emit("typing", false);
          }
          isTyping = false;
        }, 10000);
      }
    },
    false
  );
  return {
    startChat,
    newStranger,
    doDisconnect,
  };

})();
