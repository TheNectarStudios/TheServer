const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });


const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const fs = require('fs');
const app = express();
const port = 3000;

// Set up AWS S3
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();
const upload = multer({ dest: 'uploads/' });

// Route to handle file upload
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }

  const fileContent = fs.readFileSync(req.file.path);
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `Models/${req.file.originalname}`,
    Body: fileContent,
  };

  s3.upload(params, (err, data) => {
    if (err) {
      console.error(err);
      res.status(500).send("Error uploading file");
    } else {
      console.log(`File uploaded successfully. ${data.Location}`);
      res.status(200).send(`File uploaded successfully. ${data.Location}`);
    }
    fs.unlinkSync(req.file.path);
  });
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
