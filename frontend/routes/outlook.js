const express = require('express')
const axios = require('axios')
const { AuthorizationCode } = require('simple-oauth2')
const { Client } = require('@microsoft/microsoft-graph-client')
require('isomorphic-fetch')
require('dotenv').config()

const router = express.Router()

const oauth2 = new AuthorizationCode({
  client: {
    id: process.env.OUTLOOK_CLIENT_ID,
    secret: process.env.OUTLOOK_CLIENT_SECRET
  },
  auth: {
    tokenHost: 'https://login.microsoftonline.com',
    tokenPath: '/common/oauth2/v2.0/token',
    authorizePath: '/common/oauth2/v2.0/authorize'
  }
})
// https://prospectai-aqhmb7huf0bdfaga.canadacentral-01.azurewebsites.net/outlook/callback
const redirectUri = 'http://localhost:3000/outlook/callback'

console.log("Redirect URI envoyée:", redirectUri)

// 🔐 Étape 1 : redirection vers Microsoft
router.get('/outlook/login', (req, res) => {
  const authUrl = oauth2.authorizeURL({
    redirect_uri: redirectUri,
    scope: 'https://graph.microsoft.com/User.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send offline_access',
    state: 'secureRandomString',
    prompt: 'select_account'
  })
  console.log('OAuth URL:', authUrl)
  res.redirect(authUrl)
})


// ✅ Étape 2 : callback OAuth
router.get('/outlook/callback', async (req, res) => {
  const code = req.query.code

  try {
    const token = await oauth2.getToken({
      code,
      redirect_uri: redirectUri,
      scope: 'https://graph.microsoft.com/User.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send offline_access'
    })

    req.session.outlookToken = token.token

    const client = Client.init({
      authProvider: (done) => done(null, token.token.access_token)
    })

    // ✅ C'est ici qu'on récupère l'email
    const user = await client.api('/me').get()
    req.session.outlookEmail = user.mail || user.userPrincipalName

    res.redirect('/generate')
  } catch (err) {
    console.error('Erreur lors du callback Outlook :', err)
    res.status(500).send('Erreur OAuth Outlook')
  }
})

router.get('/outlook/logout', (req, res) => {
  delete req.session.outlookToken
  delete req.session.outlookEmail
  res.json({ success: true, message: 'Déconnecté de Outlook' })
})

// 📬 Étape 3 : récupérer les emails
router.get('/outlook/emails', async (req, res) => {
  const token = req.session.outlookToken?.access_token
  if (!token) return res.status(401).json({ error: 'Not authenticated with Outlook' })

  const client = Client.init({
    authProvider: done => done(null, token)
  })

  try {
    const result = await client.api('/me/messages?$top=10')
      .select('subject,from,receivedDateTime,body')
      .orderby('receivedDateTime DESC')
      .get()

    res.json(result.value)
  } catch (err) {
    console.error('Erreur Microsoft Graph:', err)
    res.status(500).json({ error: 'Erreur récupération mails' })
  }
})

router.get('/outlook/user-email', (req, res) => {
  const email = req.session.outlookEmail
  console.log('Email récupéré:', email)
  if (!email) return res.status(401).json({ error: 'Not authenticated with Outlook' })
  res.json({ email })
})

router.get('/outlook/contacts', async (req, res) => {
  const token = req.session.outlookToken?.access_token;
  if (!token) return res.status(401).json({ error: 'Not authenticated with Outlook' });

  const client = Client.init({ authProvider: done => done(null, token) });
  // Pagination et limite
  const offset = parseInt(req.query.offset, 10) || 0;
  const limit = Math.min(parseInt(req.query.limit, 10) || 100, 1000); // max 1000

  try {
    // Récupérer les messages pour extraire les contacts
    let messages = [];
    let nextLink = `/me/messages?$top=${limit + offset}&$select=from,toRecipients`;
    let fetched = 0;
    while (messages.length < limit + offset && nextLink) {
      const resp = await client.api(nextLink).get();
      messages = messages.concat(resp.value);
      nextLink = resp['@odata.nextLink'] ? resp['@odata.nextLink'] : null;
      fetched += resp.value.length;
      if (!nextLink || fetched >= limit + offset) break;
    }
    // Extraire les contacts
    const contacts = new Set();
    const userEmail = req.session.outlookEmail?.toLowerCase();
    for (const msg of messages) {
      if (msg.from?.emailAddress?.address) {
        const email = msg.from.emailAddress.address.toLowerCase();
        if (email !== userEmail) contacts.add(email);
      }
      if (Array.isArray(msg.toRecipients)) {
        msg.toRecipients.forEach(r => {
          const email = r.emailAddress.address.toLowerCase();
          if (email !== userEmail) contacts.add(email);
        });
      }
    }
    // Pagination sur les contacts
    const sortedContacts = [...contacts].sort();
    const paginatedContacts = sortedContacts.slice(offset, offset + limit);
    res.json({ contacts: paginatedContacts, total: sortedContacts.length, offset, limit });
  } catch (err) {
    console.error('Erreur récupération contacts:', err);
    res.status(500).json({ error: 'Erreur récupération contacts' });
  }
})

router.get('/outlook/thread/:email', async (req, res) => {
  const token = req.session.outlookToken?.access_token
  if (!token) return res.status(401).json({ error: 'Not authenticated with Outlook' })

  const contact = req.params.email.toLowerCase()
  const client = Client.init({ authProvider: done => done(null, token) })

  try {
    const messages = await client
      .api(`/me/messages?$top=50&$orderby=receivedDateTime desc`)
      .select('subject,body,from,toRecipients,receivedDateTime')
      .get()

    const thread = messages.value.filter(msg => {
      const from = msg.from?.emailAddress?.address?.toLowerCase()
      const to = msg.toRecipients?.map(r => r.emailAddress?.address?.toLowerCase()) || []
      return from === contact || to.includes(contact)
    })

    res.json(thread)
  } catch (err) {
    console.error('Erreur récupération thread:', err)
    res.status(500).json({ error: 'Erreur récupération thread' })
  }
})

module.exports = router
