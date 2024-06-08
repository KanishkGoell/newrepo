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

// File paths
const usersFilePath = path.join(__dirname, 'users.json');
const userPrefsDir = path.join(__dirname, 'user_prefs');

// Ensure the user preferences directory exists
if (!fs.existsSync(userPrefsDir)) {
    fs.mkdirSync(userPrefsDir);
    console.log('Created user_prefs directory');
}

// Load users from file
const loadUsers = () => {
    try {
        if (fs.existsSync(usersFilePath)) {
            const users = JSON.parse(fs.readFileSync(usersFilePath, 'utf-8'));
            console.log('Loaded users:', users);
            return users;
        }
    } catch (error) {
        console.error("Error loading users:", error);
        return [];
    }
    return [];
};

// Save users to file
const saveUsers = (users) => {
    try {
        fs.writeFileSync(usersFilePath, JSON.stringify(users, null, 2));
        console.log('Saved users:', users);
    } catch (error) {
        console.error("Error saving users:", error);
    }
};

// Register a new user
app.post('/register', (req, res) => {
    const { username, email, password } = req.body;
    const users = loadUsers();

    if (users.some(user => user.username === username || user.email === email)) {
        return res.status(400).send('User already exists.');
    }

    const newUser = { username, email, password };
    users.push(newUser);
    saveUsers(users);

    // Create a preference file for the new user
    try {
        fs.writeFileSync(path.join(userPrefsDir, `${username}.json`), JSON.stringify({ filters: {}, session: {} }, null, 2));
        console.log(`Created preference file for user: ${username}`);
    } catch (error) {
        console.error("Error creating preference file:", error);
    }

    res.status(201).send('User registered successfully.');
});

// Login a user
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = loadUsers();

    const user = users.find(user => user.username === username && user.password === password);
    if (!user) {
        return res.status(401).send('Invalid credentials.');
    }

    res.status(200).send('Login successful.');
});

// Save user preferences
app.post('/savePreferences', (req, res) => {
    const { username, filters, session } = req.body;

    const prefsFilePath = path.join(userPrefsDir, `${username}.json`);
    if (!fs.existsSync(prefsFilePath)) {
        return res.status(404).send('User not found.');
    }

    const prefs = { filters, session };
    try {
        fs.writeFileSync(prefsFilePath, JSON.stringify(prefs, null, 2));
        console.log(`Saved preferences for user: ${username}`);
    } catch (error) {
        console.error("Error saving preferences:", error);
    }

    res.status(200).send('Preferences saved successfully.');
});

// Retrieve user preferences
app.post('/getPreferences', (req, res) => {
    const { username } = req.body;

    const prefsFilePath = path.join(userPrefsDir, `${username}.json`);
    if (!fs.existsSync(prefsFilePath)) {
        return res.status(404).send('User not found.');
    }

    try {
        const prefs = JSON.parse(fs.readFileSync(prefsFilePath, 'utf-8'));
        console.log(`Retrieved preferences for user: ${username}`);
        res.status(200).json(prefs);
    } catch (error) {
        console.error("Error retrieving preferences:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Endpoint to serve the JSON file
app.get("/getTable", (req, res) => {
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

// Serve the static files from the React app
app.use(express.static(path.join(__dirname, 'build')));
app.get('/', (req, res) => {
    res.send('Server is running');
});

app.listen(PORT, () => console.log('Server is running on port ' + PORT));
