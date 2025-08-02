import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Check, Settings, Upload, User, MapPin, Camera, X } from 'lucide-react';

const GHLIntegrationApp = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);

  // OAuth2 configuration (replace with your actual values)
  const CLIENT_ID = 'your-client-id'; // Replace with your actual GHL client ID
  const REDIRECT_URI = 'https://your-app.onrender.com/authorize-handler'; // Official GHL pattern
  const GHL_AUTH_URL = `https://marketplace.gohighlevel.com/oauth/chooselocation?response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&client_id=${CLIENT_ID}&scope=locations/customValues.write locations/customValues.read`;

  // Handle OAuth callback
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const locationId = urlParams.get('locationId');
    
    // Check if we're on the success page after OAuth
    if (locationId && window.location.pathname.includes('success')) {
      sessionStorage.setItem('location_id', locationId);
      setIsAuthenticated(true);
      setCurrentStep(2);
    }
  }, []);

  const initiateOAuth = () => {
    window.location.href = GHL_AUTH_URL;
  };

  const steps = [
    { id: 1, title: 'Connect', description: 'Authorize with GoHighLevel' },
    { id: 2, title: 'Business Info', description: 'Basic business details' },
    { id: 3, title: 'Contact Data', description: 'Contact information' },
    { id: 4, title: 'Preferences', description: 'Settings and preferences' },
    { id: 5, title: 'Review', description: 'Confirm and submit' }
  ];

  const updateFormData = (stepData) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };

  const submitToGHL = async () => {
    setLoading(true);
    try {
      const locationId = sessionStorage.getItem('location_id');
      
      // Create FormData for file uploads
      const formDataToSend = new FormData();
      formDataToSend.append('locationId', locationId);
      
      // Add all text fields
      Object.keys(formData).forEach(key => {
        if (formData[key] && key !== 'businessLogo' && key !== 'additionalImage') {
          formDataToSend.append(key, formData[key]);
        }
      });
      
      // Add image files
      if (formData.businessLogo) {
        formDataToSend.append('businessLogo', formData.businessLogo);
      }
      if (formData.additionalImage) {
        formDataToSend.append('additionalImage', formData.additionalImage);
      }
      
      const response = await fetch('/api/custom-values/submit', {
        method: 'POST',
        body: formDataToSend
      });
      
      if (response.ok) {
        const result = await response.json();
        alert('Data successfully uploaded to GoHighLevel!');
        console.log('Upload result:', result);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Submission error:', error);
      alert('Error uploading data. Please try again.');
    }
    setLoading(false);
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="text-center space-y-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <Settings className="w-12 h-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">Connect to GoHighLevel</h3>
              <p className="text-gray-600 mb-4">
                Securely connect your GoHighLevel account to sync your data
              </p>
              <button
                onClick={initiateOAuth}
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Connecting...' : 'Connect Account'}
              </button>
            </div>
          </div>
        );

      case 2:
        return (
          <BusinessInfoStep 
            data={formData}
            onUpdate={updateFormData}
            onNext={() => setCurrentStep(3)}
          />
        );

      case 3:
        return (
          <ContactDataStep 
            data={formData}
            onUpdate={updateFormData}
            onNext={() => setCurrentStep(4)}
            onBack={() => setCurrentStep(2)}
          />
        );

      case 4:
        return (
          <PreferencesStep 
            data={formData}
            onUpdate={updateFormData}
            onNext={() => setCurrentStep(5)}
            onBack={() => setCurrentStep(3)}
          />
        );

      case 5:
        return (
          <ReviewStep 
            data={formData}
            onSubmit={submitToGHL}
            onBack={() => setCurrentStep(4)}
            loading={loading}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            GoHighLevel Data Sync
          </h1>
          <p className="text-gray-600">
            Seamlessly integrate your data with GoHighLevel
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentStep >= step.id 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'}
                `}>
                  {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    w-16 h-1 mx-2
                    ${currentStep > step.id ? 'bg-blue-600' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2">
            {steps.map(step => (
              <div key={step.id} className="text-xs text-gray-500 text-center w-20">
                {step.title}
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          {renderStep()}
        </div>
      </div>
    </div>
  );
};

// Business Info Step Component
const BusinessInfoStep = ({ data, onUpdate, onNext }) => {
  const [stepData, setStepData] = useState({
    businessName: data.businessName || '',
    industry: data.industry || '',
    website: data.website || '',
    employees: data.employees || ''
  });

  const handleSubmit = () => {
    onUpdate(stepData);
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <User className="w-10 h-10 text-blue-600 mx-auto mb-2" />
        <h3 className="text-xl font-semibold">Business Information</h3>
        <p className="text-gray-600">Tell us about your business</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Name *
          </label>
          <input
            type="text"
            required
            value={stepData.businessName}
            onChange={(e) => setStepData({...stepData, businessName: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter your business name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Industry
          </label>
          <select
            value={stepData.industry}
            onChange={(e) => setStepData({...stepData, industry: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select industry</option>
            <option value="retail">Retail</option>
            <option value="healthcare">Healthcare</option>
            <option value="technology">Technology</option>
            <option value="finance">Finance</option>
            <option value="education">Education</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Website
          </label>
          <input
            type="url"
            value={stepData.website}
            onChange={(e) => setStepData({...stepData, website: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://yourwebsite.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Number of Employees
          </label>
          <select
            value={stepData.employees}
            onChange={(e) => setStepData({...stepData, employees: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select range</option>
            <option value="1-10">1-10</option>
            <option value="11-50">11-50</option>
            <option value="51-200">51-200</option>
            <option value="201-1000">201-1000</option>
            <option value="1000+">1000+</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
      >
        Continue <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
};

// Contact Data Step Component
const ContactDataStep = ({ data, onUpdate, onNext, onBack }) => {
  const [stepData, setStepData] = useState({
    contactName: data.contactName || '',
    email: data.email || '',
    phone: data.phone || '',
    address: data.address || '',
    timezone: data.timezone || ''
  });

  const handleSubmit = () => {
    onUpdate(stepData);
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <MapPin className="w-10 h-10 text-blue-600 mx-auto mb-2" />
        <h3 className="text-xl font-semibold">Contact Information</h3>
        <p className="text-gray-600">Primary contact details</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Name *
          </label>
          <input
            type="text"
            required
            value={stepData.contactName}
            onChange={(e) => setStepData({...stepData, contactName: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Primary contact name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email *
          </label>
          <input
            type="email"
            required
            value={stepData.email}
            onChange={(e) => setStepData({...stepData, email: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="contact@business.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={stepData.phone}
            onChange={(e) => setStepData({...stepData, phone: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+1 (555) 123-4567"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Business Address
          </label>
          <textarea
            value={stepData.address}
            onChange={(e) => setStepData({...stepData, address: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows="3"
            placeholder="Street address, city, state, zip"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Timezone
          </label>
          <select
            value={stepData.timezone}
            onChange={(e) => setStepData({...stepData, timezone: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select timezone</option>
            <option value="America/New_York">Eastern (UTC-5)</option>
            <option value="America/Chicago">Central (UTC-6)</option>
            <option value="America/Denver">Mountain (UTC-7)</option>
            <option value="America/Los_Angeles">Pacific (UTC-8)</option>
            <option value="America/Phoenix">Arizona (UTC-7)</option>
          </select>
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          Continue <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Preferences Step Component
const PreferencesStep = ({ data, onUpdate, onNext, onBack }) => {
  const [stepData, setStepData] = useState({
    marketingOptIn: data.marketingOptIn || false,
    notificationPrefs: data.notificationPrefs || 'email',
    dataRetention: data.dataRetention || '1year',
    customField1: data.customField1 || '',
    customField2: data.customField2 || '',
    businessLogo: data.businessLogo || null,
    additionalImage: data.additionalImage || null
  });

  const handleSubmit = () => {
    onUpdate(stepData);
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Settings className="w-10 h-10 text-blue-600 mx-auto mb-2" />
        <h3 className="text-xl font-semibold">Preferences & Settings</h3>
        <p className="text-gray-600">Customize your experience</p>
      </div>

      <div className="space-y-4">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="marketing"
            checked={stepData.marketingOptIn}
            onChange={(e) => setStepData({...stepData, marketingOptIn: e.target.checked})}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="marketing" className="ml-2 text-sm text-gray-700">
            Opt-in to marketing communications
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notification Preferences
          </label>
          <div className="space-y-2">
            {['email', 'sms', 'both', 'none'].map(option => (
              <label key={option} className="flex items-center">
                <input
                  type="radio"
                  name="notifications"
                  value={option}
                  checked={stepData.notificationPrefs === option}
                  onChange={(e) => setStepData({...stepData, notificationPrefs: e.target.value})}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700 capitalize">{option}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data Retention Period
          </label>
          <select
            value={stepData.dataRetention}
            onChange={(e) => setStepData({...stepData, dataRetention: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="6months">6 months</option>
            <option value="1year">1 year</option>
            <option value="2years">2 years</option>
            <option value="indefinite">Indefinite</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Custom Field 1
          </label>
          <input
            type="text"
            value={stepData.customField1}
            onChange={(e) => setStepData({...stepData, customField1: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional custom data"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Custom Field 2 (Number)
          </label>
          <input
            type="number"
            value={stepData.customField2}
            onChange={(e) => setStepData({...stepData, customField2: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter a number"
          />
        </div>

        <ImageUploadField
          label="Business Logo"
          value={stepData.businessLogo}
          onChange={(file) => setStepData({...stepData, businessLogo: file})}
        />

        <ImageUploadField
          label="Additional Image"
          value={stepData.additionalImage}
          onChange={(file) => setStepData({...stepData, additionalImage: file})}
        />
      </div>

      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={handleSubmit}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          Continue <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Review Step Component
const ReviewStep = ({ data, onSubmit, onBack, loading }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <Upload className="w-10 h-10 text-blue-600 mx-auto mb-2" />
        <h3 className="text-xl font-semibold">Review & Submit</h3>
        <p className="text-gray-600">Confirm your information before uploading</p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <h4 className="font-medium text-gray-900">Business Information</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Name:</strong> {data.businessName || 'Not provided'}</p>
          <p><strong>Industry:</strong> {data.industry || 'Not specified'}</p>
          <p><strong>Website:</strong> {data.website || 'Not provided'}</p>
          <p><strong>Employees:</strong> {data.employees || 'Not specified'}</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <h4 className="font-medium text-gray-900">Contact Information</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Contact:</strong> {data.contactName || 'Not provided'}</p>
          <p><strong>Email:</strong> {data.email || 'Not provided'}</p>
          <p><strong>Phone:</strong> {data.phone || 'Not provided'}</p>
          <p><strong>Address:</strong> {data.address || 'Not provided'}</p>
          <p><strong>Timezone:</strong> {data.timezone || 'Not specified'}</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        <h4 className="font-medium text-gray-900">Preferences</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Marketing:</strong> {data.marketingOptIn ? 'Opted in' : 'Opted out'}</p>
          <p><strong>Notifications:</strong> {data.notificationPrefs || 'Not set'}</p>
          <p><strong>Data Retention:</strong> {data.dataRetention || 'Not set'}</p>
          {data.customField1 && <p><strong>Custom Field 1:</strong> {data.customField1}</p>}
          {data.customField2 && <p><strong>Custom Field 2:</strong> {data.customField2}</p>}
          {data.businessLogo && <p><strong>Business Logo:</strong> {data.businessLogo.name}</p>}
          {data.additionalImage && <p><strong>Additional Image:</strong> {data.additionalImage.name}</p>}
        </div>
      </div>

      <div className="flex gap-4">
        <button
          onClick={onBack}
          className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors flex items-center justify-center gap-2"
        >
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <button
          onClick={onSubmit}
          disabled={loading}
          className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
        >
          {loading ? 'Uploading...' : 'Submit to GHL'} <Upload className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Image Upload Component
const ImageUploadField = ({ label, value, onChange }) => {
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onChange(file);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    onChange(null);
    setPreview(null);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
        {preview ? (
          <div className="relative">
            <img src={preview} alt="Preview" className="max-w-full h-32 object-cover rounded" />
            <button
              onClick={removeFile}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="text-center">
            <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <label className="cursor-pointer">
              <span className="text-blue-600 hover:text-blue-700">Click to upload</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GHLIntegrationApp;
