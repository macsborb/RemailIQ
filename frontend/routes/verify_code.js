const express = require('express')
const router = express.Router()
const { Pool } = require('pg')
require('dotenv').config()

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false } 
})

router.post('/verify-code', async (req, res) => {
  const { email, code } = req.body

  const { rows } = await pool.query(
    'select * from email_verifications where email = $1',
    [email]
  )

  const record = rows[0]
  if (!record) return res.status(400).json({ error: 'Code non trouvé' })

  if (record.code !== code)
    return res.status(400).json({ error: 'Code incorrect' })

  if (new Date() > new Date(record.expires_att))
    return res.status(400).json({ error: 'Code expiré' })

  res.json({ success: true })
})

module.exports = router
