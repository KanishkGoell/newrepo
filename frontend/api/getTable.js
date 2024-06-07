const fs = require('fs');
const path = require('path');

export default function handler(req, res) {
  const jsonFilePath = path.join(process.cwd(), 'backend', 'data.json');
  fs.readFile(jsonFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error("Error reading JSON file:", err);
      res.status(500).send("Internal Server Error");
      return;
    }
    res.status(200).json(JSON.parse(data));
  });
}
