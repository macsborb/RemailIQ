const express = require('express')
const router = express.Router()



// Affichage de la page de génération de mail
router.get('/generate', (req, res) => {
  if (!req.session.userId) {
    return res.redirect('/')
  }
  res.render('generate', { 
    output: null, 
    form: null, 
    outlookConnected: !!req.session.outlookToken,
    outlookEmail: req.session.outlookEmail || null 
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
