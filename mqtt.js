const mqtt = require('mqtt');

const client = mqtt.connect('mqtt://3.96.64.144:1883'); // Example MQTT broker, replace with your broker URL

client.on('connect', function () {
    console.log('Connected to MQTT broker');
    
    // Publish sample data on each topic
    client.publish('age', JSON.stringify(30));
    client.publish('sex', JSON.stringify(1)); // 1 for Male, 0 for Female
    client.publish('cp', JSON.stringify(0)); // Chest Pain Type: 0 for Typical Angina
    client.publish('trestbps', JSON.stringify(120));
    client.publish('chol', JSON.stringify(200));
    client.publish('fbs', JSON.stringify(0)); // Fasting Blood Sugar > 120 mg/dL: 0 for No
    client.publish('restecg', JSON.stringify(1)); // Resting Electrocardiographic Results: 1 for ST-T Wave Abnormality
    client.publish('thalch', JSON.stringify(150));
    client.publish('exang', JSON.stringify(0)); // Exercise Induced Angina: 0 for No
    client.publish('oldpeak', JSON.stringify(0.8));
    client.publish('slope', JSON.stringify(1)); // Slope of the Peak Exercise ST Segment: 1 for Flat
    client.publish('ca', JSON.stringify(2));
    client.publish('thal', JSON.stringify(2)); // Thalassemia: 2 for Reversible Defect
    client.publish('oxygen_level', JSON.stringify(98));
    client.publish('heart_condition', JSON.stringify(1)); // Heart Condition: 1 for Heart Disease
});

client.on('error', function (error) {
    console.error('Error:', error);
});

client.on('offline', function () {
    console.log('Disconnected from MQTT broker');
});
