// frontend/db.js
import postgres from 'postgres'
import dotenv from 'dotenv'

dotenv.config() // pour charger .env

const connectionString = process.env.DATABASE_URL
const sql = postgres(connectionString, { ssl: 'require' })

export default sql
