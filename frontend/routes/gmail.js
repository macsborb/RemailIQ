const express = require('express');
const { google } = require('googleapis');
require('dotenv').config();

const router = express.Router();

// Configuration OAuth2
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/gmail/callback'
);

// Scopes optimisés pour Gmail
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/gmail.send' // Ajout du scope pour envoyer des mails
];

// Route de connexion Gmail
router.get('/gmail/login', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });
  res.redirect(authUrl);
});

// Callback OAuth2
router.get('/gmail/callback', async (req, res) => {
  const { code } = req.query;
  
  try {
    const { tokens } = await oauth2Client.getToken(code);
    req.session.gmail_tokens = tokens;
    
    // Configurer le client avec les tokens
    oauth2Client.setCredentials(tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    // Récupérer l'email de l'utilisateur
    const profile = await gmail.users.getProfile({ userId: 'me' });
    req.session.gmail_email = profile.data.emailAddress;
    
    res.redirect('/generate');
  } catch (err) {
    console.error('Erreur lors du callback Gmail:', err);
    res.status(500).send('Erreur OAuth Gmail');
  }
});

// Déconnexion
router.get('/gmail/logout', (req, res) => {
  delete req.session.gmail_tokens;
  delete req.session.gmail_email;
  res.json({ success: true, message: 'Déconnecté de Gmail' });
});

// Récupérer l'email de l'utilisateur
router.get('/gmail/user-email', (req, res) => {
  const email = req.session.gmail_email;
  if (!email) return res.status(401).json({ error: 'Not authenticated with Gmail' });
  res.json({ email });
});

// Récupérer les contacts Gmail
router.get('/gmail/contacts', async (req, res) => {
  if (!req.session.gmail_tokens) {
    return res.status(401).json({ error: 'Not authenticated with Gmail' });
  }

  // Pagination
  const offset = parseInt(req.query.offset, 10) || 0;
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 500); // max 500 pour éviter surcharge

  try {
    oauth2Client.setCredentials(req.session.gmail_tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Récupérer tous les messages de l'inbox et des messages envoyés
    const [inboxResponse, sentResponse] = await Promise.all([
      gmail.users.messages.list({ userId: 'me', maxResults: 500, labelIds: ['INBOX'] }),
      gmail.users.messages.list({ userId: 'me', maxResults: 500, labelIds: ['SENT'] })
    ]);

    const messages = [
      ...(inboxResponse.data.messages || []),
      ...(sentResponse.data.messages || [])
    ];

    // Pagination sur les messages
    const paginatedMessages = messages.slice(offset, offset + limit);

    const contacts = new Set();
    const userEmail = req.session.gmail_email.toLowerCase();

    // Récupérer les en-têtes des messages en parallèle
    await Promise.all(
      paginatedMessages.map(async (message) => {
        try {
          const msg = await gmail.users.messages.get({
            userId: 'me',
            id: message.id,
            format: 'metadata',
            metadataHeaders: ['From', 'To', 'Cc', 'Bcc']
          });

          const headers = msg.data.payload.headers;
          const extractEmails = (str) => {
            if (!str) return [];
            const matches = str.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g) || [];
            return matches.map(email => email.toLowerCase());
          };

          // Extraire les emails des différents champs
          ['From', 'To', 'Cc', 'Bcc'].forEach(field => {
            const header = headers.find(h => h.name === field);
            if (header) {
              const emails = extractEmails(header.value);
              emails.forEach(email => {
                if (email !== userEmail) {
                  contacts.add(email);
                }
              });
            }
          });
        } catch (error) {
          console.error('Erreur lors de la récupération du message:', error);
        }
      })
    );

    // Convertir en tableau et trier
    const sortedContacts = [...contacts].sort();
    res.json({ contacts: sortedContacts, total: messages.length, offset, limit });

  } catch (err) {
    console.error('Erreur récupération contacts Gmail:', err);
    res.status(500).json({ error: 'Erreur récupération contacts' });
  }
});

