import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Alternative: SendGrid configuration (uncomment if Gmail fails)
// const sgMail = require('@sendgrid/mail');
// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Create email transporter
const createTransporter = () => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    throw new Error('Email credentials not configured. Please set EMAIL_USER and EMAIL_PASSWORD environment variables.');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    port: 587,
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD, // Use App Password for Gmail
    },
    connectionTimeout: 60000, // 60 seconds
    greetingTimeout: 30000,   // 30 seconds
    socketTimeout: 60000,     // 60 seconds
  });
};

// Send contact form email
export const sendContactEmail = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and message are required fields'
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address'
      });
    }

    const transporter = createTransporter();

    // Email content for admin notification
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `Contact Form: ${subject || 'New Message'} - from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <h2 style="color: #16a34a; border-bottom: 2px solid #16a34a; padding-bottom: 10px;">
            New Contact Form Submission
          </h2>
          
          <div style="margin: 20px 0;">
            <h3 style="color: #374151; margin-bottom: 15px;">Contact Details:</h3>
            
            <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin-bottom: 15px;">
              <p style="margin: 5px 0;"><strong>Name:</strong> ${name}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${email}</p>
              <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject || 'No subject provided'}</p>
            </div>
            
            <h3 style="color: #374151; margin-bottom: 10px;">Message:</h3>
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; border-left: 4px solid #16a34a;">
              <p style="margin: 0; line-height: 1.6; white-space: pre-wrap;">${message}</p>
            </div>
          </div>
          
          <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
            <p style="margin: 0;">This message was sent from the J's Recipe Box contact form.</p>
            <p style="margin: 5px 0 0 0;">Received on: ${new Date().toLocaleString()}</p>
          </div>
        </div>
      `
    };

    // Auto-reply email for user
    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Thank you for contacting J's Recipe Box!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #16a34a; font-family: 'Caveat', cursive; font-size: 36px; margin: 0;">J's Recipe Box</h1>
          </div>
          
          <h2 style="color: #374151;">Thank you for reaching out, ${name}!</h2>
          
          <p style="color: #4b5563; line-height: 1.6;">
            We've received your message and appreciate you taking the time to contact us. 
            Our team will review your inquiry and get back to you as soon as possible, 
            typically within 24 hours.
          </p>
          
          <div style="background-color: #f0fdf4; padding: 15px; border-radius: 5px; border-left: 4px solid #16a34a; margin: 20px 0;">
            <h3 style="color: #15803d; margin-top: 0;">Your Message Summary:</h3>
            <p style="margin: 5px 0;"><strong>Subject:</strong> ${subject || 'General Inquiry'}</p>
            <p style="margin: 5px 0;"><strong>Message:</strong></p>
            <p style="margin: 10px 0; font-style: italic; color: #6b7280;">"${message.substring(0, 100)}${message.length > 100 ? '...' : ''}"</p>
          </div>
          
          <p style="color: #4b5563; line-height: 1.6;">
            In the meantime, feel free to explore our collection of delicious recipes and 
            don't forget to sign up for our newsletter to stay updated with the latest recipes!
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://jsrecipebox.com" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Explore Recipes
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 14px; color: #6b7280;">
            <p style="margin: 0;">Best regards,</p>
            <p style="margin: 5px 0;"><strong>The J's Recipe Box Team</strong></p>
            <p style="margin: 5px 0;">Email: fongejustice918@gmail.com</p>
            <p style="margin: 5px 0;">Phone: +237 673 746 133</p>
          </div>
        </div>
      `
    };

    // Send both emails
    await Promise.all([
      transporter.sendMail(adminMailOptions),
      transporter.sendMail(userMailOptions)
    ]);

    res.status(200).json({
      success: true,
      message: 'Message sent successfully! We\'ll get back to you soon.'
    });

  } catch (error) {
    console.error('Contact form error:', error);
    
    // Handle specific SMTP connection issues
    if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTION') {
      // Log the contact attempt for manual follow-up
      console.log('=== CONTACT FORM SUBMISSION (Email Failed) ===');
      console.log('Name:', req.body.name);
      console.log('Email:', req.body.email);
      console.log('Subject:', req.body.subject || 'No subject');
      console.log('Message:', req.body.message);
      console.log('Timestamp:', new Date().toISOString());
      console.log('===============================================');
      
      return res.status(200).json({
        success: true,
        message: 'Message received! Due to email service limitations, we\'ll respond directly to your email address within 24 hours.'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to send message. Please try again later.'
    });
  }
};



// Get contact information
export const getContactInfo = async (req, res) => {
  try {
    const contactInfo = {
      email: 'fongejustice918@gmail.com',
      phone: '+237 673 746 133',
      location: 'Cameroon, Central Africa',
      businessHours: 'Monday - Friday, 9:00 AM - 6:00 PM (GMT+1)',
      responseTime: 'We typically respond within 24 hours',
      subjects: [
        { value: 'general', label: 'General Question' },
        { value: 'recipe', label: 'Recipe Support' },
        { value: 'account', label: 'Account Issues' },
        { value: 'business', label: 'Business Inquiry' },
        { value: 'feedback', label: 'Feedback' },
        { value: 'other', label: 'Other' }
      ]
    };

    res.status(200).json({
      success: true,
      data: contactInfo
    });

  } catch (error) {
    console.error('Get contact info error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve contact information'
    });
  }
};


