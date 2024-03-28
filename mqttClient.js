const mqtt = require('mqtt');
const sqlite3 = require('sqlite3').verbose();

// MQTT broker URL
const brokerUrl = 'mqtt://3.96.64.144:1883';

// Create an MQTT client
const client = mqtt.connect(brokerUrl);

// SQLite database
const db = new sqlite3.Database('../database.db');

// Create a table to store MQTT data
db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS mqtt_data (id INTEGER PRIMARY KEY AUTOINCREMENT, topic TEXT NOT NULL, message TEXT NOT NULL, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP)');
});

// Subscribe to topics
client.on('connect', () => {
    console.log('Connected to MQTT broker');
    client.subscribe('heartsensor');
    client.subscribe('oxygensensor');
    // Add more topics as needed
});

// Handle incoming messages
client.on('message', (topic, message) => {
    console.log(`Received message on topic ${topic}: ${message.toString()}`);
    // Insert the received data into the SQLite table
    console.log("hii");
    db.run('INSERT INTO mqtt_data (topic, message) VALUES (?, ?)', [topic, message.toString()]);
});

module.exports = client;
