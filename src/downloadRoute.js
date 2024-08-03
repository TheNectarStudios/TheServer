const express = require('express');
const AWS = require('aws-sdk');
const multer = require('multer');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const router = express.Router();

// Set up AWS S3 configuration
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
  httpOptions: {
    timeout: 300000, // Increase timeout to 5 minutes
  },
  logger: console, // Enable logging
});

const s3 = new AWS.S3();
const upload = multer(); // Use memory storage for multer

router.post('/fetch-objects', upload.none(), async (req, res) => {
  console.log("Received request to fetch objects.");

  const { organisationName, parentPropertyName, childPropertyName } = req.body;

  // Validate input
  if (!organisationName || !parentPropertyName || !childPropertyName) {
    console.error("Required information not provided.");
    return res.status(400).send("Required information not provided.");
  }

  const prefix = `${organisationName}/${parentPropertyName}/${childPropertyName}/`;
  console.log(`Fetching objects with prefix: ${prefix}`);

  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Prefix: prefix,
    };

    // List objects with the specified prefix
    console.log("Listing objects with specified prefix...");
    const listedObjects = await s3.listObjectsV2(params).promise();
    console.log(`Listed objects: ${listedObjects.Contents.length} found`);

    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      console.log("No objects found with the specified prefix.");
      return res.status(404).send("No objects found with the specified prefix.");
    }

    // Download each object and store in memory
    const downloadPromises = listedObjects.Contents.map(async object => {
      const objectKey = object.Key;
      const objectParams = { Bucket: process.env.S3_BUCKET_NAME, Key: objectKey };

      console.log(`Downloading object: ${objectKey}`);
      try {
        const objectData = await s3.getObject(objectParams).promise();
        console.log(`Downloaded object: ${objectKey}`);
        return {
          key: objectKey,
          data: objectData.Body.toString('base64'), // Store data in base64 format
        };
      } catch (downloadErr) {
        console.error(`Error downloading object ${objectKey}: ${downloadErr}`);
        return {
          key: objectKey,
          error: `Error downloading object: ${downloadErr.message}`,
        };
      }
    });

    // Wait for all downloads to complete
    console.log("Waiting for all downloads to complete...");
    const downloadedFiles = await Promise.all(downloadPromises);

    const errors = downloadedFiles.filter(file => file.error);
    if (errors.length > 0) {
      console.error("Errors occurred during download:", errors);
      return res.status(500).json({ message: 'Errors occurred during download', errors });
    }

    console.log(`Downloaded files: ${downloadedFiles.length}`);
    res.status(200).json({ message: 'Files downloaded successfully', files: downloadedFiles });
  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).send("Unexpected error.");
  }
});

module.exports = router;
