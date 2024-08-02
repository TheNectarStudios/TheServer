// const express = require('express');
// const AWS = require('aws-sdk');
// const multer = require('multer');
// const path = require('path');
// require('dotenv').config({ path: path.join(__dirname, '../.env') });

// const router = express.Router();

// // Set up AWS S3 configuration
// AWS.config.update({
//   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   region: process.env.AWS_REGION,
//   httpOptions: {
//     timeout: 300000, // Increase timeout to 5 minutes
//   },
//   logger: console, // Enable logging
// });

// const s3 = new AWS.S3();
// const upload = multer(); // Use memory storage for multer

// router.post('/fetch-objects', upload.single('file'), async (req, res) => {
//   console.log("Received request to fetch objects.");

//   const { organisationName, parentPropertyName, childPropertyName, localPath } = req.body;

//   // Validate input
//   if (!organisationName || !parentPropertyName || !childPropertyName || !localPath) {
//     console.error("Required information not provided.");
//     return res.status(400).send("Required information not provided.");
//   }

//   const prefix = `${organisationName}/${parentPropertyName}/${childPropertyName}/`;
//   console.log(`Fetching objects with prefix: ${prefix}`);

//   try {
//     const params = {
//       Bucket: process.env.S3_BUCKET_NAME,
//       Prefix: prefix,
//     };

//     // List objects with the specified prefix
//     console.log("Listing objects with specified prefix...");
//     const listedObjects = await s3.listObjectsV2(params).promise();
//     console.log(`Listed objects: ${listedObjects.Contents.length} found`);

//     if (!listedObjects.Contents || listedObjects.Contents.length === 0) {
//       console.log("No objects found with the specified prefix.");
//       return res.status(404).send("No objects found with the specified prefix.");
//     }

//     // Download each object
//     const downloadPromises = listedObjects.Contents.map(async object => {
//       const objectKey = object.Key;
//       const objectParams = { Bucket: process.env.S3_BUCKET_NAME, Key: objectKey };

//       console.log(`Downloading object: ${objectKey}`);
//       // Fetch the object from S3
//       const objectData = await s3.getObject(objectParams).promise();
//       console.log(`Downloaded object: ${objectKey}`);

//       // Return the object key and data (as Buffer) in response
//       return {
//         key: objectKey,
//         data: objectData.Body.toString('base64'), // Convert to base64 if you need to send it as a string
//       };
//     });

//     // Wait for all downloads to complete
//     console.log("Waiting for all downloads to complete...");
//     const downloadedFiles = await Promise.all(downloadPromises);
//     console.log(`Downloaded files: ${downloadedFiles.length}`);

//     res.status(200).json({ message: 'Files downloaded successfully', files: downloadedFiles });
//   } catch (error) {
//     console.error("Error fetching objects:", error);
//     res.status(500).send("Error fetching objects.");
//   }
// });

// module.exports = router;


const express = require('express');
const AWS = require('aws-sdk');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
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

router.post('/fetch-objects', upload.single('file'), async (req, res) => {
  console.log("Received request to fetch objects.");

  const { organisationName, parentPropertyName, childPropertyName, localPath } = req.body;

  // Validate input
  if (!organisationName || !parentPropertyName || !childPropertyName || !localPath) {
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

    // Helper function to create directories recursively
    const createDirectories = (filePath) => {
      const dirPath = path.dirname(filePath);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
    };

    // Download each object and save to the local path with directory structure
    const downloadPromises = listedObjects.Contents.map(async object => {
      const objectKey = object.Key;
      const objectParams = { Bucket: process.env.S3_BUCKET_NAME, Key: objectKey };

      console.log(`Downloading object: ${objectKey}`);
      let objectStream;
      try {
        objectStream = s3.getObject(objectParams).createReadStream();
        console.log(`Downloaded object: ${objectKey}`);
      } catch (downloadErr) {
        console.error(`Error downloading object ${objectKey}: ${downloadErr}`);
        return {
          key: objectKey,
          error: `Error downloading object: ${downloadErr.message}`,
        };
      }

      // Determine if the objectKey represents a directory or file
      const isDirectory = objectKey.endsWith('/');
      const localFilePath = path.join(localPath, objectKey);

      if (isDirectory) {
        // Skip writing for directories
        console.log(`Skipping directory creation for: ${localFilePath}`);
        return {
          key: objectKey,
          localPath: localFilePath,
        };
      }

      // Ensure the directory exists before writing the file
      try {
        createDirectories(localFilePath);
      } catch (dirErr) {
        console.error(`Error creating directory ${localFilePath}: ${dirErr}`);
        return {
          key: objectKey,
          error: `Error creating directory: ${dirErr.message}`,
        };
      }

      // Write the file to the local path
      try {
        const fileStream = fs.createWriteStream(localFilePath);
        await new Promise((resolve, reject) => {
          objectStream.pipe(fileStream);
          fileStream.on('finish', resolve);
          fileStream.on('error', reject);
        });
        console.log(`Saved object to: ${localFilePath}`);
      } catch (writeErr) {
        console.error(`Error writing file ${localFilePath}: ${writeErr}`);
        return {
          key: objectKey,
          error: `Error writing file: ${writeErr.message}`,
        };
      }

      return {
        key: objectKey,
        localPath: localFilePath,
      };
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
