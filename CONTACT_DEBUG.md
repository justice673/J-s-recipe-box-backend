# Contact Form 500 Error - Debugging Guide

## 🔍 **Root Cause Analysis**

The 500 Internal Server Error you're experiencing is most likely caused by **missing email environment variables** on your Render deployment.

## 🚨 **Most Likely Issues:**

### 1. **Missing Environment Variables on Render**
Your deployed app doesn't have these variables set:
- `EMAIL_USER`
- `EMAIL_PASSWORD` 
- `ADMIN_EMAIL`

### 2. **Gmail App Password Issues**
- App password may be incorrectly formatted
- 2FA might not be enabled on your Gmail account
- Gmail security settings blocking the connection

### 3. **Network/Security Issues**
- Render might be blocking Gmail SMTP connections
- Firewall restrictions

## 🔧 **Immediate Fixes Applied:**

### ✅ **Better Error Handling**
- Added proper error logging
- More descriptive error messages
- Environment variable validation

### ✅ **Fallback Contact Endpoint**
- Created `/api/contact/simple` that works without email
- Logs contact submissions to console
- Always returns success response

### ✅ **Debug Endpoint**
- Added `/api/contact/env-check` to verify environment setup

## 🛠️ **Steps to Fix:**

### **Step 1: Test Environment Configuration**
Visit: `https://j-s-recipe-box-backend.onrender.com/api/contact/env-check`

Expected response:
```json
{
  "success": true,
  "message": "Environment check completed",
  "data": {
    "emailConfigured": false,
    "mongodbConfigured": true,
    "jwtConfigured": true,
    "port": "5000",
    "nodeEnv": "production"
  }
}
```

### **Step 2: Configure Environment Variables on Render**

1. Go to your Render dashboard
2. Navigate to your service
3. Go to **Environment** tab
4. Add these variables:

```
EMAIL_USER=fongejustice918@gmail.com
EMAIL_PASSWORD=yicp cmhf offv exhr
ADMIN_EMAIL=fongejustice918@gmail.com
```

### **Step 3: Test Simple Contact Form**
Update your frontend temporarily to use the simple endpoint:

```javascript
// Change this line in your frontend:
const response = await fetch(apiUrl('api/contact/simple'), {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(formData)
});
```

### **Step 4: Redeploy**
After adding environment variables, trigger a new deployment.

## 🎯 **Alternative Solutions:**

### **Option 1: Use a Different Email Service**
Switch to SendGrid, Mailgun, or AWS SES which are more deployment-friendly.

### **Option 2: Use a Contact Form Service**
Integrate with Formspree, Netlify Forms, or similar services.

### **Option 3: Database Logging**
Store contact submissions in your MongoDB database and check them via admin panel.

## 📝 **Frontend Update for Testing:**

```javascript
// Temporary fix - use the simple endpoint
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!formData.name || !formData.email || !formData.message) {
    toast.error('Please fill in all required fields');
    return;
  }

  setIsSubmitting(true);

  try {
    // Use /simple endpoint for now
    const response = await fetch(apiUrl('api/contact/simple'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData)
    });

    const data = await response.json();

    if (data.success) {
      toast.success(data.message);
      setFormData({ name: '', email: '', subject: '', message: '' });
    } else {
      toast.error(data.message);
    }
  } catch (error) {
    console.error('Contact form error:', error);
    toast.error('Failed to send message. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```

## 🔍 **Check Server Logs:**
In your Render dashboard, check the **Logs** tab to see the actual error messages when the contact form is submitted.

The logs will show whether it's an email configuration issue, network problem, or something else.
