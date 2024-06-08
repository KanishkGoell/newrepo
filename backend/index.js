import express from 'express';
import cors from 'cors';
import axios from 'axios';
import bodyParser from 'body-parser';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

const corsOptions = {
    origin: 'https://aggrid-frontend-git-main-kanishk-goels-projects.vercel.app/', // replace with your frontend origin
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(bodyParser.json());

// jsonbin.io API details
const jsonbinAPIKey = process.env.JSONBIN_API_KEY;
const usersBinId = process.env.USERS_BIN_ID;
const userPrefsBinId = process.env.USER_PREFS_BIN_ID;

// Helper function to make requests to jsonbin.io
const jsonbinRequest = async (method, binId, data = null) => {
    const url = `https://api.jsonbin.io/v3/b/${binId}`;
    const headers = {
        'X-Master-Key': jsonbinAPIKey,
        'Content-Type': 'application/json'
    };

    try {
        const response = await axios({
            method,
            url,
            headers,
            data
        });
        return response.data;
    } catch (error) {
        console.error(`Error making request to jsonbin.io: ${error}`);
        throw error;
    }
};

// Load users from jsonbin.io
const loadUsers = async () => {
    try {
        const data = await jsonbinRequest('get', usersBinId);
        return data.record || [];
    } catch (error) {
        console.error('Error loading users:', error);
        return [];
    }
};

// Save users to jsonbin.io
const saveUsers = async (users) => {
    try {
        await jsonbinRequest('put', usersBinId, users);
    } catch (error) {
        console.error('Error saving users:', error);
    }
};

// Load user preferences from jsonbin.io
const loadUserPrefs = async () => {
    try {
        const data = await jsonbinRequest('get', userPrefsBinId);
        return data.record || {};
    } catch (error) {
        console.error('Error loading user preferences:', error);
        return {};
    }
};

// Save user preferences to jsonbin.io
const saveUserPrefs = async (prefs) => {
    try {
        await jsonbinRequest('put', userPrefsBinId, prefs);
    } catch (error) {
        console.error('Error saving user preferences:', error);
    }
};

// Register a new user
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const users = await loadUsers();

        // Check if the user already exists based on username or email
        if (users.some(user => user.username === username || user.email === email)) {
            return res.status(400).send('User already exists.');
        }

        // Create a new user object
        const newUser = { username, email, password };
        users.push(newUser);
        await saveUsers(users);

        // Load existing user preferences
        const prefs = await loadUserPrefs();

        // Initialize preferences for the new user
        prefs[username] = { filters: {}, session: {} };

        // Save updated preferences
        await saveUserPrefs(prefs);

        console.log(`Initialized preference data for user: ${username}`);
        res.status(201).send('User registered successfully.');
    } catch (error) {
        console.error('Error in /register route:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Login a user
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const users = await loadUsers();

        const user = users.find(user => user.username === username && user.password === password);
        if (!user) {
            return res.status(401).send('Invalid credentials.');
        }

        res.status(200).send('Login successful.');
    } catch (error) {
        console.error('Error in /login route:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Save user preferences
app.post('/savePreferences', async (req, res) => {
    const { username, filters, session } = req.body;
    try {
        // Load all preferences
        const allPrefs = await loadUserPrefs();
        allPrefs[username] = { filters, session }; // Update preferences for the user

        // Save updated preferences
        await saveUserPrefs(allPrefs);

        res.status(200).send('Preferences saved successfully.');
    } catch (error) {
        console.error('Error in /savePreferences route:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Retrieve user preferences
app.post('/getPreferences', async (req, res) => {
    const { username } = req.body;
    try {
        // Load all preferences
        const allPrefs = await loadUserPrefs();

        // Check if the user's preferences exist
        if (!allPrefs[username]) {
            return res.status(404).send('User not found.');
        }

        console.log(`Retrieved preferences for user: ${username}`);
        res.status(200).json(allPrefs[username]);
    } catch (error) {
        console.error('Error in /getPreferences route:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Serve the static files from the React app
app.use(express.static(path.join(__dirname, 'build')));
app.get('/', (req, res) => {
    res.send('Server is running');
});

app.listen(PORT, () => console.log('Server is running on port ' + PORT));
