const nodemailer = require('nodemailer');

// 1. Create the Transporter (using credentials from .env)
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // This is the 16-digit App Password
  },
});

// 2. Create the Send Function
const sendPasswordResetEmail = async (email, token) => {
  // Use the Vercel URL if available, otherwise fallback to localhost
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const resetUrl = `${frontendUrl}/reset-password/${token}`;

  const mailOptions = {
    from: `"Nexus AI Platform" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your Password Reset Link for Nexus AI',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Password Reset Request</h2>
        <p>You requested a password reset for your Nexus AI account. Please click the link below (or copy and paste it into your browser) to set a new password:</p>
        <p>
          <a href="${resetUrl}" 
             style="background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Reset Password
          </a>
        </p>
        <p>If you did not request this, please ignore this email.</p>
        <p>This link will expire in 1 hour.</p>
        <br />
        <p>Thank you,</p>
        <p>The Nexus AI Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Password reset link sent successfully to: ${email}`);
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send email to ${email}:`, error);
    // We don't throw an error here to avoid leaking info
  }
};

// Send welcome email when applicant is approved
const sendWelcomeEmail = async (email, firstName) => {
  // Use the Vercel URL if available, otherwise fallback to localhost
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

  const mailOptions = {
    from: `"Nexus AI Platform" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Welcome to Nexus AI! Your Application is Approved.',
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Congratulations, ${firstName}!</h2>
        <p>We are thrilled to inform you that your application to join the Nexus AI platform has been <strong>Approved</strong>.</p>
        <p>Your account is now active, and you have been upgraded to the <strong>Freelancer</strong> tier. You can now log in to your dashboard to view and start working on available tasks.</p>
        <p style="margin-top: 25px;">
          <a href="${frontendUrl}/login" 
             style="background-color: #10b981; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">
            Go to Your Dashboard
          </a>
        </p>
        <br />
        <p>Welcome aboard,</p>
        <p>The Nexus AI Team</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`[EMAIL] Welcome email sent successfully to: ${email}`);
  } catch (error) {
    console.error(`[EMAIL ERROR] Failed to send welcome email to ${email}:`, error);
  }
};

module.exports = { 
  sendPasswordResetEmail,
  sendWelcomeEmail 
};
