// Import required AWS SDK clients and commands for Node.js
const { S3Client, GetObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const config = require('../config.json'); // Load configuration
require('dotenv').config(); 

module.exports = {
    getTempS3URL,
    postTempS3URL
};


// Set the parameters
const bucketName = config.bucket.name; // The name of the bucket
const expires = config.bucket.signed_expire_time_s; // Time in seconds before the presigned URL expires
const region = config.bucket.AWS_REGION; // The region of the bucket

// Create an S3 client
const s3Client = new S3Client({
    region: region
});


// Function to generate a presigned URL
async function getTempS3URL(objectKey) {
    // console.log("getTempS3URL CALLED");
    //console.log("objectKey: ", objectKey);
    try {
        // Create a command to get the object
        const command = new GetObjectCommand({
            Bucket: bucketName,
            Key: objectKey
        });

        // Create and return the presigned URL
        const url = await getSignedUrl(s3Client, command, { expiresIn: expires });
        //console.log("Presigned URL: ", url);
        return url;
    } catch (err) {
        console.error("Error creating presigned URL", err);
        return null;
    }
}

// Function to generate a presigned URL and unique key for posting an image object to S3
async function postTempS3URL() {
    try {
        // Generate a unique key for the image object
        const objectKey = generateUniqueKey();

        // Create a command to put the object
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: objectKey
        });

        // Create and return the presigned URL
        const url = await getSignedUrl(s3Client, command, { expiresIn: expires });
        console.log("Presigned URL: ", url);

        return {
            url,
            objectKey
        };
    } catch (err) {
        console.error("Error generating presigned URL", err);
        return null;
    }
}

// Function to generate a unique key for the image object
function generateUniqueKey() {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    return `${timestamp}_${randomString}`;
}


