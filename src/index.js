const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const userRoutes = require('./userRoutes');

// const downloadRoutes = require('./downloadRoutes');
const app = express();
app.use(bodyParser.json());
const port = process.env.PORT || 3000;
// aap.use('/download', downloadRoutes);
// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// Set up AWS S3 configuration
AWS.config.update({ 
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
}); 

const s3 = new AWS.S3(); 
app.use('/user', userRoutes);
// Configure Multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Middleware to parse JSON bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Route to handle multiple file uploads (existing functionality)
app.post('/upload', upload.fields([{ name: 'model' }, { name: 'texture' }]), (req, res) => {
  const { directoryPath, username, propertyName } = req.body;
  console.log(`Directory Path: ${directoryPath}, Username: ${username}, Property Name: ${propertyName}`);

  if (!directoryPath || !username || !propertyName) {
    return res.status(400).send("Required information not provided.");
  }

  const folderName = `models/${username}_${propertyName}/model`;
  const uploadPromises = [];

  // Read the directory and upload files to S3
  fs.readdir(directoryPath, (err, files) => {
    if (err) {
      console.error(err);
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
        console.error(err);
        res.status(500).send("Error uploading files");
      });
  });
});

// Route to handle single image upload from Unity application
app.post('/upload-image', upload.single('file'), (req, res) => {
  console.log("Received request to upload image.");
  let { username, propertyName, folderName } = req.body;
  console.log(`Username: ${username}, Property Name: ${propertyName}, Folder Name: ${folderName}`);

  if (!username || !propertyName || !folderName) {
    return res.status(400).send("Required information not provided.");
  }

  const file = req.file;
  if (!file) {
    return res.status(400).send("No file uploaded.");
  }

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `models/${username}_${propertyName}/${folderName}/${file.originalname}`,
    Body: fs.createReadStream(file.path),
  };

  s3.upload(params, (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send("Error uploading file to S3.");
    }

    console.log(`File uploaded successfully to S3: ${data.Location}`);
    res.status(200).send(`File uploaded successfully to S3: ${data.Location}`);
  });
});

// Route to handle saving scene data (positions and rotations)
// Route to handle saving scene data (positions and rotations)
app.post('/save-positions-rotations', (req, res) => {
  let { username, propertyName, hotspots } = req.body;

  console.log(`Request Body: ${JSON.stringify(req.body)}`);
  console.log(`Username: ${username}, Property Name: ${propertyName}`);

  if (!username || !propertyName || !hotspots) {
      console.error("Required information not provided.");
      return res.status(400).send("Required information not provided.");
  }

  // Convert hotspots to JSON if it's a string
  if (typeof hotspots === 'string') {
    try {
      hotspots = JSON.parse(hotspots);
    } catch (err) {
      console.error("Error parsing hotspots JSON:", err);
      return res.status(400).send("Invalid hotspots JSON format.");
    }
  }

  const folderName = `models/${username}_${propertyName}`;
  const fileName = 'info.json';
  const fileContent = JSON.stringify({ hotspots });

  const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `${folderName}/${fileName}`,
      Body: fileContent,
      ContentType: 'application/json',
  };

  s3.upload(params, (err, data) => {
      if (err) {
          console.error("Error uploading JSON to S3:", err);
          return res.status(500).send("Error uploading JSON to S3.");
      }

      console.log(`JSON uploaded successfully to S3: ${data.Location}`);
      res.status(200).send(`JSON uploaded successfully to S3: ${data.Location}`);
  });
});


app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
