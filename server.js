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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});