// Fonction pour traiter les mails saisis manuellement
function processManualMails() {
    const senderEmail = document.getElementById('manual-sender-email').value.trim();
    const yourEmail = document.getElementById('manual-your-email').value.trim();
    const mailContent = document.getElementById('manual-mail-content').value.trim();
    
    if (!senderEmail || !yourEmail || !mailContent) {
        alert('Veuillez remplir tous les champs');
        return;
    }
    
    // Mise à jour de la variable globale pour identifier les mails de l'utilisateur
    window.userEmail = yourEmail;
    
    // Création de la structure HTML des mails
    const container = document.getElementById('mail-body');
    document.getElementById('mail-subject').innerHTML = `Conversation avec <strong>${senderEmail}</strong>`;
    
    const messagesBlocks = mailContent.split(/---+/).filter(block => block.trim());
    let html = '';
    
    if (messagesBlocks.length === 0) {
        // Si aucun séparateur, considérer tout comme un seul message
        const plainText = mailContent;
        const now = new Date();
        const formatted = now.toLocaleDateString('fr-CA') + ' ' + 
                         now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        html += createMessageHTML(plainText, senderEmail, formatted, false);
    } else {
        // Traiter chaque bloc de message
        messagesBlocks.forEach(block => {
            const lines = block.trim().split('\n');
            let from = '';
            let date = '';
            
            // Essayer de détecter l'expéditeur et la date
            for (let i = 0; i < Math.min(5, lines.length); i++) {
                const line = lines[i].trim();
                
                if (line.toLowerCase().startsWith('de:') || line.toLowerCase().startsWith('from:')) {
                    from = line.substring(line.indexOf(':') + 1).trim();
                }
                
                if (line.toLowerCase().startsWith('date:')) {
                    date = line.substring(line.indexOf(':') + 1).trim();
                }
            }
            
            // Si on n'a pas trouvé d'expéditeur, utiliser celui par défaut
            if (!from) from = senderEmail;
            
            // Si on n'a pas trouvé de date, utiliser la date actuelle
            if (!date) {
                const now = new Date();
                date = now.toLocaleDateString('fr-CA') + ' ' + 
                       now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }
            
            // Nettoyer le contenu en retirant les en-têtes
            let content = block;
            const headerEndIndex = Math.min(10, lines.length);
            for (let i = 0; i < headerEndIndex; i++) {
                const line = lines[i].trim();
                if (line === '') {
                    content = lines.slice(i + 1).join('\n');
                    break;
                }
            }
            
            const isMine = from.toLowerCase().includes(yourEmail.toLowerCase());
            html += createMessageHTML(content, isMine ? yourEmail : senderEmail, date, isMine);
        });
    }
    
    container.innerHTML = html;
    
    // Ajouter les événements aux boutons
    document.querySelectorAll('.select-context-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.classList.toggle('btn-primary');
            btn.classList.toggle('selected');
        });
    });
}

// Fonction pour créer le HTML d'un message
function createMessageHTML(content, from, date, isMine) {
    // Nettoyer le HTML si la fonction est disponible
    const safeContent = window.sanitizeHtml ? window.sanitizeHtml(content) : content;
    
    return `
        <div class="chat ${isMine ? 'chat-end' : 'chat-start'}">
            <div class="chat-header">
                ${from} <time class="text-xs opacity-50">${date}</time>
            </div>
            <div class="chat-bubble chat-bubble-${isMine ? 'primary' : 'secondary'} email-content">
                ${safeContent}
            </div>
            <div class="chat-footer opacity-50">
                <button class="select-context-btn btn btn-xs btn-outline mt-2" data-content="${encodeURIComponent(content)}" data-date="${date}">Utiliser ce message</button>
            </div>
        </div>`;
}

// Initialiser les écouteurs d'événements pour la saisie manuelle
document.addEventListener('DOMContentLoaded', function() {
    const openManualMailBtn = document.getElementById('open-manual-mail-btn');
    const showManualMailBtn = document.getElementById('show-manual-mail');
    const submitManualMailBtn = document.getElementById('submit-manual-mail');
    const manualMailModal = document.getElementById('manual-mail-modal');
    
    if (openManualMailBtn) {
        openManualMailBtn.addEventListener('click', () => {
            setTimeout(() => {
                if (manualMailModal) manualMailModal.showModal();
            }, 300); // Délai pour laisser la première modale se fermer
        });
    }
    
    if (showManualMailBtn) {
        showManualMailBtn.addEventListener('click', () => {
            if (manualMailModal) manualMailModal.showModal();
        });
    }
    
    if (submitManualMailBtn) {
        submitManualMailBtn.addEventListener('click', () => {
            processManualMails();
            if (manualMailModal) manualMailModal.close();
        });
    }
});
