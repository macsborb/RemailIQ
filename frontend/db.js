// frontend/db.js
const postgres = require('postgres');
const dotenv = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

dotenv.config(); // pour charger .env

const connectionString = process.env.DATABASE_URL;
const sql = postgres(connectionString, { ssl: 'require' });

// Vérification des variables d'environnement Supabase
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_KEY) {
  console.error('Erreur: Variables d\'environnement Supabase manquantes');
  process.exit(1);
}

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

console.log('Initialisation de la connexion Supabase...');
const supabase = createClient(supabaseUrl, supabaseKey);

// Test de la connexion
supabase.from('email_history').select('count', { count: 'exact' }).then(({ count, error }) => {
  if (error) {
    console.error('Erreur de connexion Supabase:', error);
  } else {
    console.log('Connexion Supabase établie avec succès');
  }
});

module.exports = { sql, supabase };
