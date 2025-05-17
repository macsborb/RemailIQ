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
      textContent: `Voici votre code : ${code}`,
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
