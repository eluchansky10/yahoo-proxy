import express from 'express';
import fetch from 'node-fetch';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

// Proxy all requests from the GPT Action to the Yahoo API
app.all('/*', async (req, res) => {
  // Construct the target Yahoo API URL from the incoming request path and query
  const queryString = new URL(req.url, `http://${req.headers.host}`).search;
  const yahooApiUrl = `https://fantasysports.yahooapis.com/fantasy/v2${req.path}${queryString}&format=json`;

  console.log(`Forwarding request to: ${yahooApiUrl}`);

  try {
    const response = await fetch(yahooApiUrl, {
      method: req.method,
      headers: {
        // Forward the Authorization header (Bearer token) from the GPT
        'Authorization': req.headers.authorization,
        'Content-Type': 'application/json',
      },
      // Only include a body for relevant methods
      body: (req.method !== 'GET' && req.method !== 'HEAD') ? JSON.stringify(req.body) : null,
    });
    
    const data = await response.json();

    if (!response.ok) {
      console.error('Yahoo API Error:', data);
      return res.status(response.status).json(data);
    }
    
    res.json(data);
  } catch (error) {
    console.error('API Proxy Error:', error);
    res.status(500).json({ error: 'API Proxy Error' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});