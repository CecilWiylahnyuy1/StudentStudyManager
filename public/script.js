const API = 'http://localhost:3000';

// ---- NOTIFICATIONS ----
function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function checkTimetableForNotifications() {
  fetch('/timetable').then(res => res.json()).then(entries => {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const currentTime = now.toTimeString().slice(0, 5);

    entries.forEach(entry => {
      if (entry.day === currentDay && entry.startTime === currentTime && !entry._notified) {
        entry._notified = true;
        sendStudyNotification(entry);
      }
    });
  });
}

function sendStudyNotification(entry) {
  if (Notification.permission === 'granted') {
    new Notification('📖 Study Time!', { body: `Time to study ${entry.subject}` });
  }
  setTimeout(() => {
    if (document.hidden && Notification.permission === 'granted') {
      new Notification('😡 STILL NOT STUDYING?!', { body: `You haven't started ${entry.subject} yet. Get to it!` });
    }
  }, 60000);
}

requestNotificationPermission();
setInterval(checkTimetableForNotifications, 30000);

// ---- STREAK DISPLAY ----
async function loadStreak() {
  const display = document.getElementById('streak-display');
  if (!display) return;
  const res = await fetch('/streak');
  if (!res.ok) return;
  const data = await res.json();
  let text = `🔥 Streak: ${data.streak} day${data.streak === 1 ? '' : 's'}`;
  if (data.justUsedFreeze) {
    text += ' — a missed day was covered by your one-time streak freeze!';
  } else if (!data.freezeAvailable) {
    text += ' (no freeze remaining — missing a day will reset your streak)';
  }
  display.textContent = text;
}

// ---- TASKS ----
async function loadTasks() {
  const list = document.getElementById('task-list');
  if (!list) return;
  const res = await fetch('/task');
  const tasks = await res.json();
  list.innerHTML = '';
  tasks.forEach(task => {
    const li = document.createElement('li');
    li.textContent = `${task.title} (${task.subject}) — due ${task.dueDate} ${task.completed ? '✅' : ''} `;
    if (!task.completed) {
      const btn = document.createElement('button');
      btn.textContent = 'Mark Done';
      btn.addEventListener('click', async () => {
        await fetch(`/task/${task.id}/complete`, { method: 'PUT' });
        loadTasks();
        loadStreak();
      });
      li.appendChild(btn);
    }
    list.appendChild(li);
  });
}

const taskForm = document.getElementById('task-form');
if (taskForm) {
  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = document.getElementById('task-title').value;
    const subject = document.getElementById('task-subject').value;
    const dueDate = document.getElementById('task-dueDate').value;
    await fetch('/task', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, subject, dueDate })
    });
    e.target.reset();
    loadTasks();
  });
}

// ---- NOTES ----
const urlParams = new URLSearchParams(window.location.search);
const linkedTimetableId = urlParams.get('timetableId');
const prefillSubject = urlParams.get('subject');

async function loadNotes() {
  const list = document.getElementById('note-list');
  if (!list) return;
  const res = await fetch('/notes');
  const allNotes = await res.json();
  list.innerHTML = '';

  const sessionNotes = allNotes.filter(n => n.linkedTimetableId);
  const generalNotes = allNotes.filter(n => !n.linkedTimetableId);

  if (sessionNotes.length) {
    const heading = document.createElement('h3');
    heading.textContent = '📚 Study Session Notes';
    list.appendChild(heading);
    sessionNotes.forEach(note => list.appendChild(renderNoteItem(note, true)));
  }

  if (generalNotes.length) {
    const heading = document.createElement('h3');
    heading.textContent = '🗒️ General Notes';
    list.appendChild(heading);
    generalNotes.forEach(note => list.appendChild(renderNoteItem(note, false)));
  }
}

