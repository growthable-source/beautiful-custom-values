require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage for installations (use database in production)
const installations = new Map();

// Security
app.use(helmet());
app.use(cors());

// Body parsing
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// OAuth authorization handler (official GHL pattern)
app.get('/authorize-handler', async (req, res) => {
  try {
    const { code, location_id } = req.query;
    
    if (!code || !location_id) {
      return res.status(400).send('Missing authorization code or location ID');
    }

    console.log(`📋 Received OAuth callback - Location: ${location_id}`);
    
    // Store basic installation info (in production, store tokens properly)
    installations.set(location_id, {
      code,
      installedAt: new Date().toISOString()
    });
    
    console.log(`✅ App installed for location: ${location_id}`);
    
    // Serve a simple success page
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Integration Successful</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
          .success { color: #28a745; font-size: 24px; margin-bottom: 20px; }
          .button { background: #007bff; color: white; padding: 12px 24px; border: none; border-radius: 5px; text-decoration: none; display: inline-block; }
        </style>
      </head>
      <body>
        <div class="success">✅ Successfully connected to GoHighLevel!</div>
        <p>Location ID: ${location_id}</p>
        <a href="/form?locationId=${location_id}" class="button">Continue to Form</a>
      </body>
      </html>
    `);
    
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).send('Authorization failed');
  }
});

// Serve the form page
app.get('/form', (req, res) => {
  const { locationId } = req.query;
  
  if (!locationId) {
    return res.status(400).send('Location ID required');
  }

  // Simple form page
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Custom Values Form</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .form-group { margin-bottom: 20px; }
        label { display: block; margin-bottom: 5px; font-weight: bold; }
        input, select, textarea { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; box-sizing: border-box; }
        button { background: #28a745; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px; }
        button:hover { background: #218838; }
        .success { color: #28a745; font-weight: bold; }
        .error { color: #dc3545; font-weight: bold; }
      </style>
    </head>
    <body>
      <h1>📝 Custom Values Form</h1>
      <p>Location ID: <strong>${locationId}</strong></p>
      
      <form id="customValuesForm">
        <div class="form-group">
          <label for="businessName">Business Name *</label>
          <input type="text" id="businessName" name="businessName" required>
        </div>
        
        <div class="form-group">
          <label for="industry">Industry</label>
          <select id="industry" name="industry">
            <option value="">Select industry</option>
            <option value="retail">Retail</option>
            <option value="healthcare">Healthcare</option>
            <option value="technology">Technology</option>
            <option value="finance">Finance</option>
            <option value="education">Education</option>
            <option value="other">Other</option>
          </select>
        </div>
        
        <div class="form-group">
          <label for="contactName">Contact Name *</label>
          <input type="text" id="contactName" name="contactName" required>
        </div>
        
        <div class="form-group">
          <label for="email">Email *</label>
          <input type="email" id="email" name="email" required>
        </div>
        
        <div class="form-group">
          <label for="phone">Phone</label>
          <input type="tel" id="phone" name="phone">
        </div>
        
        <div class="form-group">
          <label for="website">Website</label>
          <input type="url" id="website" name="website">
        </div>
        
        <div class="form-group">
          <label for="notes">Additional Notes</label>
          <textarea id="notes" name="notes" rows="3"></textarea>
        </div>
        
        <button type="submit">💾 Save to GoHighLevel</button>
      </form>
      
      <div id="message" style="margin-top: 20px;"></div>
      
      <script>
        document.getElementById('customValuesForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const messageDiv = document.getElementById('message');
          messageDiv.innerHTML = '⏳ Saving...';
          
          const formData = new FormData(e.target);
          const data = Object.fromEntries(formData.entries());
          data.locationId = '${locationId}';
          
          try {
            const response = await fetch('/api/submit-custom-values', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok) {
              messageDiv.innerHTML = '<div class="success">✅ Successfully saved to GoHighLevel!</div>';
              e.target.reset();
            } else {
              messageDiv.innerHTML = '<div class="error">❌ Error: ' + (result.error || 'Unknown error') + '</div>';
            }
          } catch (error) {
            messageDiv.innerHTML = '<div class="error">❌ Network error: ' + error.message + '</div>';
          }
        });
      </script>
    </body>
    </html>
  `);
});

// API endpoint to submit custom values
app.post('/api/submit-custom-values', async (req, res) => {
  try {
    const { locationId, ...customValues } = req.body;
    
    if (!locationId) {
      return res.status(400).json({ error: 'Location ID is required' });
    }

    // Check if app is installed for this location
    if (!installations.has(locationId)) {
      return res.status(400).json({ error: 'App not installed for this location' });
    }

    // In a real app, you would:
    // 1. Use the stored access token for this location
    // 2. Make actual API calls to GHL to create custom values
    // 3. Handle token refresh if needed
    
    // For now, just simulate success
    console.log('📝 Custom values to save:', customValues);
    console.log('📍 For location:', locationId);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    res.json({
      success: true,
      message: 'Custom values saved successfully',
      data: customValues
    });

  } catch (error) {
    console.error('Submit error:', error);
    res.status(500).json({ 
      error: 'Failed to save custom values',
      details: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    installations: installations.size
  });
});

// Root route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>GHL Custom Values App</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; text-align: center; }
        .container { max-width: 600px; margin: 0 auto; }
        h1 { color: #333; }
        .info { background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🚀 GHL Custom Values Integration</h1>
        <div class="info">
          <p>This app integrates with GoHighLevel to collect and store custom values.</p>
          <p><strong>OAuth Redirect URL:</strong> <code>/authorize-handler</code></p>
          <p><strong>Webhook URL:</strong> <code>/webhook-handler</code></p>
          <p><strong>Health Check:</strong> <a href="/health">/health</a></p>
        </div>
        <p>Active installations: ${installations.size}</p>
      </div>
    </body>
    </html>
  `);
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message
  });
});

app.listen(PORT, () => {
  console.log(`🚀 GHL Custom Values App running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 OAuth Redirect: ${process.env.GHL_API_DOMAIN || 'https://services.leadconnectorhq.com'}`);
});
