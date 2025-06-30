const express = require('express');
const cors = require('cors');
const captureRoutes = require('./routes/captureRoutes');

const app = express();

// Restrict CORS to specific extension ID and localhost for development
app.use(cors({ 
  origin: [
    'chrome-extension://fegjfgfpbfilhilkkdijdkanokckbenl',
    'http://localhost:5173' // Adjust for your frontend port if needed
  ]
}));
app.use(express.json());

app.use('/api/save', captureRoutes);
app.get('/api/files', async (req, res) => {
  try {
    const fs = require('fs').promises;
    const path = require('path');
    const capturesDir = path.join(__dirname, 'captures');
    const files = await fs.readdir(capturesDir);
    const textFiles = files.filter(file => file.endsWith('.txt'));
    res.status(200).json({ status: 'success', files: textFiles });
  } catch (err) {
    console.error('Error retrieving files:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));