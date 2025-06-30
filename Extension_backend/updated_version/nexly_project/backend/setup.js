const fs = require('fs').promises;
const path = require('path');

async function setup() {
  try {
    await fs.mkdir(path.join(__dirname, 'routes'), { recursive: true });
    await fs.mkdir(path.join(__dirname, 'controllers'), { recursive: true });

    await fs.writeFile(path.join(__dirname, 'routes', 'captureRoutes.js'), `
const express = require('express');
const router = express.Router();
const { saveData } = require('../controllers/captureController');

router.post('/', saveData);

module.exports = router;
    `);

    await fs.writeFile(path.join(__dirname, 'controllers', 'captureController.js'), `
const fs = require('fs').promises;
const path = require('path');

const saveData = async (req, res) => {
  try {
    console.log('Received:', JSON.stringify(req.body, null, 2));
    
    let fileName;
    let filePath;
    const selectedText = req.body.selectedText || '';
    
    if (req.body.newFile) {
      fileName = req.body.fileName || \`capture-\${new Date().toISOString().replace(/[:.]/g, '-')}.txt\`;
      filePath = path.join(__dirname, '../captures', fileName);
      await fs.mkdir(path.join(__dirname, '../captures'), { recursive: true });
      await fs.writeFile(filePath, selectedText || '');
    } else {
      fileName = req.body.fileName || 'copiedText.txt';
      filePath = path.join(__dirname, '../captures', fileName);
      await fs.mkdir(path.join(__dirname, '../captures'), { recursive: true });
      if (!selectedText) {
        console.warn('No selected text to append');
        res.status(400).json({ status: 'error', message: 'No text provided to append' });
        return;
      }
      try {
        await fs.appendFile(filePath, selectedText + '\\n\\n');
      } catch (err) {
        if (err.code === 'ENOENT') {
          await fs.writeFile(filePath, selectedText + '\\n\\n');
        } else {
          throw err;
        }
      }
    }
    
    res.status(200).json({ status: 'success', fileSaved: fileName });
    console.log('Data saved to:', fileName);
  } catch (err) {
    console.error('Server error:', err);
    res.status(500).json({ status: 'error', message: err.message });
  }
};

module.exports = { saveData };
    `);

    console.log('Setup complete: routes and controllers created.');
  } catch (err) {
    console.error('Setup error:', err);
  }
}

setup();