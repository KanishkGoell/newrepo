import fs from 'fs';
import path from 'path';

export default (req, res) => {
  const jsonFilePath = path.join(process.cwd(), 'backend/data.json');
  fs.readFile(jsonFilePath, 'utf8', (err, data) => {
    if (err) {
      console.error("Error reading JSON file:", err);
      res.status(500).send("Internal Server Error");
      return;
    }
    res.json(JSON.parse(data));
  });
};
