const express = require('express');
const router = express.Router();
const { supabase } = require('../db');

// Middleware pour vérifier si l'utilisateur est connecté
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: 'Non autorisé' });
};

// Récupérer l'historique des emails d'un utilisateur (limité aux 50 derniers)
router.get('/email-history', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const { data, error } = await supabase
      .from('email_history')
      .select('*')
      .eq('user_id', userId)
      .order('generated_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    
    res.json({ emails: data });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique des emails:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'historique' });
  }
});

// Sauvegarder un nouvel email généré
router.post('/email-history', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { email_content, email_subject, tone, size, response_type } = req.body;
    
    // Vérifier le nombre d'emails de l'utilisateur
    const { count, error: countError } = await supabase
      .from('email_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    if (countError) throw countError;
    console.log('Nombre d\'emails pour l\'utilisateur', userId, ':', count);
    
    // Si la limite est atteinte, supprimer le plus ancien email
    if (count >= 10) {
      console.log('Limite atteinte, suppression du plus ancien email');
      
      // Récupérer l'ID du plus ancien email
      const { data: oldestEmail, error: oldestError } = await supabase
        .from('email_history')
        .select('id')
        .eq('user_id', userId)
        .order('generated_at', { ascending: true })
        .limit(1)
        .single();
      
      if (oldestError) throw oldestError;
      
      // Supprimer le plus ancien email
      const { error: deleteError } = await supabase
        .from('email_history')
        .delete()
        .eq('id', oldestEmail.id);
      
      if (deleteError) throw deleteError;
      console.log('Plus ancien email supprimé avec succès');
    }
    
    // Insérer le nouvel email
    const { data, error } = await supabase
      .from('email_history')
      .insert([
        { 
          user_id: userId,
          email_content,
          email_subject,
          tone,
          size,
          response_type
        }
      ])
      .select();
    
    if (error) throw error;
    
    res.status(201).json({ 
      email: data[0],
      oldEmailDeleted: count >= 10
    });
  } catch (error) {
    console.error('Erreur lors de la sauvegarde de l\'email:', error);
    res.status(500).json({ error: 'Erreur lors de la sauvegarde de l\'email' });
  }
});

// Marquer un email comme sélectionné pour le contexte
router.put('/email-history/:id/select', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const emailId = req.params.id;
    
    // D'abord, désélectionner tous les emails de l'utilisateur
    await supabase
      .from('email_history')
      .update({ selected_for_context: false })
      .eq('user_id', userId);
    
    // Ensuite, sélectionner l'email spécifié
    const { data, error } = await supabase
      .from('email_history')
      .update({ selected_for_context: true })
      .eq('id', emailId)
      .eq('user_id', userId) // Sécurité supplémentaire
      .select();
    
    if (error) throw error;
    
    res.json({ email: data[0] });
  } catch (error) {
    console.error('Erreur lors de la sélection de l\'email:', error);
    res.status(500).json({ error: 'Erreur lors de la sélection de l\'email' });
  }
});

// Récupérer l'email actuellement sélectionné pour le contexte
router.get('/email-history/selected', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const { data, error } = await supabase
      .from('email_history')
      .select('*')
      .eq('user_id', userId)
      .eq('selected_for_context', true)
      .maybeSingle();
    
    if (error) throw error;
    
    res.json({ email: data });
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'email sélectionné:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de l\'email sélectionné' });
  }
});

// Supprimer un email
router.delete('/email-history/:id', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    const emailId = req.params.id;
    
    console.log('Tentative de suppression de l\'email:', {
      emailId,
      userId
    });

    // Vérifier que l'email existe et appartient à l'utilisateur
    const { data: email, error: checkError } = await supabase
      .from('email_history')
      .select('*')
      .eq('id', emailId)
      .eq('user_id', userId)
      .single();
    
    console.log('Résultat de la vérification:', {
      email,
      checkError
    });

    if (checkError) {
      console.error('Erreur lors de la vérification:', checkError);
      return res.status(500).json({ error: 'Erreur lors de la vérification de l\'email' });
    }

    if (!email) {
      console.log('Email non trouvé ou n\'appartient pas à l\'utilisateur');
      return res.status(404).json({ error: 'Email non trouvé' });
    }
    
    // Supprimer l'email
    const { error: deleteError } = await supabase
      .from('email_history')
      .delete()
      .eq('id', emailId)
      .eq('user_id', userId);
    
    console.log('Résultat de la suppression:', {
      deleteError
    });

    if (deleteError) {
      console.error('Erreur lors de la suppression:', deleteError);
      throw deleteError;
    }
    
    console.log('Email supprimé avec succès');
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'email:', error);
    res.status(500).json({ error: 'Erreur lors de la suppression de l\'email' });
  }
});

// Désélectionner tous les emails
router.put('/email-history/deselect-all', isAuthenticated, async (req, res) => {
  try {
    const userId = req.session.userId;
    
    const { error } = await supabase
      .from('email_history')
      .update({ selected_for_context: false })
      .eq('user_id', userId);
    
    if (error) throw error;
    
    res.json({ success: true });
  } catch (error) {
    console.error('Erreur lors de la désélection des emails:', error);
    res.status(500).json({ error: 'Erreur lors de la désélection des emails' });
  }
});

module.exports = router; 