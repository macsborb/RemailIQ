const express = require('express')
const router = express.Router()

// Route pour vérifier le statut de connexion mail
router.get('/api/mail-connection-status', (req, res) => {
  // Vérifier si l'utilisateur est connecté à une boîte mail
  const isConnected = req.session.outlookEmail || req.session.googleEmail || req.session.appleEmail;
  
  res.json({
      connected: !!isConnected,
      provider: isConnected ? (req.session.outlookEmail ? 'outlook' : req.session.googleEmail ? 'google' : 'apple') : null
  });
});

// Affichage de la page de génération de mail
router.get('/generate', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/')
  }
  // Correction : cohérence des noms de variables de session
  const outlookConnected = !!req.session.outlookToken;
  const gmailConnected = !!req.session.gmail_tokens;
  const isMailConnected = outlookConnected || gmailConnected;
  res.render('generate', {
    outlookConnected,
    outlookEmail: req.session.outlookEmail || '',
    gmailConnected,
    gmailEmail: req.session.gmail_email || '',
    userAvatarUrl: req.session.user_avatar_url || '',
    output: null, 
    form: null,
    isMailConnected
  })
})

// Traitement du formulaire
router.post('/generate', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/')
  }

  const { recipient, subject, context } = req.body

  // Pour le moment, on simule une réponse d'IA
  const fakeOutput = `
    Bonjour ${recipient},\n\n
    Merci pour votre message concernant : "${subject}".\n
    Voici une réponse personnalisée basée sur votre contexte :\n
    "${context}"\n\n
    Cordialement,\nL'équipe ProspectAI.
  `

  res.render('generate', {
    output: fakeOutput,
    form: { recipient, subject, context }
  })
})

module.exports = router
