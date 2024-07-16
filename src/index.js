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
const mongoose = require('mongoose') ;
const app = express();
app.use(bodyParser.json());
app.use(cors()) ; 
const mongoUri = process.env.MONGODB_URI; 
mongoose.connect(mongoUri, {
  useNewUrlParser: true, 
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));
const port = process.env.PORT || 3000;
app.use('/download', downloadRoutes);
app.use('/organisation' , OrganisationRoute);
app.use('/parentproperty' , ParentRoute);
app.use("/childproperty" , ChildPropertyRoute);
app.use('/upload', uploadRoutes); // Use upload routes

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

// Global error handler
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);
  res.status(500).send("An unexpected error occurred.");
});

// Route to handle multiple file uploads (existing functionality)
app.post('/upload', upload.fields([{ name: 'model' }, { name: 'texture' }]), (req, res) => {
  const { directoryPath, organisationName , parentpropertyName , childPropertyName } = req.body;
  // console.log(`Directory Path: ${directoryPath}, Username: ${}, Property Name: ${parentpropertyName}`);
  console.log(`Directory Path: ${directoryPath}, Organisation Name: ${organisationName}, Parent Property Name: ${parentpropertyName}, Child Property Name: ${childPropertyName}`);

  if (!directoryPath || !organisationName || !parentpropertyName) {
    return res.status(400).send("Required information not provided.");
  }
 
 
    const folderName = `${organisationName}/${parentpropertyName}/${childPropertyName}/model`;

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
app.post('/upload-image', upload.single('file'), (req, res) => {
  console.log("Received request to upload image.");
  let { organisationName, parentPropertyName, childPropertyName  } = req.body;
  // console.log(`Username: ${organisationName}, Property Name: ${parentPropertyName}, Folder Name: ${childPropetyName}`);

  if (!organisationName || !parentPropertyName || !childPropertyName ) {
    return res.status(400).send("Required information not provided.");
  }

  const file = req.file;
  if (!file) {
    return res.status(400).send("No file uploaded.");
  }

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `models/${organisationName}/${parentPropertyName}/${childPropertyName}/thumbnails/${file.originalname}`,
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
app.post('/upload-image-panaroma', upload.single('file'), (req, res) => {
  console.log("Received request to upload image.");
  let { organisationName, parentPropertyName, childPropertyName  } = req.body;
  console.log(`Organisation Name: ${organisationName}, Parent Property Name: ${parentPropertyName}, Child Property Name: ${childPropertyName}`);

  if (!organisationName || !parentPropertyName || !childPropertyName) {
    return res.status(400).send("Required information not provided.");
  }

  const file = req.file;
  if (!file) {
    return res.status(400).send("No file uploaded.");
  }

  const params = {
    Bucket: process.env.S3_BUCKET_NAME,
    Key: `${organisationName}/${parentPropertyName}/${childPropertyName}/PanaromaImages/${file.originalname}`,
    Body: fs.createReadStream(file.path),
  };

  s3.upload(params, (err, data) => {
    if (err) {
      console.error("Error uploading file to S3:", err);
      return res.status(500).send("Error uploading file to S3.");
    }

    console.log(`File uploaded successfully to S3: ${data.Location}`);
    fs.unlinkSync(req.file.path); // Delete the file from the local storage after uploading
    res.status(200).send(`File uploaded successfully to S3: ${data.Location}`);
  });
});


// Route to handle saving scene data (positions and rotations)
app.post('/save-positions-rotations', (req, res) => {
  let { organisationName, parentPropertyName, childPropertyName, hotspots } = req.body; 

  console.log(`Request Body: ${JSON.stringify(req.body)}`);
  // console.log(`Username: ${username}, Property Name: ${propertyName}`); 
 
  if (typeof hotspots === 'string') {
    try {
      hotspots = JSON.parse(hotspots);
    } catch (err) {
      console.error("Error parsing hotspots JSON:", err);
      return res.status(400).send("Invalid hotspots JSON format.");
    }
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

    console.log(`JSON uploaded successfully to S3: ${data.Location}`);
    res.status(200).send(`JSON uploaded successfully to S3: ${data.Location}`);
  });
});

// Route to handle downloading a folder from S3
app.post('/download-folder', (req, res) => {
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
      .then(() => {
        res.status(200).send(`Folder downloaded successfully to ${localFolderPath}`);
      })
      .catch(err => {
        console.error("Error downloading files from S3:", err);
        res.status(500).send("Error downloading files from S3.");
      });
  });
}); 

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
 