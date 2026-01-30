const micBtn = document.getElementById("micBtn");
const timerDisplay = document.getElementById("timer");
const resultSection = document.getElementById("resultSection");
const audioPlayback = document.getElementById("audioPlayback");
const emotionResult = document.getElementById("emotionResult");

// Speech Recognition (unchanged server flow)
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();
recognition.continuous = false;
recognition.lang = "en-US";

// Audio Recording Setup
let mediaRecorder;
let audioChunks = [];
let isRecording = false;
let timerInterval;
let seconds = 0;

micBtn.addEventListener("click", async () => {
  if (!isRecording) {
    startRecording();
  } else {
    stopRecording();
  }
});

async function startRecording() {
  isRecording = true;
  micBtn.classList.add("recording");
  recognition.start();

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorder = new MediaRecorder(stream);

  mediaRecorder.ondataavailable = event => {
    audioChunks.push(event.data);
  };

  mediaRecorder.onstop = () => {
    const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
    audioChunks = [];
    audioPlayback.src = URL.createObjectURL(audioBlob);
  };

  mediaRecorder.start();
  startTimer();
}

function stopRecording() {
  isRecording = false;
  micBtn.classList.remove("recording");

  recognition.stop();
  mediaRecorder.stop();
  stopTimer();

  resultSection.classList.remove("hidden");
  emotionResult.textContent = "Analyzing your emotions...";
}

function startTimer() {
  seconds = 0;
  timerDisplay.textContent = "00:00";
  timerInterval = setInterval(() => {
    seconds++;
    const mins = String(Math.floor(seconds / 60)).padStart(2, '0');
    const secs = String(seconds % 60).padStart(2, '0');
    timerDisplay.textContent = `${mins}:${secs}`;
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
}

// Speech → Text Result
recognition.onresult = async function(event) {
  const text = event.results[0][0].transcript;

  // Show loading message
  document.getElementById("emotionResult").textContent = "Thinking...";

  // Send text to backend AI
  const aiReply = await sendMessageToAI(text);

  // Show AI reply on webpage
  document.getElementById("emotionResult").textContent = aiReply;
};


recognition.onerror = function() {
  emotionResult.textContent = "Sorry, I couldn't hear you clearly.";
};

// Server Call (UNCHANGED)
async function respondToEmotion(text) {
  try {
    const response = await fetch("http://127.0.0.1:5000/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: text })
    });

    const data = await response.json();
    emotionResult.textContent = data.reply;

  } catch (error) {
    console.error("Error:", error);
    emotionResult.textContent = "Server error. Please try again.";
  }
}
async function sendMessageToAI(userText) {
  try {
    const response = await fetch("http://127.0.0.1:5000/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ text: userText })
    });

    const data = await response.json();
    return data.reply;  // this comes from your Python backend

  } catch (error) {
    console.error("Error connecting to backend:", error);
    return "Server connection failed.";
  }
}
