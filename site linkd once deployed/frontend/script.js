const API = 'http://localhost:3000';

// ---- TASKS ----
async function loadTasks() {
  const res = await fetch(`${API}/tasks`);
  const tasks = await res.json();
  const list = document.getElementById('task-list');
  list.innerHTML = '';
  tasks.forEach(task => {
    const li = document.createElement('li');
    li.textContent = `${task.title} (${task.subject}) — due ${task.dueDate} ${task.completed ? '✅' : ''}`;
    list.appendChild(li);
  });
}

document.getElementById('task-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const title = document.getElementById('task-title').value;
  const subject = document.getElementById('task-subject').value;
  const dueDate = document.getElementById('task-dueDate').value;
  await fetch(`${API}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, subject, dueDate })
  });
  e.target.reset();
  loadTasks();
});

// ---- NOTES ----
async function loadNotes() {
  const res = await fetch(`${API}/notes`);
  const notes = await res.json();
  const list = document.getElementById('note-list');
  list.innerHTML = '';
  notes.forEach(note => {
    const li = document.createElement('li');
    li.textContent = `[${note.subject}] ${note.content}`;
    list.appendChild(li);
  });
}

document.getElementById('note-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const subject = document.getElementById('note-subject').value;
  const content = document.getElementById('note-content').value;
  await fetch(`${API}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subject, content })
  });
  e.target.reset();
  loadNotes();
});

// ---- TIMETABLE ----
async function loadTimetable() {
  const res = await fetch(`${API}/timetable`);
  const entries = await res.json();
  const list = document.getElementById('timetable-list');
  list.innerHTML = '';
  entries.forEach(entry => {
    const li = document.createElement('li');
    li.textContent = `${entry.day}: ${entry.startTime}–${entry.endTime} (${entry.subject})`;
    list.appendChild(li);
  });
}

document.getElementById('timetable-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const day = document.getElementById('tt-day').value;
  const startTime = document.getElementById('tt-start').value;
  const endTime = document.getElementById('tt-end').value;
  const subject = document.getElementById('tt-subject').value;
  await fetch(`${API}/timetable`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ day, startTime, endTime, subject })
  });
  e.target.reset();
  loadTimetable();
});

// ---- INITIAL LOAD ----
loadTasks();
loadNotes();
loadTimetable();