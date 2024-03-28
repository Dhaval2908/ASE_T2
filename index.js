const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const sqlite3 = require('sqlite3').verbose();
const mqtt = require('./mqttClient.js');

const app = express();
const db = new sqlite3.Database('../database.db');

db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS user (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL, password TEXT NOT NULL)');
});

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));
app.use((req, res, next) => {
    res.locals.userId = req.session.userId;
    next();
});

app.get('/signup', (req, res) => {
    res.render('signup', { error: null });
});

app.post('/signup', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if the email already exists in the database
        db.get('SELECT * FROM user WHERE email = ?', [email], async (err, row) => {
            if (err) {
                console.error(err);
                return res.status(500).send('An error occurred while checking email existence');
            }
            if (row) {
                return res.render('signup', { error: 'Email already exists' }); // Email already exists, render signup page with error message
            }
            console.log("hii")
            const hashedPassword = await bcrypt.hash(password, 10);
            db.run('INSERT INTO user (email, password) VALUES (?, ?)', [email, hashedPassword]);
            res.redirect('/login');
        });
    } catch (error) {
        console.error(error);
        res.status(500).send('An error occurred while signing up');
    }
});


app.get('/login', (req, res) => {
    res.render('login', { error: null }); // Pass the error variable with a default value of null
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    db.get('SELECT * FROM user WHERE email = ?', [email], async (err, row) => {
        if (err) {
            console.error(err);
            return res.status(500).send('An error occurred');
        }
        if (!row) {
            return res.render('login', { error: 'Invalid email or password' }); // Pass the error message
        }
        const validPassword = await bcrypt.compare(password, row.password);
        if (!validPassword) {
            return res.render('login', { error: 'Invalid email or password' }); // Pass the error message
        }
        req.session.userId = row.id;
        res.cookie('loggedIn', 'true', { maxAge: 30 * 60 * 1000 });
        res.redirect('/dashboard');
    });
});



function requireAuth(req, res, next) {
    if (req.session && req.session.userId) {
        return next();
    }
    res.redirect('/login');
}

app.use((req, res, next) => {
    if (req.session && req.session.userId) {
        db.get('SELECT email FROM user WHERE id = ?', [req.session.userId], (err, row) => {
            if (err) {
                console.error(err);
                return next(err);
            }
            if (!row) {
                console.log('User not found');
                res.locals.email = null; // Set email to null if user not found
            } else {
                console.log('User found:', row.email);
                res.locals.email = row.email;
            }
            next();
        });
    } else {
        console.log('No user session');
        res.locals.email = null; // Set email to null if no user session
        next();
    }
});

app.get('/dashboard', requireAuth, (req, res) => {
    // Query the SQLite database for the latest data from each sensor
    db.all('SELECT * FROM mqtt_data WHERE topic = ? OR topic = ? ORDER BY timestamp DESC LIMIT 2', ['heartsensor', 'oxygensensor'], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).send('An error occurred');
        }
        // Prepare the data to send to the dashboard view
        const data = {
            heartsensor: null,
            oxygensensor: null
        };
        rows.forEach(row => {
            if (row.topic === 'heartsensor') {
                data.heartsensor = row.message;
            } else if (row.topic === 'oxygensensor') {
                data.oxygensensor = row.message;
            }
        });
        res.render('dashboard', { email: res.locals.email, data: data });
    });
});

app.get('/dashboard-data', requireAuth, (req, res) => {
    // Query the SQLite database for the latest data from each sensor
    db.all('SELECT * FROM mqtt_data WHERE topic = ? OR topic = ? ORDER BY timestamp DESC LIMIT 2', ['heartsensor', 'oxygensensor'], (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'An error occurred' });
        }
        // Prepare the data to send to the dashboard
        const data = {
            heartsensor: null,
            oxygensensor: null
        };
        rows.forEach(row => {
            if (row.topic === 'heartsensor') {
                data.heartsensor = row.message;
            } else if (row.topic === 'oxygensensor') {
                data.oxygensensor = row.message;
            }
        });
        res.json(data);
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error(err);
            return res.status(500).send('An error occurred');
        }
        res.clearCookie('loggedIn'); // Clear the login cookie
        res.redirect('/login');
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
