const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const upload = multer({ dest: 'uploads/' });

// AWS S3 configuration
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

router.post('/upload-file/:folder', upload.single('file'), (req, res) => {
  const { folder } = req.params;
  const { organisationName, parentPropertyName, childPropertyName } = req.body;
  console.log(req.body);

  if (!organisationName || !parentPropertyName || !childPropertyName) {
    console.log("Required information not provided.");
    return res.status(400).send("Required information not provided.");
  }

  const file = req.file;
  if (!file) {
    console.log("No file uploaded.");
    return res.status(400).send("No file uploaded.");
  }

  const s3FolderName = `${organisationName}/${parentPropertyName}/${childPropertyName}/${folder}`;
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `${s3FolderName}/${file.originalname}`,
    Body: fs.createReadStream(file.path),
  };

  s3.upload(params, (err, data) => {
    if (err) {
      console.error("Error uploading file to S3:", err);
      return res.status(500).send("Error uploading file to S3.");
    }

    console.log(`File uploaded successfully to S3: ${data.Location}`);
    fs.unlinkSync(file.path);
    res.status(200).send(`File uploaded successfully to S3: ${data.Location}`);
  });
});

module.exports = router;
