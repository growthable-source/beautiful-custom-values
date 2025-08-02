const axios = require('axios');

class GHLService {
  constructor() {
    this.baseURL = process.env.GHL_API_DOMAIN || 'https://services.leadconnectorhq.com';
    this.clientId = process.env.GHL_APP_CLIENT_ID;
    this.clientSecret = process.env.GHL_APP_CLIENT_SECRET;
    
    // In-memory storage (use database in production)
    this.installations = new Map();
  }

  // Exchange authorization code for access token
  async exchangeCodeForToken(code) {
    try {
      const response = await axios.post(`${this.baseURL}/oauth/token`, {
        client_id: this.clientId,
        client_secret: this.clientSecret,
        grant_type: 'authorization_code',
        code: code
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      return response.data;
    } catch (error) {
      console.error('Token exchange error:', error.response?.data || error.message);
      throw new Error('Failed to exchange authorization code');
    }
  }

  // Store installation data
  async storeInstallation(locationId, tokenData) {
    this.installations.set(locationId, {
      ...tokenData,
      installedAt: new Date().toISOString()
    });
  }

  // Get installation for location
  async getInstallation(locationId) {
    return this.installations.get(locationId);
  }

  // Make authenticated API request
  async makeRequest(method, endpoint, data = null, locationId = null) {
    try {
      const installation = await this.getInstallation(locationId);
      
      if (!installation) {
        throw new Error('App not installed for this location');
      }

      const config = {
        method,
        url: `${this.baseURL}${endpoint}`,
        headers: {
          'Authorization': `Bearer ${installation.access_token}`,
          'Content-Type': 'application/json',
          'Version': '2021-07-28'
        }
      };

      if (data) {
        config.data = data;
      }

      const response = await axios(config);
      return response.data;
    } catch (error) {
      console.error('API request error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Create or update custom values
  async updateCustomValues(locationId, customValues) {
    const results = [];
    
    for (const [key, value] of Object.entries(customValues)) {
      try {
        // Try to create custom value first
        const result = await this.makeRequest(
          'POST',
          `/locations/${locationId}/customValues`,
          { name: key, value: String(value) },
          locationId
        );
        results.push({ key, status: 'created', result });
      } catch (error) {
        // If it exists, try to update it
        if (error.response?.status === 422) {
          try {
            const result = await this.makeRequest(
              'PUT',
              `/locations/${locationId}/customValues/${key}`,
              { name: key, value: String(value) },
              locationId
            );
            results.push({ key, status: 'updated', result });
          } catch (updateError) {
            results.push({ key, status: 'error', error: updateError.message });
          }
        } else {
          results.push({ key, status: 'error', error: error.message });
        }
      }
    }
    
    return results;
  }

  // Get custom values for location
  async getCustomValues(locationId) {
    return await this.makeRequest('GET', `/locations/${locationId}/customValues`, null, locationId);
  }
}

module.exports = new GHLService();
