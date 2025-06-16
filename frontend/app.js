const express = require('express')
const session = require('express-session')
const path = require('path')
const authRoutes = require('./routes/auth')
const outlookRoutes = require('./routes/outlook')
const gmailRoutes = require('./routes/gmail')
const profileRoutes = require('./routes/profile')
const emailHistoryRoutes = require('./routes/email_history')

const generateRoutes = require('./routes/generate')
const mistralRoute = require('./routes/api_mistral')
const sendMailRoutes = require('./routes/send_mail')
const app = express()

// Middleware pour parser le JSON
app.use(express.json())

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))

// Configuration des parsers de requête
app.use(express.urlencoded({ extended: true }))

// Configuration des fichiers statiques
app.use(express.static(path.join(__dirname, 'public')))

// Configuration du moteur de vue
app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

// Routes API (doivent être définies avant les routes de pages)
app.use('/api', emailHistoryRoutes)
app.use('/api', mistralRoute)
app.use('/api', sendMailRoutes)

// Routes de pages et autres routes
app.use('/', require('./routes/verify_code'))         
app.use('/', require('./routes/send_code'))         
app.use(outlookRoutes)
app.use(gmailRoutes)
app.use(generateRoutes)
app.use(profileRoutes)
app.use('/', authRoutes)

// Route pour la démo Material Design 3
app.get('/material-demo', (req, res) => {
  res.render('material-demo');
});

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`)
})
