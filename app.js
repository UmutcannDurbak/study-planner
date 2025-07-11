import { loadSessions, saveSessions } from './utils/storage.js';

document.addEventListener('DOMContentLoaded', () => {
  // Theme Toggle
  const themeToggle = document.getElementById("theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark-mode");
      localStorage.setItem("theme", document.body.classList.contains("dark-mode") ? "dark" : "light");
    });
  }

  // Load saved theme on page load
  if (localStorage.getItem("theme") === "dark") {
    document.body.classList.add("dark-mode");
  }

  // Session Management
  const sessionForm = document.getElementById("new-session");
  const sessionList = document.getElementById("session-list");
  const feedback = document.getElementById("feedback");

  let sessions = loadSessions();
  let totalPlannedTime = 0;
  let totalFocusedTime = parseInt(localStorage.getItem("focusedTime")) || 0;

  function showFeedback(msg, isError = false) {
    if (!feedback) return;
    feedback.textContent = msg;
    feedback.className = isError ? 'feedback error' : 'feedback';
    feedback.style.display = 'block';
    setTimeout(() => { feedback.style.display = 'none'; }, 2000);
  }

  function renderSessions() {
    if (!sessionList) return;
    sessionList.innerHTML = "";
    totalPlannedTime = 0;

    if (sessions.length === 0) {
      const li = document.createElement("li");
      li.textContent = "No sessions added yet.";
      li.style.fontStyle = "italic";
      sessionList.appendChild(li);
      updateStats();
      return;
    }

    sessions.forEach((session, index) => {
      totalPlannedTime += session.duration;
      const li = document.createElement("li");
      li.className = "session-item";
      li.innerHTML = `
        <div class="session-info">
          <strong>${session.title}</strong> - ${session.duration} min [${session.tag}]
        </div>
        <button class="delete-btn" data-index="${index}" title="Remove session" aria-label="Remove session">
          <span class="remove-icon">❌</span>
        </button>
      `;
      sessionList.appendChild(li);
    });
    updateStats();
  }

  function updateStats() {
    const productivity = totalPlannedTime
      ? Math.round((totalFocusedTime / totalPlannedTime) * 100)
      : 0;
    const totalFocusElem = document.getElementById("total-focus");
    const productivityElem = document.getElementById("productivity");
    if (totalFocusElem) totalFocusElem.textContent = `Total Focus Time: ${totalFocusedTime} min`;
    if (productivityElem) productivityElem.textContent = `Productivity: ${productivity}%`;
  }

  function deleteSession(index) {
    sessions.splice(index, 1);
    saveSessions(sessions);
    renderSessions();
    showFeedback('Session deleted.');
  }

  if (sessionList) {
    sessionList.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-btn')) {
        const idx = parseInt(e.target.getAttribute('data-index'));
        deleteSession(idx);
      }
    });
  }

  if (sessionForm) {
    sessionForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const titleInput = document.getElementById("title");
      const tagInput = document.getElementById("tag");
      const durationInput = document.getElementById("duration");
      if (!titleInput || !tagInput || !durationInput) {
        showFeedback('Session form inputs not found!', true);
        return;
      }
      const title = titleInput.value.trim();
      const tag = tagInput.value.trim();
      const duration = parseInt(durationInput.value);
      if (!title || !tag || isNaN(duration) || duration < 5) {
        showFeedback('Please fill all fields correctly (min 5 min).', true);
        return;
      }
      sessions.push({ title, tag, duration });
      saveSessions(sessions);
      renderSessions();
      showFeedback('Session added!');
      sessionForm.reset();
    });
  }

  renderSessions();

  // Timer
  const timerDisplay = document.getElementById("timer-display");
  const startBtn = document.getElementById("start-timer");
  const resetBtn = document.getElementById("reset-timer");

  let timerDuration = 25 * 60;
  let remaining = timerDuration;
  let interval = null;

  function updateTimerDisplay() {
    if (!timerDisplay) return;
    const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
    const seconds = String(remaining % 60).padStart(2, "0");
    timerDisplay.textContent = `${minutes}:${seconds}`;
  }

  function setTimerButtons(running) {
    if (startBtn) startBtn.disabled = running;
    if (resetBtn) resetBtn.disabled = !running && remaining === timerDuration;
  }

  function startTimer() {
    if (interval) return;
    setTimerButtons(true);
    interval = setInterval(() => {
      remaining--;
      updateTimerDisplay();
      if (remaining <= 0) {
        clearInterval(interval);
        interval = null;
        setTimerButtons(false);
        totalFocusedTime += Math.round(timerDuration / 60);
        localStorage.setItem("focusedTime", totalFocusedTime);
        updateStats();
        showFeedback("Time's up! Great work 🎉");
        remaining = timerDuration;
        updateTimerDisplay();
      }
    }, 1000);
    updateStats(); // update stats immediately when timer starts
  }

  function resetTimer() {
    clearInterval(interval);
    interval = null;
    remaining = timerDuration;
    updateTimerDisplay();
    setTimerButtons(false);
    updateStats(); // update stats immediately when timer resets
  }

  if (startBtn) startBtn.addEventListener("click", startTimer);
  if (resetBtn) resetBtn.addEventListener("click", resetTimer);
  updateTimerDisplay();
  setTimerButtons(false);
});
