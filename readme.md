# GoHighLevel Custom Values Integration App

A marketplace app that allows users to submit multi-step form data with image uploads to GoHighLevel custom values via OAuth2 integration.

## Features

- 🔐 OAuth2 integration with GoHighLevel marketplace
- 📝 Multi-step form with various input types
- 🖼️ Image upload support via Cloudinary
- 🎨 Modern, responsive UI
- ⚡ Deploy-ready for Render

## Quick Deploy to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

1. Click the deploy button above
2. Connect your GitHub account
3. Set your environment variables
4. Deploy!

## Environment Variables

Set these in Render dashboard or your `.env` file:

```env
GHL_APP_CLIENT_ID=your_client_id
GHL_APP_CLIENT_SECRET=your_client_secret
GHL_APP_SSO_KEY=your_sso_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
