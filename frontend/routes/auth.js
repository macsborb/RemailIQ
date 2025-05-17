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
// Page d’accueil
router.get('/', (req, res) => {
  res.render('index', { error: null })  // passe une variable error
})

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
  const { email, password } = req.body
  try {
    const existing = await pool.query('SELECT * FROM users WHERE email = $1', [email])
    if (existing.rows.length > 0) {
      return res.render('index', { error: 'Email déjà utilisé' })
    }

    const hash = await bcrypt.hash(password, 10)
    await pool.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, hash])

    res.redirect('/dashboard')
  } catch (err) {
    console.error('❌ Erreur SQL lors de l\'inscription :', err.message)
    res.render('index', { error: 'Erreur serveur' })
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

// Route GET pour générateur
router.get('/generate', (req, res) => {
  if (!req.session.userId) return res.redirect('/')
  res.render('generate')  // Crée ce fichier ensuite
})

