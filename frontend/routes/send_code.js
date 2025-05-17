const express = require('express')
const router = express.Router()
const SibApiV3Sdk = require('sib-api-v3-sdk')
const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false } 
})

const mail_sender_name = 'prospectai '
const mail_sender = 'blancrobbie@gmail.com'
const emailHtmlTemplate = `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <title>Code de vérification</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #1f2029;
        color: #ffeba7;
        padding: 20px;
      }
      .container {
        max-width: 500px;
        margin: auto;
        background-color: #2b2e38;
        border-radius: 10px;
        padding: 30px;
        border: 1px solid #444;
      }
      h1 {
        text-align: center;
        color: #ffeba7;
      }
      p {
        font-size: 16px;
        line-height: 1.5;
        color:rgb(255, 255, 255);
      }
      .code-box {
        text-align: center;
        background-color: #ffeba7;
        color: #1f2029;
        font-size: 24px;
        font-weight: bold;
        padding: 15px;
        border-radius: 8px;
        margin: 20px auto;
        width: fit-content;
      }
      .footer {
        margin-top: 30px;
        font-size: 12px;
        text-align: center;
        color: #aaa;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>ProspectAI</h1>
      <p>Bonjour,</p>
      <p>Voici votre code de vérification pour terminer la création de votre compte :</p>
      <div class="code-box">{{CODE}}</div>
      <p>Ce code expirera dans 10 minutes. Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer cet email.</p>
      <div class="footer">© 2025 ProspectAI. Tous droits réservés.</div>
    </div>
  </body>
</html>`


router.post('/send-code', async (req, res) => {
  const { email } = req.body
  const code = Math.floor(100000 + Math.random() * 900000).toString()
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

  try {
    await pool.query(
      'insert into email_verifications(email, code, expire_att) values($1, $2, $3) on conflict (email) do update set code = $2, expire_att = $3',
      [email, code, expiresAt]
    )

    SibApiV3Sdk.ApiClient.instance.authentications['api-key'].apiKey = process.env.SENDINBLUE_API_KEY
    const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()

    const sendSmtpEmail = {
      to: [{ email }],
      subject: 'Votre code de vérification ProspectAI',
      htmlContent: emailHtmlTemplate.replace('{{CODE}}', code),
      sender: { name: mail_sender_name, email: mail_sender }
    }

    await apiInstance.sendTransacEmail(sendSmtpEmail)
    res.json({ success: true })
  } catch (err) {
    console.error('Erreur envoi Brevo :', err)
    res.status(500).json({ error: 'Erreur lors de l’envoi du mail' })
  }
})

module.exports = router
