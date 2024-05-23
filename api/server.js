const express = require('express');
const cors = require('cors');
const axios = require('axios');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5173;

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const API_KEY = process.env.REACT_APP_API_KEY;
const BASE_URL = process.env.REACT_APP_BASE_URL;

app.post('/pipeline/assets/stage', async (req, res) => {
  const { count } = req.body;
  try {
    const responses = [];
    for (let i = 0; i < count; i++) {
      const response = await axios.post(`${BASE_URL}/pipeline/assets/stage`, {}, {
        headers: {
          Authorization: `${API_KEY}`
        }
      });
      responses.push(response.data);
    }
    console.log('Stage Responses:', responses);
    res.json({ responses });
  } catch (error) {
    console.error('Error in /pipeline/assets/stage:', error.message);
    if (error.response) {
      res.status(error.response.status).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

app.post('/pipeline/assets/process', async (req, res) => {
  const { key, pipeline } = req.body;
  try {
    const response = await axios.post(`${BASE_URL}/pipeline/assets/process`, `key=${key}&pipeline=${pipeline}`, {
      headers: {
        Authorization: `${API_KEY}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    console.log('Process Response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error in /pipeline/assets/process:', error.message, error.response ? error.response.data : '');
    if (error.response) {
      console.error('Response Data:', error.response.data);
      res.status(error.response.status).json({ error: error.response.data.message });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

app.post('/pipeline/assets/status', async (req, res) => {
  const { taskId } = req.body;
  try {
    const response = await axios.post(`${BASE_URL}/pipeline/assets/status`, { taskId }, {
      headers: {
        Authorization: `${API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    console.log('Status Response:', response.data);
    res.json(response.data);
  } catch (error) {
    console.error('Error in /pipeline/assets/status:', error.message, error.response ? error.response.data : '');
    if (error.response) {
      res.status(error.response.status).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
