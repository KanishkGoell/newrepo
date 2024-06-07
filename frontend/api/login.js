const fs = require('fs');
const path = require('path');

export default function handler(req, res) {
  const { username, password } = req.body;
  const usersFilePath = path.join(process.cwd(), 'backend', 'users.json');
  const users = JSON.parse(fs.readFileSync(usersFilePath, 'utf-8'));

  const user = users.find(user => user.username === username && user.password === password);
  if (!user) {
    return res.status(401).send('Invalid credentials.');
  }

  res.status(200).send('Login successful.');
}
