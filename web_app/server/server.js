const express = require('express');
const fs = require('fs');
const cors = require('cors');

const {DynamoDBClient, ScanCommand} = require("@aws-sdk/client-dynamodb");
const {S3Client, GetObjectCommand} = require("@aws-sdk/client-s3");
const {ChromaClient} = require("chromadb");

const configFile = fs.readFileSync('server/config.json', 'utf8');
const config = JSON.parse(configFile);

const app = express();
const port = config.serverPort;

// Enable CORS
app.use(cors());

// Create a DynamoDB client instance
const dynamoDBClient = new DynamoDBClient({
  region: config.awsRegion, // Specify the AWS region
});

// Define the DynamoDB table name
const tableName = config.dynamoDbTableName;

// Route Handler for Home Page
app.get('/', (req, res) => {
  res.send('Welcome to the IMDB Actor API!');
});


app.get('/query', async (req, res) => {
  const actorName = req.query.name;
  if (!actorName) {
    return res.status(400).json({ error: "Name is required." });
  }

  try {
    const scanParams = {
      TableName: tableName,
      FilterExpression: "actorName = :name",
      ExpressionAttributeValues: {
        ":name": { S: actorName },
      },
    };

    const dynamoResponse = await dynamoDBClient.send(new ScanCommand(scanParams));
    if (dynamoResponse.Items.length === 0) {
      return res.status(404).json({ error: "Actor not found." });
    }

    const s3Url = dynamoResponse.Items[0].s3Url.S;
    const urlSegments = s3Url.split('/');
    const imageId = urlSegments[urlSegments.length - 1]; 

    const vectorEmbedding = await getS3Object(config.s3BucketName, imageId);

    const chromaClient = new ChromaClient();
    const collection = await chromaClient.collection(config.chromaDbCollectionName);
    const queryResults = await collection.query(vectorEmbedding, 5);
    
    const imagePaths = queryResults.map(item => item.localImagePath);

    res.json(imagePaths);
  } catch (error) {
    console.error("Error querying databases:", error);
    res.status(500).json({ error: "Error querying databases." });
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Function to get an object from S3
async function getS3Object(bucket, objectKey) {
  // Initialize the S3 client with your region
  const s3Client = new S3Client({region: config.awsRegion});

  // Create the parameters for the GetObjectCommand
  const getObjectParams = {
    Bucket: bucket,
    Key: objectKey,
  };

  // Create a new instance of the GetObjectCommand with the parameters
  const command = new GetObjectCommand(getObjectParams);

  try {
    // Use the S3 client to send the command
    const data = await s3Client.send(command);
    return await streamToString(data.Body);
  } catch (error) {
    console.error("Error fetching object from S3:", error);
    throw error; // Rethrow or handle as needed
  }
}

// Helper function to convert a stream to a string (if needed)
async function streamToString(stream) {
  const chunks = [];
  return new Promise((resolve, reject) => {
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
  });
}
