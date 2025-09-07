// New server.js code
import express from 'express';
import fetch from 'node-fetch';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. New route to handle the initial Authorization redirect
app.get('/auth', (req, res) => {
  const yahooAuthUrl = 'https://api.login.yahoo.com/oauth2/request_auth';
  const params = new URLSearchParams(req.query);
  res.redirect(`${yahooAuthUrl}?${params.toString()}`);
});

// 2. New route to handle the Token exchange
app.post('/token', async (req, res) => {
  const yahooTokenUrl = 'https://api.login.yahoo.com/oauth2/get_token';
  
  // Forward the request to Yahoo's token endpoint
  try {
    const response = await fetch(yahooTokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': req.headers.authorization, // Forward the Basic Auth header
      },
      body: new URLSearchParams(req.body).toString(),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return res.status(response.status).json(data);
    }
    
    res.json(data);
  } catch (error) {
    console.error('Error fetching token:', error);
    res.status(500).json({ error: 'Failed to fetch token' });
  }
});


// 3. Original proxy logic for API calls (unchanged logic, just a new path)
app.all('/api/*', async (req, res) => {
  const yahooApiUrl = `https://fantasysports.yahooapis.com/fantasy/v2${req.path.replace('/api', '')}?format=json`;
  
  try {
    const response = await fetch(yahooApiUrl, {
      method: req.method,
      headers: {
        'Authorization': req.headers.authorization, // Forward the Bearer token
        'Content-Type': 'application/json',
      },
      body: req.method !== 'GET' ? JSON.stringify(req.body) : null,
    });
    
    const data = await response.json();

    if (!response.ok) {
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