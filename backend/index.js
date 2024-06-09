import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;
const MONGO_URI = process.env.MONGO_URI;

app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('Error connecting to MongoDB:', err));

// User schema
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    password: { type: String, required: true },
});

const User = mongoose.model('User', userSchema);

// User preferences schema
const userPrefsSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    filters: { type: Object, default: {} },
    session: { type: Object, default: {} },
});

const UserPrefs = mongoose.model('UserPrefs', userPrefsSchema);

// Register a new user
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
    try {
        const newUser = new User({ username, email, password });
        await newUser.save();

        const newUserPrefs = new UserPrefs({ username });
        await newUserPrefs.save();

        res.status(201).send('User registered successfully.');
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(400).send('User already exists or registration failed.');
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
        console.error('Error logging in user:', error);
        res.status(500).send('Internal server error.');
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
        console.error('Error saving preferences:', error);
        res.status(500).send('Internal server error.');
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
        res.status(200).json(userPrefs);
    } catch (error) {
        console.error('Error retrieving preferences:', error);
        res.status(500).send('Internal server error.');
    }
});

// Serve the static files from the React app
app.use(express.static('build'));
app.get('/', (req, res) => {
    res.send('Server is running');
});

app.listen(PORT, () => console.log('Server is running on port ' + PORT));
