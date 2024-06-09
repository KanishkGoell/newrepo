import express from 'express';
import cors from 'cors';
import pkg from 'mongodb';
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

const { MongoClient, ServerApiVersion } = pkg;

// Check if MONGO_URI is correctly set
if (!process.env.MONGO_URI) {
    console.error('MONGO_URI is not defined. Check your .env file.');
    process.exit(1); // Exit the application
}

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let db, usersCollection, userPrefsCollection;

async function connectToMongoDB() {
  try {
    // Connect the client to the server
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

    // Initialize database and collections
    db = client.db("cluster1"); // Replace with your actual database name
    usersCollection = db.collection("users");
    userPrefsCollection = db.collection("user_prefs");
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1); // Exit the application if the connection fails
  }
}

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Ensure MongoDB is connected before handling any requests
app.use(async (req, res, next) => {
  if (!db || !usersCollection || !userPrefsCollection) {
    await connectToMongoDB();
  }
  next();
});

// Register a new user
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Check if the user already exists
        const existingUser = await usersCollection.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).send('User already exists.');
        }

        // Create a new user
        const newUser = { username, email, password };
        await usersCollection.insertOne(newUser);

        // Initialize preferences for the new user
        const newUserPrefs = { username, filters: {}, session: {} };
        await userPrefsCollection.insertOne(newUserPrefs);

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
        const user = await usersCollection.findOne({ username, password });
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
        const result = await userPrefsCollection.updateOne(
            { username },
            { $set: { filters, session } },
            { upsert: true }
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
        const userPrefs = await userPrefsCollection.findOne({ username });
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
