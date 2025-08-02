const express = require('express');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const ghlService = require('../services/ghl-service');

const router = express.Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Submit custom values with images
router.post('/submit', upload.fields([
  { name: 'businessLogo', maxCount: 1 },
  { name: 'additionalImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const { locationId, ...formData } = req.body;
    
    if (!locationId) {
      return res.status(400).json({ error: 'Location ID is required' });
    }

    // Upload images to Cloudinary
    const customValues = { ...formData };
    
    if (req.files?.businessLogo?.[0]) {
      const logoUrl = await uploadToCloudinary(req.files.businessLogo[0], 'business-logos');
      customValues.businessLogoUrl = logoUrl;
    }

    if (req.files?.additionalImage?.[0]) {
      const imageUrl = await uploadToCloudinary(req.files.additionalImage[0], 'additional-images');
      customValues.additionalImageUrl = imageUrl;
    }

    // Update custom values in GHL
    const results = await ghlService.updateCustomValues(locationId, customValues);
    
    console.log(`✅ Custom values updated for location: ${locationId}`);
    
    res.json({
      success: true,
      message: 'Custom values updated successfully',
      results
    });

  } catch (error) {
    console.error('Custom values submission error:', error);
    res.status(500).json({ 
      error: 'Failed to update custom values',
      details: error.message
    });
  }
});

// Get custom values for location
router.get('/:locationId', async (req, res) => {
  try {
    const { locationId } = req.params;
    const customValues = await ghlService.getCustomValues(locationId);
    
    res.json(customValues);
  } catch (error) {
    console.error('Get custom values error:', error);
    res.status(500).json({ 
      error: 'Failed to get custom values',
      details: error.message
    });
  }
});

// Helper function to upload to Cloudinary
async function uploadToCloudinary(file, folder) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `ghl-integration/${folder}`,
        resource_type: 'image',
        quality: 'auto',
        fetch_format: 'auto'
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result.secure_url);
        }
      }
    );

    uploadStream.end(file.buffer);
  });
}

module.exports = router;
