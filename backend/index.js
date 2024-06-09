import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Get __dirname equivalent in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors());
app.use(bodyParser.json());

// Check if MONGO_URI is correctly set
if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not defined. Check your .env file.');
    process.exit(1); // Exit the application
}

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Failed to connect to MongoDB:', err));

// Define schemas
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true }
});

const userPrefsSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    filters: Object,
    session: Object
});

// Define models
const User = mongoose.model('User', userSchema);
const UserPrefs = mongoose.model('UserPrefs', userPrefsSchema);

// Register a new user
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if the user already exists
        if (await User.exists({ $or: [{ username }, { email }] })) {
            return res.status(400).send('User already exists.');
        }

        // Create a new user
        const newUser = new User({ username, email, password });
        await newUser.save();

        // Initialize preferences for the new user
        const newUserPrefs = new UserPrefs({ username, filters: {}, session: {} });
        await newUserPrefs.save();

        console.log(`Initialized preference data for user: ${username}`);
        res.status(201).send('User registered successfully.');
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(500).send('Internal Server Error');
    }
});

// Login a user
app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username, password });
        if (!user) {
            return res.status(401).send('Invalid credentials.');
        }

        res.status(200).send('Login successful.');
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).send('Internal Server Error');
    }
});

// Save user preferences
app.post('/savePreferences', async (req, res) => {
    const { username, filters, session } = req.body;

    try {
        const userPrefs = await UserPrefs.findOneAndUpdate(
            { username },
            { filters, session },
            { new: true, upsert: true }
        );

        res.status(200).send('Preferences saved successfully.');
    } catch (error) {
        console.error("Error saving preferences:", error);
        res.status(500).send('Internal Server Error');
    }
});

// Retrieve user preferences
app.post('/getPreferences', async (req, res) => {
    const { username } = req.body;

    try {
        const userPrefs = await UserPrefs.findOne({ username });
        if (!userPrefs) {
            return res.status(404).send('User not found.');
        }

        console.log(`Retrieved preferences for user: ${username}`);
        res.status(200).json(userPrefs);
    } catch (error) {
        console.error("Error retrieving preferences:", error);
        res.status(500).send('Internal Server Error');
    }
});

// Endpoint to serve the JSON file (assuming it is still needed)
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
