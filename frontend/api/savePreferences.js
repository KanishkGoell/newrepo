const fs = require('fs');
const path = require('path');

export default function handler(req, res) {
  const { username, filters, session } = req.body;
  const prefsFilePath = path.join(process.cwd(), 'backend', 'user_prefs', `${username}.json`);

  if (!fs.existsSync(prefsFilePath)) {
    return res.status(404).send('User not found.');
  }

  const prefs = { filters, session };
  fs.writeFileSync(prefsFilePath, JSON.stringify(prefs, null, 2));

  res.status(200).send('Preferences saved successfully.');
}
