# Node.js Server Documentation

This documentation provides detailed instructions for setting up, configuring, and deploying your Node.js server. This server connects to MongoDB, AWS S3, and Twilio, and includes routes for various functionalities.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Deployed Links](#deployment) 
- [Setup](#setup)
  - [Cloning the Repository](#cloning-the-repository)
  - [Installing Dependencies](#installing-dependencies)
  - [Configuration](#configuration)
  - [Starting the Server](#starting-the-server)
- [Environment Variables](#environment-variables)
  - [Obtaining Environment Variables](#obtaining-environment-variables)
- [Deployment](#deployment)
  - [Deploying to Render](#deploying-to-render)
  - [Deploying to Vercel](#deploying-to-vercel)
- [Usage](#usage)

## Deployment

- **Render.com**: https://theserver-tp6r.onrender.com "This url is currently in use"
- **Vercel.com**: https://the-server-omega.vercel.app

## Prerequisites

Ensure you have the following installed:

- **Node.js**: Download and install Node.js from [nodejs.org](https://nodejs.org/).
- **npm**: npm comes bundled with Node.js. Verify installation by running `npm --version`.

## Setup

### Cloning the Repository

1. Clone the repository to your local machine:
    ```bash
    git clone https://github.com/nepal143/TheServer.git
    cd TheServer
    ```

### Installing Dependencies

2. Install the necessary dependencies:
    ```bash
    npm install
    ```

### Configuration

3. Create a `.env` file in the root directory of your project. This file should contain all the necessary environment variables:

    ```env
    AWS_ACCESS_KEY_ID=your_aws_access_key_id
    AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
    AWS_REGION=your_aws_region
    S3_BUCKET_NAME=your_s3_bucket_name
    TWILIO_AUTH_TOKEN=your_twilio_auth_token
    TWILIO_ACCOUNT_SID=your_twilio_account_sid
    MONGODB_URI=your_mongodb_uri
    TWILIO_PHONE_NUMBER=your_twilio_phone_number
    JWT_SECRET=your_jwt_secret
    ```

### Starting the Server

4. Start the server locally:
    ```bash
    npm run dev
    ```
    The server will start and listen on `http://localhost:8080` by default.

## Environment Variables

Environment variables are used to configure various services and keys for the server. Here’s a brief explanation of each variable:

- **AWS_ACCESS_KEY_ID**: Your AWS access key ID for S3 access.
- **AWS_SECRET_ACCESS_KEY**: Your AWS secret access key for S3 access.
- **AWS_REGION**: The AWS region where your S3 bucket is located (e.g., `us-west-2`).
- **S3_BUCKET_NAME**: The name of your S3 bucket where files will be stored.
- **TWILIO_AUTH_TOKEN**: The authentication token for Twilio API.
- **TWILIO_ACCOUNT_SID**: The account SID for your Twilio account.
- **MONGODB_URI**: The connection URI for your MongoDB database.
- **TWILIO_PHONE_NUMBER**: A Twilio phone number from which SMS or calls will be made.
- **JWT_SECRET**: A secret key for signing JSON Web Tokens.

### Obtaining Environment Variables

- **AWS Access Key ID & Secret Access Key**: These can be obtained by creating an IAM user with appropriate permissions in the AWS Management Console.
- **AWS Region**: Check the AWS Management Console for the region where your S3 bucket is located.
- **S3 Bucket Name**: Create or use an existing S3 bucket in the AWS Management Console.
- **Twilio Auth Token & Account SID**: Log in to your Twilio account and navigate to the console to find these values.
- **MongoDB URI**: Obtain this from your MongoDB Atlas account or the MongoDB connection settings.
- **Twilio Phone Number**: Purchase a phone number from Twilio’s dashboard.
- **JWT Secret**: Generate a secure secret for JWT signing.

## Deployment

### Deploying to Render

1. **Create a New Service**:
    - Log in to Render at [render.com](https://render.com/).
    - Click on "New" and select "Web Service."

2. **Connect Your GitHub Repository**:
    - Authorize Render to access your GitHub account and select the repository.

3. **Set Build and Start Commands**:
    - **Build Command**: `npm install`
    - **Start Command**: `npm run dev`

4. **Add Environment Variables**:
    - Go to the "Environment" tab in Render and add all required environment variables.

5. **Deploy**:
    - Click "Create Web Service" and Render will build and deploy your application.

### Deploying to Vercel

1. **Create a New Project**:
    - Log in to Vercel at [vercel.com](https://vercel.com/).
    - Click "New Project" and import your GitHub repository.

2. **Set Build and Start Commands**:
    - **Build Command**: `npm install`
    - **Start Command**: `npm run dev`

3. **Add Environment Variables**:
    - Go to the "Environment Variables" section in the project settings and add all required variables.

4. **Deploy**:
    - Click "Deploy" and Vercel will build and deploy your application.

## Usage

Once deployed, The server can be accessed via the provided URL from Render or Vercel. You can interact with the API endpoints as specified in the application’s documentation.
