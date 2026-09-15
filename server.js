require('dotenv').config();
ANTHROPIC_API_KEY=claude
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
let users = []; // { id, username, passwordHash, streak, lastCompletedDate }

function checkStreakStatus(user) {
  if (!user.lastCompletedDate) return; // never completed anything yet

  const today = new Date();
  const last = new Date(user.lastCompletedDate);
  const diffDays = Math.floor((today - last) / (1000 * 60 * 60 * 24));

  if (diffDays === 0 || diffDays === 1) {
    // same day or consecutive day — streak is fine, no action needed
    return;
  }

  if (diffDays === 2 && user.freezeAvailable) {
    // exactly one full day missed — offer the freeze
    user.freezeAvailable = false;
    user.streakFrozenUntil = user.lastCompletedDate; // marker that a freeze was just used
    return;
  }

  // more than one day missed, or freeze already used — reset
  user.streak = 0;
}
app.use(express.static('backend'));

app.get('/', (req, res) => {
  res.redirect('/landing.html');
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
  
app.get('/streak', requireLogin, (req, res) => {
  const user = users.find(u => u.id === req.session.userId);
  checkStreakStatus(user);
  res.json({ 
    streak: user.streak,
    freezeAvailable: user.freezeAvailable,
    justUsedFreeze: !!user.streakFrozenUntil
   });
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

app.put('/tasks/:id/complete', requireLogin, (req, res) => {
  const task = tasks.find(t => t.id === parseInt(req.params.id));
  if (!task) return res.status(404).json({ message: "Task not found" });

  task.completed = true;

  const user = users.find(u => u.id === req.session.userId);
  const today = new Date().toISOString().split('T')[0]; // e.g. "2026-09-05"

  if (user.lastCompletedDate !== today) {
    user.streak += 1;
    user.lastCompletedDate = today;
  }

  res.json({ task, streak: user.streak });
});

// DELETE a task
app.delete('/tasks/:id', (req, res) => {
  tasks = tasks.filter(t => t.id !== parseInt(req.params.id));
  res.status(204).send();
});

// Temporary in-memory storage for notes
let notes = [
  { id: 1, subject: "Math", content: "Chapter 4 covers derivatives and their applications.", linkedTaskId: 1,  linkedTimetableId: null }
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
app.post('/notes', requireLogin, (req, res) => {
  const newNote = {
    id: notes.length + 1,
    subject: req.body.subject,
    content: req.body.content,
    linkedTaskId: req.body.linkedTaskId || null,
    linkedTimetableId: req.body.linkedTimetableId || null
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

const Anthropic = require('@anthropic-ai/sdk');
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.post('/notes/:id/generate-quiz', requireLogin, async (req, res) => {
  const note = notes.find(n => n.id === parseInt(req.params.id));
  if (!note) return res.status(404).json({ message: "Note not found" });

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 500,
      messages: [{
        role: "user",
        content: `Based on this study note, create 3 short quiz questions with answers to test understanding. Respond ONLY in this exact JSON format, no other text: [{"question": "...", "answer": "..."}]\n\nNote:\n${note.content}`
      }]
    });

    const text = response.content[0].text;
    const questions = JSON.parse(text);
    note.quiz = questions; // store questions on the note
    res.json({ questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to generate quiz" });
  }
});

// Sign up
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  const existing = users.find(u => u.username === username);
  if (existing) return res.status(400).json({ message: "Username already taken" });

  const passwordHash = await bcrypt.hash(password, 10);
  const newUser = { id: users.length + 1, username, passwordHash, streak: 0, lastCompletedDate: null, freezeAvailable: true  };
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

app.post('/notes/:id/submit-quiz', requireLogin, (req, res) => {
  const note = notes.find(n => n.id === parseInt(req.params.id));
  if (!note) return res.status(404).json({ message: "Note not found" });
  if (!note.quiz) return res.status(400).json({ message: "No quiz generated for this note yet" });

  const userAnswers = req.body.answers || [];

  const allCorrect = note.quiz.every((q, i) => {
    const userAnswer = (userAnswers[i] || '').trim().toLowerCase();
    const correctAnswer = q.answer.trim().toLowerCase();
    return userAnswer === correctAnswer || correctAnswer.includes(userAnswer) || userAnswer.includes(correctAnswer);
  });

  if (!allCorrect) {
    return res.json({ passed: false, message: "Not all answers were correct. Try again!" });
  }

  const user = users.find(u => u.id === req.session.userId);
  const today = new Date().toISOString().split('T')[0];

  let streakIncreased = false;
  if (user.lastCompletedDate !== today) {
    user.streak += 1;
    user.lastCompletedDate = today;
    streakIncreased = true;
  }

  res.json({ passed: true, streak: user.streak, streakIncreased });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});