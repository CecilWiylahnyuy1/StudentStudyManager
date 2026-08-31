const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json()); // lets the server read JSON from requests
app.use(express.static('public'));

const session = require('express-session');
const bcrypt = require('bcrypt');

app.use(session({
  secret: 'study-manager-secret', // just a random string for now
  resave: false,
  saveUninitialized: false
}));

function requireLogin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ message: "You must be logged in" });
  }
  next();
}
app.get('/tasks', requireLogin, (req, res) => {
  res.json(tasks);
});

app.post('/tasks', requireLogin, (req, res) => {
  // ...same code as before
});
let users = []; // { id, username, passwordHash }

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send('Student Study Manager API is running!');
});

// Temporary in-memory storage for tasks
let tasks = [
  { id: 1, title: "Finish math homework", subject: "Math", dueDate: "2026-09-05", completed: false }
];

// GET all tasks
app.get('/tasks', (req, res) => {
  res.json(tasks);
});

// GET a single task by id
app.get('/tasks/:id', (req, res) => {
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  if (!task) return res.status(404).json({ message: "Task not found" });
  res.json(task);
});

// POST a new task
app.post('/tasks', (req, res) => {
  const newTask = {
    id: tasks.length + 1,
    title: req.body.title,
    subject: req.body.subject,
    dueDate: req.body.dueDate,
    completed: false
  };
  tasks.push(newTask);
  res.status(201).json(newTask);
});

// PUT (update) a task
app.put('/tasks/:id', (req, res) => {
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  if (!task) return res.status(404).json({ message: "Task not found" });
  Object.assign(task, req.body);
  res.json(task);
});

// DELETE a task
app.delete('/tasks/:id', (req, res) => {
  tasks = tasks.filter(t => t.id !== parseInt(req.params.id));
  res.status(204).send();
});

// Temporary in-memory storage for notes
let notes = [
  { id: 1, subject: "Math", content: "Chapter 4 covers derivatives and their applications.", linkedTaskId: 1 }
];

// GET all notes
app.get('/notes', (req, res) => {
  res.json(notes);
});

// GET a single note by id
app.get('/notes/:id', (req, res) => {
  const note = notes.find(n => n.id === parseInt(req.params.id));
  if (!note) return res.status(404).json({ message: "Note not found" });
  res.json(note);
});

// POST a new note
app.post('/notes', (req, res) => {
  const newNote = {
    id: notes.length + 1,
    subject: req.body.subject,
    content: req.body.content,
    linkedTaskId: req.body.linkedTaskId || null
  };
  notes.push(newNote);
  res.status(201).json(newNote);
});

// PUT (update) a note
app.put('/notes/:id', (req, res) => {
  const note = notes.find(n => n.id === parseInt(req.params.id));
  if (!note) return res.status(404).json({ message: "Note not found" });
  Object.assign(note, req.body);
  res.json(note);
});

// DELETE a note
app.delete('/notes/:id', (req, res) => {
  notes = notes.filter(n => n.id !== parseInt(req.params.id));
  res.status(204).send();
});

// Temporary in-memory storage for timetable entries
let timetable = [
  { id: 1, day: "Monday", startTime: "16:00", endTime: "17:30", subject: "Math" }
];

// GET all timetable entries
app.get('/timetable', (req, res) => {
  res.json(timetable);
});

// GET a single timetable entry by id
app.get('/timetable/:id', (req, res) => {
  const entry = timetable.find(t => t.id === parseInt(req.params.id));
  if (!entry) return res.status(404).json({ message: "Timetable entry not found" });
  res.json(entry);
});

// POST a new timetable entry
app.post('/timetable', (req, res) => {
  const newEntry = {
    id: timetable.length + 1,
    day: req.body.day,
    startTime: req.body.startTime,
    endTime: req.body.endTime,
    subject: req.body.subject
  };
  timetable.push(newEntry);
  res.status(201).json(newEntry);
});

// PUT (update) a timetable entry
app.put('/timetable/:id', (req, res) => {
  const entry = timetable.find(t => t.id === parseInt(req.params.id));
  if (!entry) return res.status(404).json({ message: "Timetable entry not found" });
  Object.assign(entry, req.body);
  res.json(entry);
});

// DELETE a timetable entry
app.delete('/timetable/:id', (req, res) => {
  timetable = timetable.filter(t => t.id !== parseInt(req.params.id));
  res.status(204).send();
});

// Sign up
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const existing = users.find(u => u.username === username);
  if (existing) return res.status(400).json({ message: "Username already taken" });

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = { id: users.length + 1, username, passwordHash };
  users.push(newUser);
  res.status(201).json({ message: "Account created" });
});

// Log in
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) return res.status(401).json({ message: "Invalid username or password" });

  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ message: "Invalid username or password" });

  req.session.userId = user.id;
  res.json({ message: "Logged in", username: user.username });
});

// Log out
app.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: "Logged out" }));
});

// Check who's logged in
app.get('/me', (req, res) => {
  if (!req.session.userId) return res.status(401).json({ message: "Not logged in" });
  const user = users.find(u => u.id === req.session.userId);
  res.json({ username: user.username });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});