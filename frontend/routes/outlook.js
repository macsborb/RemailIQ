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

const redirectUri = 'https://prospectai-aqhmb7huf0bdfaga.canadacentral-01.azurewebsites.net/outlook/callback'

// 🔐 Étape 1 : redirection vers Microsoft
router.get('/outlook/login', (req, res) => {
  const authUrl = oauth2.authorizeURL({
    redirect_uri: redirectUri,
    scope: 'https://graph.microsoft.com/User.Read https://graph.microsoft.com/Mail.Read offline_access',
    state: 'secureRandomString',
    prompt: 'select_account'
  })
  res.redirect(authUrl)
})

// ✅ Étape 2 : callback OAuth
router.get('/outlook/callback', async (req, res) => {
  const code = req.query.code

  try {
    const token = await oauth2.getToken({
      code,
      redirect_uri: redirectUri,
      scope: 'https://graph.microsoft.com/User.Read https://graph.microsoft.com/Mail.Read offline_access'
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

module.exports = router
