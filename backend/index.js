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


// Path to the single user preferences file
const userPrefsFilePath = path.join(__dirname, 'user_prefs.json');

// Ensure the user preferences file exists
if (!fs.existsSync(userPrefsFilePath)) {
    fs.writeFileSync(userPrefsFilePath, JSON.stringify({}));
    console.log('Created user_prefs.json file');
}


// Load user preferences
const loadUserPrefs = () => {
    try {
        if (fs.existsSync(userPrefsFilePath)) {
            const prefs = JSON.parse(fs.readFileSync(userPrefsFilePath, 'utf-8'));
            console.log('Loaded user preferences:', prefs);
            return prefs;
        }
    } catch (error) {
        console.error("Error loading user preferences:", error);
    }
    return {};
};

// Save user preferences
const saveUserPrefs = (prefs) => {
    try {
        fs.writeFileSync(userPrefsFilePath, JSON.stringify(prefs, null, 2));
        console.log('Saved user preferences:', prefs);
    } catch (error) {
        console.error("Error saving user preferences:", error);
    }
};

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

    // Check if the user already exists based on username or email
    if (users.some(user => user.username === username || user.email === email)) {
        return res.status(400).send('User already exists.');
    }

    // Create a new user object
    const newUser = { username, email, password };
    users.push(newUser);
    saveUsers(users);

    // Load existing user preferences
    const prefs = loadUserPrefs();

    // Initialize preferences for the new user
    prefs[username] = { filters: {}, session: {} };

    // Save updated preferences
    saveUserPrefs(prefs);

    console.log(`Initialized preference data for user: ${username}`);
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

    // Load all preferences
    const allPrefs = loadUserPrefs();
    allPrefs[username] = { filters, session }; // Update preferences for the user

    // Save updated preferences
    saveUserPrefs(allPrefs);

    res.status(200).send('Preferences saved successfully.');
});


// Retrieve user preferences
app.post('/getPreferences', (req, res) => {
    const { username } = req.body;

    // Load all preferences
    const allPrefs = loadUserPrefs();

    // Check if the user's preferences exist
    if (!allPrefs[username]) {
        return res.status(404).send('User not found.');
    }

    console.log(`Retrieved preferences for user: ${username}`);
    res.status(200).json(allPrefs[username]);
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
