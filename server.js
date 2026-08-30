const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json()); // lets the server read JSON from requests

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



app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});