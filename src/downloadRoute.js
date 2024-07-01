const express = require('express');
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());
const port = process.env.PORT || 3000;

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '../.env') });

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

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.post('/fetch-objects', async (req, res) => {
  const { username, propertyName, localPath } = req.body;

  if (!username || !propertyName || !localPath) {
    return res.status(400).send("Required information not provided.");
  }

  const prefix = `models/${username}_${propertyName}/`;
  console.log(`Fetching objects with prefix: ${prefix}`);

  try {
    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Prefix: prefix,
    };

    // List objects with the specified prefix
    const listedObjects = await s3.listObjectsV2(params).promise();
    if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
      console.log("No objects found with the specified prefix.");
      return res.status(404).send("No objects found with the specified prefix.");
    }

    const downloadPromises = listedObjects.Contents.map(async object => {
      const objectKey = object.Key;
      const objectParams = { Bucket: process.env.S3_BUCKET_NAME, Key: objectKey };

      console.log(`Downloading object: ${objectKey}`);
      // Fetch the object from S3
      const objectData = await s3.getObject(objectParams).promise();
      console.log(`Downloaded object: ${objectKey}`);

      // Create local directories if they don't exist
      const fullLocalPath = path.join(localPath, objectKey);
      fs.mkdirSync(path.dirname(fullLocalPath), { recursive: true });

      // Save the object locally
      fs.writeFileSync(fullLocalPath, objectData.Body);

      return fullLocalPath;
    });

    const downloadedFiles = await Promise.all(downloadPromises);
    console.log(`Downloaded files: ${downloadedFiles}`);

    res.status(200).json({ message: 'Files downloaded successfully', files: downloadedFiles });
  } catch (error) {
    console.error("Error fetching objects:", error);
    res.status(500).send("Error fetching objects.");
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
