import dotenv from "dotenv"
import Sib from "sib-api-v3-sdk"
import jwt from "jsonwebtoken"

dotenv.config()

const client = Sib.ApiClient.instance
client.authentications['api-key'].apiKey = process.env.SIB_API_KEY

const apiInstance = new Sib.TransactionalEmailsApi()

export async function sendVerificationEmail(email, name) {
  const payload = {
    email: email,
    expiresAt: "1d"
  };
  const token = jwt.sign(payload, process.env.SECRET);
  const verificationLink = `http://localhost:3000/users/verify?token=${token}`

  const sendSmtpEmail = new Sib.SendSmtpEmail();

  sendSmtpEmail.to = [{ email, name }];
  sendSmtpEmail.subject = 'Verify your account';
  sendSmtpEmail.htmlContent = `
    <h1>Welcome to iSee, ${name}!</h1>
    <p>Please verify your email by clicking the link below:</p>
    <a href="${verificationLink}">Verify Email</a>
  `;
  sendSmtpEmail.sender = { email: 'seisme.alumnus_0u@icloud.com', name: 'iSee' };

  try {
    const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
    console.log(response);
  } catch (error) {
    console.error(error);
  }
}