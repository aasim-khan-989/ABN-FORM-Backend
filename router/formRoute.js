// routes/formRoute.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Define the upload directory
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const allowedTypes = /jpeg|png|gif|jpg|pdf/;
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); // Store files in the 'uploads' folder
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      return cb(new Error('Invalid file type. Only JPEG, PNG, JPG, GIF, and PDF are allowed.'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
});


// Helper function to convert file to Base64
const convertToBase64 = (filePath) => {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) reject(err);
      else resolve(`data:image/jpeg;base64,${data.toString('base64')}`);
    });
  });
};

// Save form data to JSON
const saveFormDataToFile = (data) => {
  const filePath = path.join(__dirname, 'data.json');
  let existingData = [];
  try {
    if (fs.existsSync(filePath)) {
      const rawData = fs.readFileSync(filePath, 'utf8');
      existingData = rawData ? JSON.parse(rawData) : [];
    }
  } catch (error) {
    console.error('Error reading data.json:', error);
  }

  existingData.push(data);

  try {
    fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing to data.json:', error);
  }
};
router.get('/initialize', (req, res) => {
  try {
    res.status(200).send({ message: 'Server initialized successfully!' });
  } catch (error) {
    console.error('Error initializing server:', error);
    res.status(500).send({ message: 'Error initializing server', error: error.message });
  }
});

// Fetch the saved form data
router.get('/get-form-data', (req, res) => {
  const filePath = path.join(__dirname, 'data.json');
  try {
    if (fs.existsSync(filePath)) {
      const rawData = fs.readFileSync(filePath, 'utf8');
      const data = rawData ? JSON.parse(rawData) : [];
      res.status(200).json(data);
    } else {
      res.status(404).send({ message: 'No form data found' });
    }
  } catch (error) {
    console.error('Error reading form data:', error);
    res.status(500).send({ message: 'Error fetching form data', error: error.message });
  }
});



// Define the route and attach file upload handling
router.post('/submit-form', upload.fields([
  { name: 'profilePic' },
  { name: 'signature' },
  { name: 'document1' },
  { name: 'document2' }
]), async (req, res) => {
  try {
    const formData = {
      ...req.body,
      profilePic: req.files?.profilePic ? await convertToBase64(req.files.profilePic[0].path) : null,
      signature: req.files?.signature ? await convertToBase64(req.files.signature[0].path) : null,
      document1: req.files?.document1 ? await convertToBase64(req.files.document1[0].path) : null,
      document2: req.files?.document2 ? await convertToBase64(req.files.document2[0].path) : null,
    };

    // Add null check for each file before conversion
    saveFormDataToFile(formData);

    // Clean up uploaded files with null checks
    Object.values(req.files || {}).forEach(files => {
      if (files && files[0]) {
        fs.unlinkSync(files[0].path);
      }
    });

    res.status(200).send({ message: 'Form submitted successfully!', data: formData });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).send({ message: 'Error submitting form', error: error.message });
  }
});


// Route to delete form data from local storage (data.json)
router.delete('/delete-form-data', (req, res) => {
  const filePath = path.join(__dirname, 'data.json');
  try {
    if (fs.existsSync(filePath)) {
      // Delete the file if it exists
      fs.unlinkSync(filePath);
      res.status(200).send({ message: 'Form data deleted successfully!' });
    } else {
      res.status(404).send({ message: 'No form data found to delete' });
    }
  } catch (error) {
    console.error('Error deleting form data:', error);
    res.status(500).send({ message: 'Error deleting form data', error: error.message });
  }
})


module.exports = router;