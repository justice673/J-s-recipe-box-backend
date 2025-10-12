# Contact API Documentation

## Overview
The Contact API handles contact form submissions and sends emails using nodemailer.

## Endpoints

### POST /api/contact
Send a contact form message

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "subject": "general", // optional
  "message": "Hello, I have a question about recipes."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully! We'll get back to you soon."
}
```

### GET /api/contact/info
Get contact information and available subjects

**Response:**
```json
{
  "success": true,
  "data": {
    "email": "fongejustice918@gmail.com",
    "phone": "+237 673 746 133",
    "location": "Cameroon, Central Africa",
    "businessHours": "Monday - Friday, 9:00 AM - 6:00 PM (GMT+1)",
    "responseTime": "We typically respond within 24 hours",
    "subjects": [
      { "value": "general", "label": "General Question" },
      { "value": "recipe", "label": "Recipe Support" },
      { "value": "account", "label": "Account Issues" },
      { "value": "business", "label": "Business Inquiry" },
      { "value": "feedback", "label": "Feedback" },
      { "value": "other", "label": "Other" }
    ]
  }
}
```

## Email Configuration

To set up email functionality, you need to configure Gmail App Password:

1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Generate an App Password for "Mail"
4. Add the App Password to your .env file:

```env
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_16_character_app_password
ADMIN_EMAIL=admin@yoursite.com
```

## Features

- ✅ Form validation (name, email, message required)
- ✅ Email format validation
- ✅ Sends notification to admin
- ✅ Sends auto-reply to user
- ✅ Professional HTML email templates
- ✅ Rate limiting ready
- ✅ Error handling

## Frontend Integration

Update your contact form submission to use the new backend:

```javascript
const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (!formData.name || !formData.email || !formData.message) {
    toast.error('Please fill in all required fields');
    return;
  }

  setIsSubmitting(true);

  try {
    const response = await fetch('/api/contact', {
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
    toast.error('Failed to send message. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};
```
