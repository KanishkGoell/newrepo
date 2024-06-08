import express from 'express';
import cors from 'cors';
import AWS from 'aws-sdk';
import bodyParser from 'body-parser';

// Configure AWS SDK
AWS.config.update({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();
const bucketName = 'YOUR_BUCKET_NAME';
const usersFile = 'users.json';
const userPrefsFile = 'user_prefs.json';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(bodyParser.json());

// Helper function to read file from S3
const readFileFromS3 = async (fileName) => {
    const params = {
        Bucket: bucketName,
        Key: fileName,
    };

    const data = await s3.getObject(params).promise();
    return JSON.parse(data.Body.toString('utf-8'));
};

// Helper function to write file to S3
const writeFileToS3 = async (fileName, content) => {
    const params = {
        Bucket: bucketName,
        Key: fileName,
        Body: JSON.stringify(content, null, 2),
        ContentType: 'application/json',
    };

    await s3.putObject(params).promise();
};

// Load users from file
const loadUsers = async () => {
    try {
        const users = await readFileFromS3(usersFile);
        console.log('Loaded users:', users);
        return users;
    } catch (error) {
        console.error("Error loading users:", error);
        return [];
    }
};

// Save users to file
const saveUsers = async (users) => {
    try {
        await writeFileToS3(usersFile, users);
        console.log('Saved users:', users);
    } catch (error) {
        console.error("Error saving users:", error);
    }
};

// Load user preferences
const loadUserPrefs = async () => {
    try {
        const prefs = await readFileFromS3(userPrefsFile);
        console.log('Loaded user preferences:', prefs);
        return prefs;
    } catch (error) {
        console.error("Error loading user preferences:", error);
        return {};
    }
};

// Save user preferences
const saveUserPrefs = async (prefs) => {
    try {
        await writeFileToS3(userPrefsFile, prefs);
        console.log('Saved user preferences:', prefs);
    } catch (error) {
        console.error("Error saving user preferences:", error);
    }
};

// Register a new user
app.post('/register', async (req, res) => {
    const { username, email, password } = req.body;
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
});

// Login a user
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const users = await loadUsers();

    const user = users.find(user => user.username === username && user.password === password);
    if (!user) {
        return res.status(401).send('Invalid credentials.');
    }

    res.status(200).send('Login successful.');
});

// Save user preferences
app.post('/savePreferences', async (req, res) => {
    const { username, filters, session } = req.body;

    // Load all preferences
    const allPrefs = await loadUserPrefs();
    allPrefs[username] = { filters, session }; // Update preferences for the user

    // Save updated preferences
    await saveUserPrefs(allPrefs);

    res.status(200).send('Preferences saved successfully.');
});

// Retrieve user preferences
app.post('/getPreferences', async (req, res) => {
    const { username } = req.body;

    // Load all preferences
    const allPrefs = await loadUserPrefs();

    // Check if the user's preferences exist
    if (!allPrefs[username]) {
        return res.status(404).send('User not found.');
    }

    console.log(`Retrieved preferences for user: ${username}`);
    res.status(200).json(allPrefs[username]);
});

// Endpoint to serve the JSON file
app.get("/getTable", async (req, res) => {
    try {
        const data = await readFileFromS3('data.json');
        res.json(data);
    } catch (error) {
        console.error("Error reading JSON file:", error);
        res.status(500).send("Internal Server Error");
    }
});

// Serve the static files from the React app
app.use(express.static('build'));
app.get('/', (req, res) => {
    res.send('Server is running');
});

app.listen(PORT, () => console.log('Server is running on port ' + PORT));
