const express = require('express');
const router = express.Router();
const { saveData } = require('../controllers/captureController');

router.post('/', saveData);

module.exports = router;