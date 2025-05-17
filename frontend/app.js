const express = require('express')
const session = require('express-session')
const path = require('path')
const authRoutes = require('./routes/auth')
const outlookRoutes = require('./routes/outlook')

const generateRoutes = require('./routes/generate')
const mistralRoute = require('./routes/api_mistral')
const app = express()

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}))
app.use(express.json())
app.use('/', require('./routes/verify_code'))         
app.use('/', require('./routes/send_code'))         
app.use(mistralRoute)
app.use(outlookRoutes)
app.use(generateRoutes)
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.urlencoded({ extended: true }))

app.set('view engine', 'ejs')
app.set('views', path.join(__dirname, 'views'))

app.use('/', authRoutes)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Serveur lancé sur http://localhost:${PORT}`)
})
