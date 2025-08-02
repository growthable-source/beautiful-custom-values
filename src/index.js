require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');

// Import custom modules
const ghlService = require('./services/ghl-service');
const customValuesRoutes = require('./routes/custom-values');

const app = express();
const PORT = process.env.PORT || 3000;

// Security
app.use(helmet());
app.use(cors());

// Body parsing
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Routes
app.use('/api/custom-values', customValuesRoutes);

// OAuth authorization handler (official GHL pattern)
app.get('/authorize-handler', async (req, res) => {
  try {
    const { code, location_id } = req.query;
    
    if (!code || !location_id) {
      return res.status(400).send('Missing authorization code or location ID');
    }

    // Exchange code for token using GHL service
    const tokenData = await ghlService.exchangeCodeForToken(code);
    
    // Store installation data
    await ghlService.storeInstallation(location_id, tokenData);
    
    console.log(`✅ App installed for location: ${location_id}`);
    
    // Redirect to your app's success page
    res.redirect(`/success?locationId=${location_id}`);
    
  } catch (error) {
    console.error('Authorization error:', error);
    res.status(500).send('Authorization failed');
  }
});

// Example webhook handler
app.post('/webhook-handler', (req, res) => {
  try {
    console.log('Webhook received:', req.body);
    
    // Verify webhook signature here if needed
    // Process the webhook event
    
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Serve static files (UI)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../ui/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../ui/dist/index.html'));
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString() 
  });
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
  console.log(`📝 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 OAuth Redirect: ${process.env.GHL_API_DOMAIN || 'https://services.leadconnectorhq.com'}`);
});
