const express = require('express');
const AWS = require('aws-sdk');

const router = express.Router();

// Load environment variables and AWS configuration
require('dotenv').config();
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const s3 = new AWS.S3();

// Route to generate signed URL for downloading a specific file from S3
router.post('/download-url', async (req, res) => {
  const { username, propertyName, fileName } = req.body;

  if (!username || !propertyName || !fileName) {
    return res.status(400).send('Missing parameters');
  }

  const folderPath = `models/${username}_${propertyName}/`;

  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `${folderPath}/${fileName}`,
      Expires: 3600, // URL expiration time in seconds (1 hour in this example)
    };

    const signedUrl = await s3.getSignedUrlPromise('getObject', params);
    res.status(200).send({ downloadUrl: signedUrl });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).send('Failed to generate download URL');
  }
});

module.exports = router;
