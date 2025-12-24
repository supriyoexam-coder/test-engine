let questions = [];
let currentIndex = 0;
let answers = {};
let testName = "";

let totalTime = 600;
let remainingTime = totalTime;
let timerInterval = null;

let isPaused = false;
let isReviewMode = false;
let isSubmitted = false;

/* ================= LOAD TEST ================= */
async function loadTest() {
  const params = new URLSearchParams(window.location.search);
  testName = params.get("test");

  if (!testName) {
    alert("Test name missing");
    return;
  }

  try {
    const res = await fetch(`tests/${testName}.json`);
    if (!res.ok) throw new Error("Test file not found");

    const data = await res.json();

    if (Array.isArray(data)) {
      questions = data;
      totalTime = 600;
    } else {
      questions = data.questions;
      totalTime = data.durationMinutes * 60;
    }

    remainingTime = totalTime;

    document.getElementById("testTitle").innerText = testName.toUpperCase();
    document.getElementById("questionCount").innerText = questions.length + " Questions";

    bindButtons();
    renderQuestion();
    startTimer();
  } catch (e) {
    alert(e.message);
  }
}

/* ================= TIMER ================= */
function startTimer() {
  updateTimer();
  timerInterval = setInterval(() => {
    if (!isPaused && !isSubmitted) {
      remainingTime--;
      if (remainingTime <= 0) {
        remainingTime = 0;
        updateTimer();
        submitTest();
      }
      updateTimer();
    }
  }, 1000);
}

function updateTimer() {
  const m = Math.floor(remainingTime / 60);
  const s = remainingTime % 60;
  document.getElementById("timer").innerText =
    String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
}

/* ================= PAUSE ================= */
function pauseTest() {
  isPaused = true;
  document.getElementById("pauseOverlay").style.display = "block";
  document.querySelector(".fixed-footer").style.pointerEvents = "none";
}

function resumeTest() {
  isPaused = false;
  document.getElementById("pauseOverlay").style.display = "none";
  document.querySelector(".fixed-footer").style.pointerEvents = "auto";
}

/* ================= SUBMIT ================= */
function openSubmitConfirm() {
  if (isSubmitted) return;
  isPaused = true;
  document.getElementById("submitConfirmOverlay").style.display = "block";
}

function cancelSubmit() {
  isPaused = false;
  document.getElementById("submitConfirmOverlay").style.display = "none";
}

function confirmSubmit() {
  document.getElementById("submitConfirmOverlay").style.display = "none";
  submitTest();
}

function submitTest() {
  if (isSubmitted) return;
  isSubmitted = true;
  clearInterval(timerInterval);

  let attempted = 0;
  let correct = 0;

  questions.forEach((q, i) => {
    if (answers[i] !== undefined) {
      attempted++;
      if (answers[i] === q.correctIndex) correct++;
    }
  });

  const accuracy = attempted ? ((correct / attempted) * 100).toFixed(2) : 0;
  showResult(questions.length, attempted, correct, accuracy);
}

/* ================= UI ================= */
function bindButtons() {
  document.getElementById("prevBtn").onclick = prevQuestion;
  document.getElementById("nextBtn").onclick = nextQuestion;
  document.getElementById("clearBtn").onclick = clearResponse;
  document.getElementById("submitBtn").onclick = openSubmitConfirm;
  document.getElementById("homeBtn").onclick = goHome;
}

function renderQuestion() {
  const q = questions[currentIndex];
  document.getElementById("questionNumber").innerText = "Q" + (currentIndex + 1) + ".";
  document.getElementById("questionText").innerText = q.question;

  const box = document.getElementById("optionsBox");
  box.innerHTML = "";

  q.options.forEach((opt, i) => {
    const d = document.createElement("div");
    d.className = "option";
    d.innerText = opt;

    if (isReviewMode) {
      if (i === q.correctIndex) d.classList.add("correct");
      if (answers[currentIndex] === i && i !== q.correctIndex) d.classList.add("wrong");
    } else {
      if (answers[currentIndex] === i) d.classList.add("selected");
      d.onclick = () => {
        answers[currentIndex] = i;
        renderQuestion();
      };
    }
    box.appendChild(d);
  });

  document.getElementById("prevBtn").disabled = currentIndex === 0;
  document.getElementById("nextBtn").disabled = currentIndex === questions.length - 1;
}

function clearResponse() {
  if (isReviewMode || isSubmitted) return;
  delete answers[currentIndex];
  renderQuestion();
}

function nextQuestion() {
  if (currentIndex < questions.length - 1) {
    currentIndex++;
    renderQuestion();
  }
}

function prevQuestion() {
  if (currentIndex > 0) {
    currentIndex--;
    renderQuestion();
  }
}

/* ================= RESULT ================= */
function showResult(total, attempted, correct, accuracy) {
  document.querySelector(".test-container").style.display = "none";
  document.querySelector(".test-header").style.display = "none";
  document.getElementById("resultContainer").style.display = "block";

  document.getElementById("resTotal").innerText = total;
  document.getElementById("resAttempted").innerText = attempted;
  document.getElementById("resCorrect").innerText = correct;
  document.getElementById("resAccuracy").innerText = accuracy;
}

/* ================= REVIEW ================= */
function reviewAnswers() {
  isReviewMode = true;
  currentIndex = 0;
  document.body.classList.add("review-mode");

  document.getElementById("resultContainer").style.display = "none";
  document.querySelector(".test-container").style.display = "block";
  document.querySelector(".test-header").style.display = "flex";
  document.getElementById("testMeta").style.display = "none";

  document.getElementById("submitBtn").style.display = "none";
  document.getElementById("clearBtn").style.display = "none";
  document.getElementById("homeBtn").style.display = "inline-flex";

  renderQuestion();
}

/* ================= HELPERS ================= */
function restartTest() {
  window.location.reload();
}

function goHome() {
  window.location.href = "index.html";
}

/* INIT */
loadTest();