// Récupérer le fil de discussion avec un contact
router.get('/gmail/thread/:email', async (req, res) => {
  if (!req.session.gmail_tokens) {
    return res.status(401).json({ error: 'Not authenticated with Gmail' });
  }

  const contactEmail = req.params.email.toLowerCase();

  try {
    oauth2Client.setCredentials(req.session.gmail_tokens);
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Récupérer tous les messages récents
    const [inboxResponse, sentResponse] = await Promise.all([
      gmail.users.messages.list({
        userId: 'me',
        maxResults: 100,
        labelIds: ['INBOX']
      }),
      gmail.users.messages.list({
        userId: 'me',
        maxResults: 100,
        labelIds: ['SENT']
      })
    ]);

    const allMessages = [
      ...(inboxResponse.data.messages || []),
      ...(sentResponse.data.messages || [])
    ];

    if (!allMessages.length) {
      return res.json([]);
    }

    const thread = [];
    
    // Filtrer et récupérer les messages pertinents
    await Promise.all(
      allMessages.map(async (msg) => {
        try {
          const message = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'full'
          });

          const headers = message.data.payload.headers;
          // Extraction robuste des emails et noms
          function parseEmailHeader(headerValue) {
            // Ex: "John Doe <john@example.com>" ou juste "john@example.com"
            const match = headerValue.match(/^(.*?)(?:<(.+?)>)?$/);
            if (!match) return { name: headerValue, address: headerValue };
            let name = match[1].replace(/"/g, '').trim();
            let address = match[2] ? match[2].trim() : match[1].trim();
            // Si pas d'@ dans address, fallback
            if (!address.includes('@')) address = match[1].trim();
            return { name: name || address, address };
          }

          const fromHeader = headers.find(h => h.name === 'From')?.value || '';
          const toHeader = headers.find(h => h.name === 'To')?.value || '';
          const from = parseEmailHeader(fromHeader);
          const to = parseEmailHeader(toHeader);
          const date = headers.find(h => h.name === 'Date')?.value;
          const subject = headers.find(h => h.name === 'Subject')?.value || '';

          // Vérifier si le message implique le contact
          const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
          const fromEmails = (fromHeader.match(emailRegex) || []).map(e => e.toLowerCase());
          const toEmails = (toHeader.match(emailRegex) || []).map(e => e.toLowerCase());

          if (fromEmails.includes(contactEmail) || toEmails.includes(contactEmail)) {
            // Extraire le contenu HTML du message
            let htmlContent = '';
            let plainText = '';
            function findHtmlPart(part) {
              if (part.mimeType === 'text/html') {
                htmlContent = Buffer.from(part.body.data, 'base64').toString();
                return true;
              } else if (part.mimeType === 'text/plain') {
                plainText = Buffer.from(part.body.data, 'base64').toString();
              }
              if (part.parts) {
                return part.parts.some(findHtmlPart);
              }
              return false;
            }
            if (message.data.payload.parts) {
              findHtmlPart(message.data.payload);
            } else if (message.data.payload.body.data) {
              if (message.data.payload.mimeType === 'text/html') {
                htmlContent = Buffer.from(message.data.payload.body.data, 'base64').toString();
              } else {
                plainText = Buffer.from(message.data.payload.body.data, 'base64').toString();
              }
            }
            const content = htmlContent || plainText;
            thread.push({
              id: message.id,
              from, // objet {name, address}
              to,   // objet {name, address}
              date,
              subject,
              body: {
                content: content,
                mimeType: htmlContent ? 'text/html' : 'text/plain'
              }
            });
          }
        } catch (error) {
          console.error('Erreur lors de la récupération du message:', error);
        }
      })
    );

    // Trier les messages par date
    thread.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(thread);
  } catch (err) {
    console.error('Erreur récupération thread Gmail:', err);
    res.status(500).json({ error: 'Erreur récupération thread' });
  }
});

module.exports = router;