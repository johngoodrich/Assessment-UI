const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Enable CORS so your frontend can talk to this API if they are on different ports
app.use(cors());

// Use raw body parser to handle the binary Excel buffer
app.use(bodyParser.raw({
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    limit: '1gb'
}));

// Define the path to the AIA folder
const aiaFolderPath = path.join(__dirname, 'AIA');
// Ensure the AIA directory exists
if (!fs.existsSync(aiaFolderPath)) {
    fs.mkdirSync(aiaFolderPath, { recursive: true });
    console.log(`Created directory: ${aiaFolderPath}`);
}

// GET endpoint to serve the initial Excel file
app.get('/api/get-assessment-template', (req, res) => {
    const filePath = path.join(aiaFolderPath, 'AI_Maturity_Assessment.xlsx');
    if (fs.existsSync(filePath)) {
        res.sendFile(filePath);
    } else {
        res.status(404).send('AI_Maturity_Assessment.xlsx not found in the AIA folder.');
    }
});

app.post('/api/save-assessment-results', (req, res) => {
    const filename = req.headers['x-filename'] || 'Results.xlsx';
    const filePath = path.join(aiaFolderPath, filename); // Save to the AIA folder

    console.log(`Received request to save: ${filename}`);
    if (!req.body || req.body.length === 0) {
        return res.status(400).send('No data received.');
    }

    fs.writeFile(filePath, req.body, (err) => {
        if (err) {
            console.error('Error saving file:', err);
            return res.status(500).send('Failed to save file.');
        }
        console.log(`Successfully saved updated workbook to ${filePath}`);
        res.send({ message: 'File saved successfully', path: filePath });
    });
});

app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
