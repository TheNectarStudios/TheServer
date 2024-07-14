const express = require('express');
const router = express.Router();
const multer = require('multer');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');

// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Set up AWS S3 configuration 
AWS.config.update({ 
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

// Route to handle multiple file uploads (existing functionality)
router.post('/upload', upload.fields([{ name: 'model' }, { name: 'texture' }]), (req, res) => {
  const { directoryPath, username, propertyName , organisationName } = req.body;
  console.log(`Directory Path: ${directoryPath}, Username: ${username}, Property Name: ${propertyName}`);

  if (!directoryPath || !username || !propertyName || !organisationName) {
    return res.status(400).send("Required information not provided.");
  }

  const folderName = `${organisationName}_${propertyName}/model`;
  const uploadPromises = [];

  // Read the directory and upload files to S3
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error("Error reading directory:", err);
      return res.status(500).send("Error reading directory.");
    }

    files.forEach(file => {
      const filePath = path.join(directoryPath, file);
      const isFile = fs.statSync(filePath).isFile(); // Check if it's a file

      if (!isFile) {
        console.warn(`Skipping ${filePath} because it's not a file.`);
        return; // Skip directories
      }

      const fileContent = fs.readFileSync(filePath);

      const params = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: `${folderName}/${file}`,
        Body: fileContent,
      };

      // Using promises for each S3 upload
      uploadPromises.push(
        s3.upload(params).promise().then(data => {
          console.log(`Uploaded ${file} to S3.`);
          return data.Location; // Return S3 object URL
        }).catch(err => {
          console.error(`Error uploading ${file} to S3:`, err);
          throw err;
        })
      );
    });

    // Wait for all uploads to complete
    Promise.all(uploadPromises)
      .then(locations => {
        res.status(200).send(`Files uploaded successfully. ${locations.join(', ')}`);
      })
      .catch(err => {
        console.error("Error uploading files:", err);
        res.status(500).send("Error uploading files");
      });
  });
});

// Route to handle single image upload from Unity application
router.post('/upload-image', upload.single('file'), (req, res) => {
  console.log("Received request to upload image.");
  const { directoryPath, username, propertyName , organisationName ,folderName } = req.body;
  console.log(`Username: ${username}, Property Name: ${propertyName}, Folder Name: ${folderName}`);

  if (!username || !propertyName || !folderName || !organisationName) {
    return res.status(400).send("Required information not provided.");
  }

  const file = req.file;
  if (!file) {
    return res.status(400).send("No file uploaded.");
  }

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `${organisationName}/${propertyName}/${folderName}/${file.originalname}`,
    Body: fs.createReadStream(file.path),
  };

  s3.upload(params, (err, data) => { 
    if (err) {
      console.error("Error uploading file to S3:", err);
      return res.status(500).send("Error uploading file to S3.");
    }

    console.log(`File uploaded successfully to S3: ${data.Location}`);
    res.status(200).send(`File uploaded successfully to S3: ${data.Location}`);
  });
});

module.exports = router;
