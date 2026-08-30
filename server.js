const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json()); // lets the server read JSON from requests

app.get('/', (req, res) => {
  res.send('Student Study Manager API is running!');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});