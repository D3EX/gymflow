import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

export async function sendPasswordResetEmail(email, resetLink) {
  try {
    await transporter.sendMail({
      from: `"GymFlow" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Reset Your GymFlow Password',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Password Reset</title>
          <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; }
            .container { max-width: 500px; margin: 0 auto; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { color: #fb7121; font-size: 24px; font-weight: bold; }
            .button { 
              display: inline-block; 
              background: #fb7121; 
              color: white; 
              padding: 12px 30px; 
              text-decoration: none; 
              border-radius: 8px; 
              margin: 20px 0;
              font-weight: 600;
            }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">GYM<span style="color: #fb7121;">FLOW</span></div>
            </div>
            <h2 style="color: #333;">Reset Your Password</h2>
            <p>You requested to reset your password for your GymFlow account.</p>
            <p>Click the button below to reset your password. This link will expire in <strong>1 hour</strong>.</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="button">Reset Password</a>
            </div>
            <p>Or copy this link: <br/> <small style="color: #666; word-break: break-all;">${resetLink}</small></p>
            <p>If you didn't request this, please ignore this email.</p>
            <div class="footer">
              <p>GymFlow - Complete Gym Management System</p>
              <p>© ${new Date().getFullYear()} GymFlow. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
}