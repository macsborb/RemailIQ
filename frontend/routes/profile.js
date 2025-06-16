const express = require('express')
const { Pool } = require('pg')
const router = express.Router()
require('dotenv').config()

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false } 
})

// Middleware pour vérifier si l'utilisateur est connecté
const requireLogin = (req, res, next) => {
  if (!req.session.userId) {
    return res.redirect('/')
  }
  next()
}

// Afficher la page profil
router.get('/profile', requireLogin, async (req, res) => {
  try {
    // Récupérer les informations de l'utilisateur
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.session.userId])
    const user = userResult.rows[0]
    
    if (!user) {
      return res.redirect('/')
    }
    
    // Récupérer le profil utilisateur
    const profileResult = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [req.session.userId])
    const profile = profileResult.rows[0] || {}
    
    res.render('profile', { 
      user, 
      profile,
      outlookConnected: req.session.outlookToken ? true : false,
      outlookEmail: req.session.outlookEmail || null,
      error: null, 
      success: null 
    })
  } catch (err) {
    console.error('Erreur lors de la récupération du profil:', err)
    res.render('profile', { 
      user: {}, 
      profile: {},
      outlookConnected: req.session.outlookToken ? true : false,
      outlookEmail: req.session.outlookEmail || null,
      error: 'Une erreur est survenue lors de la récupération de votre profil', 
      success: null 
    })
  }
})

// Mettre à jour les informations du profil
router.post('/profile/update', requireLogin, async (req, res) => {
  const { first_name, last_name, age, profession, company, position } = req.body
  console.log(req.body)
  try {
    // Vérifier que l'utilisateur existe
    const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.session.userId])
    const user = userResult.rows[0]
    
    if (!user) {
      throw new Error('Utilisateur non trouvé')
    }
    
    // Commencer une transaction
    await pool.query('BEGIN')
    
    try {
      // Vérifier si un profil existe déjà pour cet utilisateur
      const profileResult = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [req.session.userId])
      
      if (profileResult.rows.length > 0) {
        // Mettre à jour le profil existant
        await pool.query(
          'UPDATE user_profiles SET first_name = $1, last_name = $2, age = $3, profession = $4, company = $5, position = $6 WHERE user_id = $7',
          [first_name || null, last_name || null, age || null, profession || null, company || null, position || null, req.session.userId]
        )
      } else {
        // Créer un nouveau profil
        await pool.query(
          'INSERT INTO user_profiles (user_id, first_name, last_name, age, profession, company, position) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [req.session.userId, first_name || null, last_name || null, age || null, profession || null, company || null, position || null]
        )
      }
      
      // Valider la transaction
      await pool.query('COMMIT')
      
      // Récupérer les informations mises à jour
      const updatedProfileResult = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [req.session.userId])
      const updatedProfile = updatedProfileResult.rows[0] || {}
      
      res.render('profile', {
        user,
        profile: updatedProfile,
        outlookConnected: req.session.outlookToken ? true : false,
        outlookEmail: req.session.outlookEmail || null,
        error: null,
        success: 'Votre profil a été mis à jour avec succès'
      })
    } catch (err) {
      // En cas d'erreur, annuler la transaction
      await pool.query('ROLLBACK')
      throw err
    }
  } catch (err) {
    console.error('Erreur lors de la mise à jour du profil:', err)
    res.render('profile', {
      user: userResult?.rows[0] || {}, 
      profile: req.body,
      outlookConnected: req.session.outlookToken ? true : false,
      outlookEmail: req.session.outlookEmail || null,
      error: 'Une erreur est survenue lors de la mise à jour de votre profil',
      success: null
    })
  }
})

module.exports = router 