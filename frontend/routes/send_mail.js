const express = require('express');
const router = express.Router();

// Gmail
const { google } = require('googleapis');
// Outlook
const { Client } = require('@microsoft/microsoft-graph-client');
require('isomorphic-fetch');

// Envoi d'un mail via Gmail ou Outlook selon la session
router.post('/send-mail', async (req, res) => {
  const { to, subject, body } = req.body;
  const session = req.session;

  // Correction : fallback objet si vide
  const mailSubject = subject && subject !== '(Objet généré)' ? subject : 'Message de ProspectAI';

  // Correction : conversion des retours à la ligne en <br> si body n'est pas déjà HTML
  let mailBody = body;
  if (!/^\s*<([a-z][\s\S]*>)?/i.test(body)) {
    mailBody = body.replace(/\n/g, '<br>');
  }

  try {
    if (session.gmail_tokens) {
      // Gmail
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'http://localhost:3000/gmail/callback'
      );
      oauth2Client.setCredentials(session.gmail_tokens);
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const messageParts = [
        `To: ${to}`,
        `Subject: ${mailSubject}`,
        'Content-Type: text/html; charset=utf-8',
        '',
        mailBody
      ];
      const message = messageParts.join('\n');
      const encodedMessage = Buffer.from(message).toString('base64').replace(/\+/g, '-').replace(/\//g, '_');
      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });
      return res.json({ success: true });
    } else if (session.outlookToken) {
      // Outlook
      const client = Client.init({
        authProvider: (done) => done(null, session.outlookToken.access_token)
      });
      // Correction : fallback objet si vide
      const mailSubject = subject && subject !== '(Objet généré)' ? subject : 'Message de ProspectAI';
      // Correction : conversion des retours à la ligne en <br> si body n'est pas déjà HTML
      let mailBody = body;
      if (!/^\s*<([a-z][\s\S]*>)?/i.test(body)) {
        mailBody = body.replace(/\n/g, '<br>');
      }
      await client.api('/me/sendMail').post({
        message: {
          subject: mailSubject,
          body: {
            contentType: 'HTML',
            content: mailBody
          },
          toRecipients: [
            { emailAddress: { address: to } }
          ]
        }
      });
      return res.json({ success: true });
    } else {
      return res.status(401).json({ success: false, error: 'Aucune connexion mail active.' });
    }
  } catch (e) {
    console.error('Erreur envoi mail:', e);
    return res.status(500).json({ success: false, error: 'Erreur lors de l\'envoi du mail.' });
  }
});

module.exports = router;
