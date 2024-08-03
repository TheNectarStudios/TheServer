const express = require('express');
const multer = require('multer');
const AWS = require('aws-sdk');
const fs = require('fs');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const userRoutes = require('./userRoutes');
const ParentRoute = require('./ParentProperty');
const downloadRoutes = require('./downloadRoute');
const OrganisationRoute = require('./Organisation');
const ChildPropertyRoute = require('./ChildProperty');
const uploadRoutes = require('./uploadRoutes');
const bookingRoutes = require('./bookingRoute');
const mongoose = require('mongoose');
const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

const app = express();

// Middleware setup
app.use(bodyParser.json());
app.use(cors({
  origin: '*', // Adjust according to your needs
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders: 'Content-Type,Authorization'
}));

// MongoDB connection
const mongoUri = process.env.MONGODB_URI;
mongoose.connect(mongoUri, {
  useNewUrlParser: true, // Deprecated, no effect in v4+
  useUnifiedTopology: true, // Deprecated, no effect in v4+
  serverSelectionTimeoutMS: 30000,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// AWS S3 configuration
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
const s3 = new AWS.S3();

// Agora configuration
const AGORA_APP_ID = process.env.AGORA_APP_ID;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

// Multer configuration
const storage = multer.memoryStorage(); // Store files in memory
const upload = multer({ storage: storage });

// Routes
app.use('/download', downloadRoutes);
app.use('/organisation', OrganisationRoute);
app.use('/parentproperty', ParentRoute);
app.use('/childproperty', ChildPropertyRoute);
app.use('/upload', uploadRoutes);
app.use('/slots', bookingRoutes);
app.use('/user', userRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(500).send("An unexpected error occurred.");
});

// Agora token generation
app.post('/get-agora-token', (req, res) => {
  const { user } = req.body;
  const channelName = `video_call_${user}`;
  const uid = 0; // UID can be set to 0 for the default setting
  const role = RtcRole.PUBLISHER;

  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

  const token = RtcTokenBuilder.buildTokenWithUid(
    AGORA_APP_ID,
    AGORA_APP_CERTIFICATE,
    channelName,
    uid,
    role,
    privilegeExpiredTs
  );
  res.json({ channel: channelName, token });
});

// Handle multiple file uploads
app.post('/upload', upload.any(), (req, res) => {
  const { organisationName, parentpropertyName, childPropertyName } = req.body;

  if (!organisationName || !parentpropertyName || !req.files || req.files.length === 0) {
    return res.status(400).send("Required information or files not provided.");
  }

  const folderName = `${organisationName}/${parentpropertyName}/${childPropertyName}/model`;

  const uploadPromises = req.files.map(file => {
    if (!file.buffer) {
      return Promise.reject(new Error('File buffer is missing.'));
    }

    const params = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: `${folderName}/${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype
    };

    return s3.upload(params).promise()
      .then(data => data.Location)
      .catch(err => {
        console.error(`Error uploading ${file.originalname} to S3:`, err);
        throw err;
      });
  });

  Promise.all(uploadPromises)
    .then(locations => res.status(200).send(`Files uploaded successfully. ${locations.join(', ')}`))
    .catch(err => {
      console.error("Error uploading files:", err);
      res.status(500).send("Error uploading files");
    });
});

// Handle single image upload
app.post('/upload-image', upload.single('file'), (req, res) => {
  const { organisationName, parentPropertyName, childPropertyName } = req.body;

  if (!organisationName || !parentPropertyName || !childPropertyName || !req.file) {
    return res.status(400).send("Required information or file not provided.");
  }

  const file = req.file;
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `models/${organisationName}/${parentPropertyName}/${childPropertyName}/thumbnails/${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype
  };

  s3.upload(params, (err, data) => {
    if (err) {
      console.error("Error uploading file to S3:", err);
      return res.status(500).send("Error uploading file to S3.");
    }

    res.status(200).send(`File uploaded successfully to S3: ${data.Location}`);
  });
});

// Handle panorama image upload
app.post('/upload-image-panaroma', upload.single('file'), (req, res) => {
  const { organisationName, parentPropertyName, childPropertyName } = req.body;

  if (!organisationName || !parentPropertyName || !childPropertyName || !req.file) {
    return res.status(400).send("Required information or file not provided.");
  }

  const file = req.file;
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `${organisationName}/${parentPropertyName}/${childPropertyName}/PanaromaImages/${file.originalname}`,
    Body: file.buffer,
    ContentType: file.mimetype
  };

  s3.upload(params, (err, data) => {
    if (err) {
      console.error("Error uploading file to S3:", err);
      return res.status(500).send("Error uploading file to S3.");
    }

    res.status(200).send(`File uploaded successfully to S3: ${data.Location}`);
  });
});

// Save scene data
app.post('/save-positions-rotations', upload.none(), (req, res) => {
  const { organisationName, parentPropertyName, childPropertyName, hotspots } = req.body;

  if (!organisationName || !parentPropertyName || !childPropertyName || !hotspots) {
    return res.status(400).send("Required information not provided.");
  }

  const folderName = `${organisationName}/${parentPropertyName}/${childPropertyName}`;
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

    res.status(200).send(`JSON uploaded successfully to S3: ${data.Location}`);
  }); 
});

// Download a folder from S3
app.post('/download-folder', upload.none(), (req, res) => {
  const { username, propertyName } = req.body;

  if (!username || !propertyName) {
    return res.status(400).send("Required information not provided.");
  }

  const folderName = `models/${username}_${propertyName}`;
  const localFolderPath = path.join(__dirname, 'downloads', username, propertyName);

  // Ensure the local directory exists
  fs.mkdirSync(localFolderPath, { recursive: true });

  // List objects in the specified S3 folder
  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Prefix: folderName,
  };

  s3.listObjectsV2(params, (err, data) => {
    if (err) {
      console.error("Error listing objects in S3:", err);
      return res.status(500).send("Error listing objects in S3.");
    }

    if (data.Contents.length === 0) {
      return res.status(404).send("No files found in the specified directory.");
    }

    const downloadPromises = data.Contents.map(object => {
      const objectKey = object.Key;
      const localFilePath = path.join(localFolderPath, path.basename(objectKey));

      const file = fs.createWriteStream(localFilePath);
      const downloadParams = {
        Bucket: process.env.S3_BUCKET_NAME,
        Key: objectKey,
      };

      return new Promise((resolve, reject) => {
        s3.getObject(downloadParams)
          .createReadStream()
          .pipe(file)
          .on('close', resolve)
          .on('error', reject);
      });
    });

    Promise.all(downloadPromises)
      .then(() => res.status(200).send(`Folder downloaded successfully to ${localFolderPath}`))
      .catch(err => {
        console.error("Error downloading files from S3:", err);
        res.status(500).send("Error downloading files from S3.");
      });
  });
});

// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
