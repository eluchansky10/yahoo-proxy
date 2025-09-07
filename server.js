import express from 'express';
import fetch from 'node-fetch';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Proxy all requests from the GPT Action to the Yahoo API
app.all('/*', async (req, res) => {
  const queryString = new URL(req.url, `http://${req.headers.host}`).search;
  const yahooApiUrl = `https://fantasysports.yahooapis.com/fantasy/v2${req.path}${queryString}&format=json`;

  console.log(`Forwarding request to: ${yahooApiUrl}`);

  try {
    const response = await fetch(yahooApiUrl, {
      method: req.method,
      headers: {
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json',
      },
      body: (req.method !== 'GET' && req.method !== 'HEAD') ? JSON.stringify(req.body) : null,
    });
    
    // ** START: Error handling fix **
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      // If the response is JSON, parse it and send it back
      const data = await response.json();
      res.status(response.status).json(data);
    } else {
      // If it's not JSON (like an XML error), send it back as plain text
      const textData = await response.text();
      console.error('Received non-JSON response from Yahoo:', textData);
      res.status(response.status).send(textData);
    }
    // ** END: Error handling fix **

  } catch (error) {
    console.error('API Proxy Error:', error);
    res.status(500).json({ error: 'API Proxy Error' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});