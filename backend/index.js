import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json());

app.get('/', (req, res) => {
    res.send('Server is running');
});

app.get('/getTable', (req, res) => {
    const jsonFilePath = path.join(__dirname, 'data.json');
    fs.readFile(jsonFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error("Error reading JSON file:", err);
            res.status(500).send("Internal Server Error");
            return;
        }
        res.send(JSON.parse(data));
    });
});

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
