const axios = require('axios');

const sendEmail = async (to, subject, htmlContent) => {
  try {
    await axios({
      method: 'post',
      url: 'https://api.brevo.com/v3/smtp/email',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY.trim(),
        'content-type': 'application/json'
      },
      data: {
        sender: { email: process.env.SENDER_EMAIL, name: "UniLife Security" },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent
      }
    });
  } catch (error) {
    console.error("Brevo Error:", error.response?.data || error.message);
    throw new Error("Email Service Failed");
  }
};

exports.sendVerificationEmail = async (email, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
      <h2 style="color: #4f46e5;">Welcome to the Ecosystem</h2>
      <p>Click below to verify your academic account:</p>
      <a href="${verifyUrl}" style="background: #4f46e5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 8px; display: inline-block;">Verify Now</a>
    </div>`;
  return sendEmail(email, "Verify Your UniLife Account", html);
};


exports.sendResetPasswordEmail = async (email, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 16px; max-width: 600px;">
      <h2 style="color: #1e293b;">Password Reset Request</h2>
      <p style="color: #475569;">We received a request to reset the password for your UniLife account. Click the button below to proceed:</p>
      <div style="margin: 30px 0;">
        <a href="${resetUrl}" style="background: #4f46e5; color: white; padding: 14px 28px; text-decoration: none; border-radius: 10px; font-weight: bold; display: inline-block;">Reset My Password</a>
      </div>
      <p style="font-size: 12px; color: #94a3b8;">This link will expire in 15 minutes. If you did not request this, please ignore this email.</p>
    </div>`;
  return sendEmail(email, "Reset Your UniLife Password", html);
};