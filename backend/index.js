import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json());

// JSONBin API configurations
const JSONBIN_BASE_URL = 'https://api.jsonbin.io/v3/b';
const USERS_BIN_ID = process.env.USERS_BIN_ID;
const PREFS_BIN_ID = process.env.PREFS_BIN_ID;
const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY;

// Function to read a bin from JSONBin
const readBinFromJSONBin = async (binId) => {
    try {
        const response = await axios.get(`${JSONBIN_BASE_URL}/${binId}/latest`, {
            headers: {
                'X-Master-Key': JSONBIN_API_KEY
            }
        });
        return response.data.record;
    } catch (err) {
        console.error('Error reading bin from JSONBin:', err.response ? err.response.data : err.message);
        throw err;
    }
};

// Function to write a bin to JSONBin
const writeBinToJSONBin = async (binId, data) => {
    try {
        await axios.put(`${JSONBIN_BASE_URL}/${binId}`, data, {
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_API_KEY
            }
        });
        console.log(`Bin ${binId} written to JSONBin successfully`);
    } catch (err) {
        console.error('Error writing bin to JSONBin:', err.response ? err.response.data : err.message);
        throw err;
    }
};

// Load users from JSONBin
const loadUsers = async () => {
    return await readBinFromJSONBin(USERS_BIN_ID) || [];
};

// Save users to JSONBin
const saveUsers = async (users) => {
    await writeBinToJSONBin(USERS_BIN_ID, users);
};

// Load user preferences from JSONBin
const loadUserPrefs = async () => {
    return await readBinFromJSONBin(PREFS_BIN_ID) || {};
};

// Save user preferences to JSONBin
const saveUserPrefs = async (prefs) => {
    await writeBinToJSONBin(PREFS_BIN_ID, prefs);
};

// Register a new user
app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        const users = await loadUsers();

        // Check if the user already exists
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
        console.error('Error during user registration:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Login a user
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const users = await loadUsers();

        const user = users.find(user => user.username === username && user.password === password);
        if (!user) {
            return res.status(401).send('Invalid credentials.');
        }

        res.status(200).send('Login successful.');
    } catch (error) {
        console.error('Error during user login:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Save user preferences
app.post('/savePreferences', async (req, res) => {
    try {
        const { username, filters, session } = req.body;

        // Load all preferences
        const allPrefs = await loadUserPrefs();
        allPrefs[username] = { filters, session }; // Update preferences for the user

        // Save updated preferences
        await saveUserPrefs(allPrefs);

        res.status(200).send('Preferences saved successfully.');
    } catch (error) {
        console.error('Error saving preferences:', error);
        res.status(500).send('Internal Server Error');
    }
});

// Retrieve user preferences
app.post('/getPreferences', async (req, res) => {
    try {
        const { username } = req.body;

        // Load all preferences
        const allPrefs = await loadUserPrefs();

        // Check if the user's preferences exist
        if (!allPrefs[username]) {
            return res.status(404).send('User not found.');
        }

        console.log(`Retrieved preferences for user: ${username}`);
        res.status(200).json(allPrefs[username]);
    } catch (error) {
        console.error('Error retrieving preferences:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.listen(PORT, () => console.log('Server is running on port ' + PORT));
