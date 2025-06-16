// Fonction globale pour supprimer un email
window.deleteEmail = async function(emailId) {
  try {
    const response = await fetch(`/api/email-history/${emailId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Erreur lors de la suppression');
    }

    // Recharger l'historique pour mettre à jour l'affichage
    if (typeof window.loadEmailHistory === 'function') {
      await window.loadEmailHistory();
    }
    showToast('success', 'Email supprimé avec succès');
  } catch (error) {
    console.error('Erreur lors de la suppression de l\'email:', error);
    showToast('error', error.message || 'Erreur lors de la suppression de l\'email');
  }
}

// Fonction globale pour afficher les toasts
window.showToast = function(type, message) {
  const toast = document.createElement('div');
  toast.className = 'toast toast-end fixed top-4 right-4 z-50 animate-fade-in';
  toast.innerHTML = `
    <div class="alert alert-${type}">
      <span>${message}</span>
    </div>
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}


// Fonction pour mettre à jour la sélection d'un email
async function updateEmailSelection(emailId, shouldSelect) {
  try {
    const response = await fetch(`/api/email-history/${emailId}/select`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ selected_for_context: shouldSelect })
    });

    if (!response.ok) throw new Error('Erreur lors de la sélection');
    
    // Recharger l'historique pour mettre à jour l'affichage
    if (typeof window.loadEmailHistory === 'function') {
      await window.loadEmailHistory();
    }
    
    // Afficher une notification de succès
    showToast('success', shouldSelect ? 'Email sélectionné comme contexte' : 'Email désélectionné');
  } catch (error) {
    console.error('Erreur lors de la sélection de l\'email:', error);
    showToast('error', 'Erreur lors de la sélection de l\'email');
  }
}


  console.log('Initialisation de email-history.js');
  
  // Sélection des éléments du DOM
  const emailHistoryList = document.getElementById('email-history-list');
  const refreshHistoryBtn = document.getElementById('refresh-history');
  const generateIaBtn = document.getElementById('generate-ia');
  const iaResponse = document.getElementById('ia-response');
  const logoutGmailBtn = document.getElementById('logout-gmail');
  
  console.log('Éléments DOM trouvés:', {
    emailHistoryList: !!emailHistoryList,
    refreshHistoryBtn: !!refreshHistoryBtn,
    generateIaBtn: !!generateIaBtn,
    iaResponse: !!iaResponse,
    logoutGmailBtn: !!logoutGmailBtn
  });
  
  // Variables pour stocker les données du contexte
  let selectedHistoryEmail = null;
  let currentGeneratedContent = '';
  
  // Chargement initial de l'historique des emails
  loadEmailHistory();
  
  // Écouteurs d'événements
  if (refreshHistoryBtn) {
    refreshHistoryBtn.addEventListener('click', () => {
      console.log('Rafraîchissement manuel de l\'historique');
      loadEmailHistory();
    });
  }
  
  // Intercepte le clic sur le bouton "Générer le mail"
  if (generateIaBtn) {
    const originalClick = generateIaBtn.onclick;
    generateIaBtn.addEventListener('click', function() {
      console.log('Clic sur Générer le mail détecté');
      window.isGenerating = true;
      
      // Observer les changements dans le div de réponse IA
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList' && iaResponse && 
            iaResponse.textContent.trim() !== '') {
            console.log('Génération terminée');
            window.isGenerating = false;
          currentGeneratedContent = iaResponse.textContent.trim();
            observer.disconnect();
            break;
          }
        }
      });
      
      if (iaResponse) {
        observer.observe(iaResponse, { childList: true, subtree: true });
      }
      
      if (typeof originalClick === 'function') {
        originalClick.call(this);
      }
    });
  }
  
  // Gestion de la déconnexion Gmail
  if (logoutGmailBtn) {
    logoutGmailBtn.addEventListener('click', () => {
      fetch('/gmail/logout')
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            location.reload();
          }
        })
        .catch(error => {
          console.error('Erreur lors de la déconnexion:', error);
          showNotification('Erreur lors de la déconnexion', 'error');
        });
    });
  }
  
  // Ajouter une variable globale pour suivre l'état de la génération
  window.isGenerating = false;
  
  /**
   * Affiche une notification à l'utilisateur
   * @param {string} message - Le message à afficher
   * @param {string} type - Le type de notification ('success' ou 'error')
   */
  function showNotification(message, type = 'success') {
    // Supprimer toute notification existante
    const existingNotifications = document.querySelectorAll('.notification-alert');
    existingNotifications.forEach(notification => notification.remove());

    // Créer l'élément de notification
    const notification = document.createElement('div');
    notification.className = `notification-alert alert ${type === 'error' ? 'alert-error' : 'alert-success'} fixed top-4 right-4 z-50 animate-fade-in`;
    
    notification.innerHTML = `
      <div class="flex items-center gap-2">
        ${type === 'error' ? `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ` : `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `}
        <span>${message}</span>
      </div>
    `;

    // Ajouter la notification au document
    document.body.appendChild(notification);

    // Supprimer la notification après 3 secondes
    setTimeout(() => {
      notification.classList.replace('animate-fade-in', 'animate-fade-out');
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }
  
  /**
   * Charge l'historique des emails depuis l'API
   */
  function loadEmailHistory() {
    console.log('Début du chargement de l\'historique');
    
    if (!emailHistoryList) {
      console.error('emailHistoryList non trouvé dans le DOM');
      return;
    }
    
    emailHistoryList.innerHTML = `
      <div class="flex items-center justify-center h-40">
        <span class="loading loading-spinner loading-md"></span>
      </div>
    `;
    
    fetch('/api/email-history')
      .then(response => {
        console.log('Réponse du serveur:', {
          status: response.status,
          ok: response.ok,
          statusText: response.statusText
        });
        if (!response.ok) {
          throw new Error(response.status === 401 ? 'Non connecté' : 'Erreur serveur');
        }
        return response.json();
      })
      .then(data => {
        console.log('Données reçues de l\'API:', data);
        if (!data.emails || !Array.isArray(data.emails)) {
          console.error('Format de données invalide:', data);
          throw new Error('Format de données invalide');
        }
        displayEmailHistory(data.emails);
        
      })
      .catch(error => {
        console.error('Erreur lors du chargement de l\'historique:', error);
        emailHistoryList.innerHTML = `
          <div class="alert alert-error">
            <svg xmlns="http://www.w3.org/2000/svg" class="stroke-current shrink-0 h-6 w-6" fill="none" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>${error.message === 'Non connecté' ? 'Connectez-vous pour voir votre historique' : 'Erreur lors du chargement de l\'historique'}</span>
          </div>
        `;
      });
  }
  
  /**
   * Affiche les emails de l'historique dans le panneau latéral
   */
  function displayEmailHistory(emails) {
  if (!emailHistoryList) return;

  if (emails.length === 0) {
      emailHistoryList.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        <p>Aucun email dans l'historique</p>
        </div>
      `;
      return;
    }
    
  emailHistoryList.innerHTML = emails.map(email => {
    const date = new Date(email.generated_at).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Préparer le contenu de l'email pour l'affichage
    let displayContent = email.email_content;
    // Limiter à 3 lignes maximum
    const lines = displayContent.split('\n').slice(0, 3);
    if (displayContent.split('\n').length > 3) {
      lines.push('...');
    }
    displayContent = lines.join('\n');

      return `
      <div class="email-history-item mb-4 p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors">
          <div class="flex justify-between items-start mb-2">
          <div class="text-sm text-primary">${date}</div>
          <div class="flex gap-2">
            <button onclick="deleteEmail('${email.id}')" class="btn btn-ghost btn-xs text-error">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        <div class="whitespace-pre-wrap text-sm mb-2 cursor-pointer hover:opacity-80" onclick="showFullEmailModal(\`${email.email_content.replace(/`/g, '\\`')}\`)">${displayContent}</div>
        <div class="flex flex-wrap gap-2 mb-2">
            ${email.tone ? `<span class="badge badge-sm">${email.tone}</span>` : ''}
            ${email.size ? `<span class="badge badge-sm">${email.size}</span>` : ''}
            ${email.response_type ? `<span class="badge badge-sm">${email.response_type}</span>` : ''}
          </div>
        <button class="btn btn-sm btn-outline w-full" onclick="applyEmailOptions('${email.tone}', '${email.size}', '${email.response_type}')">
          Utiliser les options
            </button>
        </div>
      `;
    }).join('');
}
  

  // Exposer loadEmailHistory globalement pour qu'il puisse être appelé depuis generate_page.js
  console.log('Exposition de loadEmailHistory globalement');
  window.loadEmailHistory = loadEmailHistory;

  // Ajouter les styles d'animation au head
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translate(-50%, -60%); }
      to { opacity: 1; transform: translate(-50%, -50%); }
    }
    
    @keyframes fadeOut {
      from { opacity: 1; transform: translate(-50%, -50%); }
      to { opacity: 0; transform: translate(-50%, -40%); }
    }
    
    .animate-fade-in {
      animation: fadeIn 0.3s ease-out forwards;
    }
    
    .animate-fade-out {
      animation: fadeOut 0.3s ease-out forwards;
    }
  `;
  document.head.appendChild(style);

// Fonction pour afficher le contenu complet d'un email dans un modal
window.showFullEmailModal = function(emailContent) {
  let modal = document.getElementById('full-email-modal');
  if (!modal) {
    modal = document.createElement('dialog');
    modal.id = 'full-email-modal';
    modal.className = 'modal';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div class="modal-box max-w-4xl">
      <div class="flex justify-between items-center mb-4">
        <h3 class="font-bold text-lg">Email complet</h3>
        <button class="btn btn-sm btn-circle btn-ghost" onclick="document.getElementById('full-email-modal').close()">✕</button>
      </div>
      <div class="email-content-wrapper p-4 rounded-lg">
        ${emailContent}
      </div>
    </div>
  `;

  modal.showModal();
}

// Fonction pour appliquer les options d'un email
window.applyEmailOptions = function(tone, size, responseType) {
  // Réinitialiser toutes les sélections
  document.querySelectorAll('.btn-emotion').forEach(btn => btn.classList.remove('btn-primary'));
  document.querySelectorAll('.btn-size').forEach(btn => btn.classList.remove('btn-primary'));
  document.querySelectorAll('.btn-response-type').forEach(btn => btn.classList.remove('btn-primary'));

  // Appliquer le ton (peut avoir plusieurs valeurs séparées par des virgules)
  const tones = tone.split(',').map(t => t.trim());
  tones.forEach(t => {
    const toneBtn = document.querySelector(`.btn-emotion[data-emotion="${t.toLowerCase()}"]`);
    if (toneBtn) toneBtn.classList.add('btn-primary');
  });

  // Appliquer la taille
  const sizeBtn = document.querySelector(`.btn-size[data-emotion="${size.toLowerCase()}"]`);
  if (sizeBtn) sizeBtn.classList.add('btn-primary');

  // Appliquer le type de réponse
  const responseTypeBtn = document.querySelector(`.btn-response-type[data-response-type="${responseType.toLowerCase()}"]`);
  if (responseTypeBtn) responseTypeBtn.classList.add('btn-primary');

  // Mettre à jour les variables globales
  if (window.selectedEmotions) {
    window.selectedEmotions.clear();
    tones.forEach(t => window.selectedEmotions.add(t.toLowerCase()));
  }
  if (typeof window.selectedSize !== 'undefined') {
    window.selectedSize = size.toLowerCase();
  }
  if (typeof window.selectedResponseType !== 'undefined') {
    window.selectedResponseType = responseType.toLowerCase();
  }

  // Afficher une notification
  showToast('success', 'Options appliquées avec succès');
}
