import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';

const app = express();
app.use(cors());
app.use(express.json());

// Test endpoint to verify server is running
app.get('/test', (req, res) => {
  res.json({ message: 'Proxy server is running!', timestamp: new Date().toISOString() });
});

app.get('/validate-idea', async (req, res) => {
  try {
    const response = await fetch(`https://n8n.srv922914.hstgr.cloud/webhook/validate_idea?${new URLSearchParams(req.query)}`, {
      method: 'GET'
    });
    
    // Check if response is ok
    if (!response.ok) {
      console.error(`External service error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ 
        error: `External service error: ${response.status} ${response.statusText}` 
      });
    }

    // Get response text first to check if it's empty
    const responseText = await response.text();
    console.log(responseText);
    
    if (!responseText || responseText.trim() === '') {
      console.error('External service returned empty response');
      return res.status(500).json({ 
        error: 'External service returned empty response',
        message: 'The idea validation service is currently unavailable. Please try again later.'
      });
    }

    // Try to parse JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.error('Response text:', responseText);
      return res.status(500).json({ 
        error: 'Invalid response from external service',
        message: 'The idea validation service returned an invalid response. Please try again later.'
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to forward request to n8n webhook',
      message: 'Unable to connect to the idea validation service. Please check your internet connection and try again.'
    });
  }
});

// Removed duplicate POST endpoint - keeping only GET endpoint

app.post('/generate-asismap', async (req, res) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ 
        error: 'Prompt is required',
        message: 'Please provide a prompt for the As is Map generation.'
      });
    }

    console.log('As is Map GET request payload:', { prompt });

        // Use POST method with prompt in request body
    const webhookUrl = 'https://n8n.srv922914.hstgr.cloud/webhook/Asismap';
    console.log(`Calling webhook URL: ${webhookUrl} with POST method`);
    console.log(`Request body:`, { prompt });
    
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Solve-Innovate-Proxy/1.0'
      },
      body: JSON.stringify({ "prompt": prompt })
    });
    
    const responseText = await response.text();
    
    console.log('As is Map response status:', response.status);
    console.log('As is Map response headers:', Object.fromEntries(response.headers.entries()));
    console.log('As is Map response text:', responseText);
    
    // Check if response is ok
    if (!response.ok) {
      console.error(`External service error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ 
        error: `External service error: ${response.status} ${response.statusText}`,
        details: responseText || 'No response body'
      });
    }

    if (!responseText || responseText.trim() === '') {
      console.error('External service returned empty response');
      return res.status(500).json({ 
        error: 'External service returned empty response',
        message: 'The As is Map generation service is currently unavailable. Please try again later.',
        suggestion: 'Check if the n8n webhook is properly configured to handle the request'
      });
    }

    // Try to parse JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.error('Response text:', responseText);
      return res.status(500).json({ 
        error: 'Invalid response from external service',
        message: 'The As is Map generation service returned an invalid response. Please try again later.',
        rawResponse: responseText
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to forward request to n8n webhook',
      message: 'Unable to connect to the As is Map generation service. Please check your internet connection and try again.',
      details: error.message
    });
  }
});

app.post('/generate-deep-empathy', async (req, res) => {
  try {
    const {
      ["Prioritized Pain Point"]: prioritizedPainPoint,
      ["Pain Point Description"]: painPointDescription,
      ["Selected Extreme User"]: selectedExtremeUser
    } = req.body || {};

    if (!prioritizedPainPoint || !painPointDescription || !selectedExtremeUser) {
      return res.status(400).json({
        error: 'Missing fields',
        message: 'Please provide Prioritized Pain Point, Pain Point Description, and Selected Extreme User.'
      });
    }

    const webhookUrl = 'https://n8n.srv922914.hstgr.cloud/webhook/UniversalDeepEmpathy';
    console.log(`Calling webhook URL: ${webhookUrl} with POST method`);
    console.log('Request body:', {
      'Prioritized Pain Point': prioritizedPainPoint,
      'Pain Point Description': painPointDescription,
      'Selected Extreme User': selectedExtremeUser
    });

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'Solve-Innovate-Proxy/1.0'
      },
      body: JSON.stringify({
        'Prioritized Pain Point': prioritizedPainPoint,
        'Pain Point Description': painPointDescription,
        'Selected Extreme User': selectedExtremeUser
      })
    });

    const responseText = await response.text();
    console.log('Deep Empathy response status:', response.status);
    console.log('Deep Empathy response headers:', Object.fromEntries(response.headers.entries()));
    console.log('Deep Empathy response text:', responseText);

    if (!response.ok) {
      console.error(`External service error: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({
        error: `External service error: ${response.status} ${response.statusText}`,
        details: responseText || 'No response body'
      });
    }

    if (!responseText || responseText.trim() === '') {
      console.error('External service returned empty response');
      return res.status(500).json({
        error: 'External service returned empty response',
        message: 'The Deep Empathy service is currently unavailable. Please try again later.'
      });
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Failed to parse JSON response:', parseError);
      console.error('Response text:', responseText);
      return res.status(500).json({
        error: 'Invalid response from external service',
        message: 'The Deep Empathy service returned an invalid response. Please try again later.',
        rawResponse: responseText
      });
    }

    res.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({
      error: 'Failed to forward request to n8n webhook',
      message: 'Unable to connect to the Deep Empathy service. Please check your internet connection and try again.',
      details: error.message
    });
  }
});

const PORT = 4000;
app.listen(PORT, () => console.log(`Proxy server running on port ${PORT}`));