function renderNoteItem(note, isSessionNote) {
  const li = document.createElement('li');
  li.textContent = `[${note.subject}] ${note.content} `;

  if (isSessionNote) {
    const quizBtn = document.createElement('button');
    quizBtn.textContent = 'Generate Quiz';
    quizBtn.addEventListener('click', async () => {
      const res = await fetch(`/notes/${note.id}/generate-quiz`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to generate quiz');
        return;
      }
      renderQuiz(note.id, data.questions, li);
    });
    li.appendChild(quizBtn);
  }

  return li;
}

// This function was missing — it builds the quiz UI under a note
function renderQuiz(noteId, questions, container) {
  const existing = container.querySelector('.quiz-box');
  if (existing) existing.remove();

  const quizBox = document.createElement('div');
  quizBox.className = 'quiz-box';

  const inputs = [];
  questions.forEach((q) => {
    const p = document.createElement('p');
    p.textContent = q.question;
    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Your answer';
    inputs.push(input);
    quizBox.appendChild(p);
    quizBox.appendChild(input);
  });

  const submitBtn = document.createElement('button');
  submitBtn.textContent = 'Submit Answers';
  const resultP = document.createElement('p');

  submitBtn.addEventListener('click', async () => {
    const answers = inputs.map(input => input.value);
    const res = await fetch(`/notes/${noteId}/submit-quiz`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers })
    });
    const data = await res.json();

    if (data.passed) {
      document.getElementById('modal-streak-count').textContent = data.streak;
      document.getElementById('streak-modal').style.display = 'flex';
      loadStreak();
    } else {
      resultP.textContent = `❌ ${data.message}`;
    }
  });

  quizBox.appendChild(submitBtn);
  quizBox.appendChild(resultP);
  container.appendChild(quizBox);
}

const noteForm = document.getElementById('note-form');
if (noteForm) {
  if (prefillSubject) {
    document.getElementById('note-subject').value = prefillSubject;
  }
  noteForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const subject = document.getElementById('note-subject').value;
    const content = document.getElementById('note-content').value;
    await fetch('/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, content, linkedTimetableId })
    });
    e.target.reset();
    loadNotes();
  });
}

// ---- TIMETABLE ----
async function loadTimetable() {
  const list = document.getElementById('timetable-list');
  if (!list) return;
  const res = await fetch('/timetable');
  const entries = await res.json();
  list.innerHTML = '';
  entries.forEach(entry => {
    const li = document.createElement('li');
    li.textContent = `${entry.day}: ${entry.startTime}–${entry.endTime} (${entry.subject}) `;
    const noteBtn = document.createElement('button');
    noteBtn.textContent = 'Write notes for this session';
    noteBtn.addEventListener('click', () => {
      window.location.href = `/notes.html?timetableId=${entry.id}&subject=${encodeURIComponent(entry.subject)}`;
    });
    li.appendChild(noteBtn);
    list.appendChild(li);
  });
}

const timetableForm = document.getElementById('timetable-form');
if (timetableForm) {
  timetableForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const day = document.getElementById('tt-day').value;
    const startTime = document.getElementById('tt-start').value;
    const endTime = document.getElementById('tt-end').value;
    const subject = document.getElementById('tt-subject').value;
    await fetch('/timetable', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ day, startTime, endTime, subject })
    });
    e.target.reset();
    loadTimetable();
  });
}

// ---- LOGIN ----
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      window.location.href = '/index.html';
    } else {
      document.getElementById('login-error').textContent = data.message;
    }
  });
}

// ---- SIGNUP ----
const signupForm = document.getElementById('signup-form');
if (signupForm) {
  signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('signup-username').value;
    const password = document.getElementById('signup-password').value;
    const res = await fetch('/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (res.ok) {
      window.location.href = '/login.html';
    } else {
      document.getElementById('signup-error').textContent = data.message;
    }
  });
}

// ---- STREAK MODAL ----
const continueBtn = document.getElementById('modal-continue-btn');
if (continueBtn) {
  continueBtn.addEventListener('click', () => {
    document.getElementById('streak-modal').style.display = 'none';
  });
}

// ---- INITIAL LOAD ----
loadTasks();
loadNotes();
loadTimetable();
loadStreak();