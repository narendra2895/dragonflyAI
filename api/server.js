require('dotenv').config({ path: '../.env' }); // Load environment variables from .env file

const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5173; // Port on which the server will run

// Middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const API_KEY = process.env.API_KEY;
const BASE_URL = process.env.BASE_URL;

// Endpoint to stage assets in the pipeline
app.post('/pipeline/assets/stage', async (req, res) => {
  const { count } = req.body;
  try {
    const requests = Array.from({ length: count }, () =>
      axios.post(`${BASE_URL}/pipeline/assets/stage`, {}, {
        headers: { Authorization: API_KEY }
      })
    );

    // Wait for all requests to complete
    const responses = await Promise.all(requests);

    // Extract and send response data
    const responseData = responses.map(response => response.data);
    console.log('Stage Responses:', responseData);
    res.json({ responses: responseData });
  } catch (error) {
    console.error('Error in /pipeline/assets/stage:', error.message);
    handleAxiosError(error, res);
  }
});

// Endpoint to process assets in the pipeline
app.post('/pipeline/assets/process', async (req, res) => {
  const { key, pipeline } = req.body;
  try {
    const response = await axios.post(`${BASE_URL}/pipeline/assets/process`, `key=${key}&pipeline=${pipeline}`, {
      headers: {
        Authorization: API_KEY,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    console.log('Process Response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error in /pipeline/assets/process:', error.message);
    handleAxiosError(error, res);
  }
});

// Endpoint to get the status of assets in the pipeline
app.post('/pipeline/assets/status', async (req, res) => {
  const { taskId } = req.body;
  try {
    const response = await axios.post(`${BASE_URL}/pipeline/assets/status`, { taskId }, {
      headers: {
        Authorization: API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('Status Response:', response.data);

    const title = response.data.title || 'status';

    // Set headers to prompt file download
    res.setHeader('Content-Disposition', `attachment; filename=${title}.json`);
    res.setHeader('Content-Type', 'application/json');

    res.json(response.data);
  } catch (error) {
    console.error('Error in /pipeline/assets/status:', error.message);
    handleAxiosError(error, res);
  }
});

// Function to handle Axios errors
const handleAxiosError = (error, res) => {
  if (error.response) {
    res.status(error.response.status).json({ error: error.response.data.message });
  } else {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
