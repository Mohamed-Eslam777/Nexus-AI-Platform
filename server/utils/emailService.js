const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Create a transporter (the service that will send the email)
  const emailPort = parseInt(process.env.EMAIL_PORT) || 587;
  const isSecure = emailPort === 465; // Port 465 uses SSL, port 587 uses STARTTLS
  
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: emailPort,
    secure: isSecure, // true for 465, false for other ports like 587
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      // Reject unauthorized certificates (set to false only if you have self-signed certificates)
      rejectUnauthorized: true
    }
  });

  // 2. Define the email options
  const mailOptions = {
    from: '"Nexus AI" <' + process.env.EMAIL_USER + '>', // Sender address
    to: options.email, // List of receivers
    subject: options.subject, // Subject line
    text: options.message, // Plain text body
    html: options.html || options.message // HTML body (optional)
  };

  // 3. Actually send the email
  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

module.exports = sendEmail;

