const express = require('express');
const router = express.Router();
const axios = require('axios');
const { Pool } = require('pg');
const { supabase } = require('../db');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false } 
});

// Fonction pour tronquer une chaîne à une longueur maximale
const truncateString = (str, maxLength) => {
  if (!str) return str;
  return str.length > maxLength ? str.substring(0, maxLength) : str;
};

// Point d'entrée API pour Mistral
router.post('/mistral', async (req, res) => {
  const { context, temperature } = req.body;
  
  try {
    // Récupérer le profil de l'utilisateur s'il est connecté
    let userProfile = { first_name: '', last_name: '', profession: '', age: '', company: '', position: '' };
    // Variable pour stocker le contexte enrichi
    let enhancedContext = context;
    
    if (req.session.userId) {
      const profileResult = await pool.query('SELECT * FROM user_profiles WHERE user_id = $1', [req.session.userId]);
      if (profileResult.rows.length > 0) {
        userProfile = profileResult.rows[0];
      }
      
      // Vérifier s'il y a un email sélectionné comme contexte
      const { data: selectedEmail, error } = await supabase
        .from('email_history')
        .select('*')
        .eq('user_id', req.session.userId)
        .eq('selected_for_context', true)
        .maybeSingle();
      
      if (selectedEmail && !error) {
        // Ajouter le contexte de l'email précédent
        const emailContext = `
        IMPORTANT - Contexte additionnel: Un email similaire a été généré précédemment le ${new Date(selectedEmail.generated_at).toLocaleDateString()} 
        avec le ton "${selectedEmail.tone || 'neutre'}" et une taille "${selectedEmail.size || 'moyenne'}".
        Le contenu de cet email était:
        -----
        ${selectedEmail.email_content}
        -----
        Prends en compte ce contexte pour rester cohérent dans ta réponse actuelle, mais ne mentionne pas directement que tu te bases sur une réponse précédente.
        `;
        
        enhancedContext += "\n\n" + emailContext;
      }
    }
    
    // Ajouter les informations de profil au contexte
    const userContext = `
    Informations sur l'utilisateur qui envoie le mail:
    - Prénom: ${userProfile.first_name || 'Non spécifié'}
    - Nom: ${userProfile.last_name || 'Non spécifié'}
    - Âge: ${userProfile.age || 'Non spécifié'}
    - Profession: ${userProfile.profession || 'Non spécifié'}
    - Entreprise: ${userProfile.company || 'Non spécifié'}
    - Poste: ${userProfile.position || 'Non spécifié'}
    
    Utilise ces informations pour personnaliser la réponse si c'est pertinent.
    `;
    
    enhancedContext += "\n\n" + userContext;
    
    const response = await axios.post(
      'https://api.mistral.ai/v1/chat/completions',
      {
        model: 'mistral-small-latest',
        messages: [
          {
            role: 'user',
            content: enhancedContext
          }
        ],
        temperature: typeof temperature === 'number' ? temperature : 0.6
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.MISTRAL_API_KEY}`
        }
      }
    );

    // Extraction des métadonnées pour les renvoyer avec la réponse
    const toneMatch = context.match(/de façon ([\w\séèàùêîô]+) et/);
    const sizeMatch = context.match(/je veux une ([\w\séèàùêîô]+) réponse/);
    const responseTypeMatch = context.match(/Si le mail contient des questions: Réponds ([\w\séèàùêîô]+)/);
    
    const tone = truncateString(toneMatch ? toneMatch[1].trim() : 'neutre', 50);
    const size = truncateString(sizeMatch ? sizeMatch[1].trim() : 'moyenne', 50);
    const responseType = truncateString(responseTypeMatch ? responseTypeMatch[1].trim() : 'neutre', 50);

    res.json({
      success: true,
      response: response.data.choices[0].message.content,
      metadata: {
        tone,
        size,
        responseType
      }
    });
  } catch (error) {
    console.error('Erreur API Mistral:', error.response ? error.response.data : error.message);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération'
    });
  }
});

module.exports = router;
