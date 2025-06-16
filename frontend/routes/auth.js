const express = require('express')
const bcrypt = require('bcrypt')
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
console.log(process.env.DB_HOST)
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('❌ Erreur de connexion à la base Supabase :', err.message)
  } else {
    console.log('✅ Connexion à Supabase réussie. Heure actuelle :', res.rows[0].now)
  }
})
// Page d'accueil
router.get('/', (req, res) => {
  res.render('index', { error: null })  // Change pour utiliser la nouvelle page de connexion
})

// Page de connexion
router.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Page d'inscription
router.get('/register', (req, res) => {
  res.render('register', { error: null });
});

// Login depuis formulaire sur page d'accueil
router.post('/login', async (req, res) => {
  const { email, password } = req.body
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    const user = result.rows[0]

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.render('index', { error: 'Email ou mot de passe invalide' })
    }

    req.session.userId = user.id
    res.redirect('/dashboard')

  } catch (err) {
    console.error('❌ Erreur SQL lors de l\'inscription :', err.message)
    res.render('index', { error: 'Erreur serveur' })
  }
})

// Inscription depuis formulaire sur page d'accueil
router.post('/register', async (req, res) => {
  const { email, password, confirm_password, email_code } = req.body

  if (password !== confirm_password) {
    return res.render('index', { error: 'Les mots de passe ne correspondent pas' })
  }

  try {
    // Vérifie que le code email correspond à celui en base et qu'il n'est pas expiré
    const verif = await pool.query(
      'SELECT * FROM email_verifications WHERE email = $1',
      [email]
    )

    if (verif.rows.length === 0 || verif.rows[0].code !== email_code) {
      return res.render('index', { error: 'Code de vérification invalide' })
    }

    const now = new Date()
    if (now > new Date(verif.rows[0].expires_at)) {
      return res.render('index', { error: 'Code expiré, recommencez.' })
    }

    const hash = await bcrypt.hash(password, 10)
    await pool.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, hash])

    res.json({ success: true })
  } catch (err) {
    console.error('❌ Erreur SQL lors de l\'inscription :', err.message)
    res.render('index', { error: 'Erreur serveur' })
  }
})

router.post('/check-email', async (req, res) => {
  const { email } = req.body
  try {
    const { rows } = await pool.query('SELECT 1 FROM users WHERE email = $1', [email])
    if (rows.length > 0) {
      return res.json({ exists: true })
    } else {
      return res.json({ exists: false })
    }
  } catch (err) {
    console.error('Erreur check-email :', err)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
})


// Page dashboard utilisateur connecté
router.get('/dashboard', (req, res) => {
  if (!req.session.userId) return res.redirect('/')
  res.render('dashboard')
})

module.exports = router

// Route POST pour logout
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).send("Erreur lors de la déconnexion.")
    }
    res.redirect('/')
  })
})


