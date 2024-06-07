const fs = require('fs');
const path = require('path');

export default function handler(req, res) {
  const { username, email, password } = req.body;
  const usersFilePath = path.join(process.cwd(), 'backend', 'users.json');
  const users = JSON.parse(fs.readFileSync(usersFilePath, 'utf-8'));

  if (users.some(user => user.username === username || user.email === email)) {
    return res.status(400).send('User already exists.');
  }

  const newUser = { username, email, password };
  users.push(newUser);
  fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));

  const userPrefsDir = path.join(process.cwd(), 'backend', 'user_prefs');
  fs.writeFileSync(path.join(userPrefsDir, `${username}.json`), JSON.stringify({ filters: {}, session: {} }, null, 2));

  res.status(201).send('User registered successfully.');
}
