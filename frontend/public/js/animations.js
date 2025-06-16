// Animations avec Motion

console.log('Initialisation des animations Motion');

// Animation des cartes et conteneurs
const cards = document.querySelectorAll('.email-history-item, .chat-bubble, .card, .modal-box');
cards.forEach(card => {
  // Animation à l'apparition
  motion.animate(card, {
    opacity: [0, 1],
    y: [20, 0],
  }, {
    duration: 0.3,
    easing: 'ease-out',
  });
  
  // Animation au survol
  card.addEventListener('mouseenter', () => {
    motion.animate(card, {
      scale: 1.02,
    }, {
      duration: 0.2,
      easing: 'ease-out',
    });
  });
  
  card.addEventListener('mouseleave', () => {
    motion.animate(card, {
      scale: 1,
    }, {
      duration: 0.2,
      easing: 'ease-out',
    });
  });
});

// Animation des boutons
const buttons = document.querySelectorAll('button:not(.btn-ghost), .btn:not(.btn-ghost)');
buttons.forEach(button => {
  button.addEventListener('mouseenter', () => {
    motion.animate(button, {
      scale: 1.05,
    }, {
      duration: 0.2,
      easing: 'ease-out',
    });
  });
  
  button.addEventListener('mouseleave', () => {
    motion.animate(button, {
      scale: 1,
    }, {
      duration: 0.2,
      easing: 'ease-out',
    });
  });
  
  button.addEventListener('click', () => {
    motion.animate(button, {
      scale: [1.05, 1],
    }, {
      duration: 0.3,
      easing: 'ease-out',
    });
  });
});

// Animation des inputs
const inputs = document.querySelectorAll('input, textarea, select');
inputs.forEach(input => {
  input.addEventListener('focus', () => {
    motion.animate(input, {
      boxShadow: '0 0 0 3px rgba(66, 153, 225, 0.5)',
    }, {
      duration: 0.2,
      easing: 'ease-out',
    });
  });
  
  input.addEventListener('blur', () => {
    motion.animate(input, {
      boxShadow: '0 0 0 0px rgba(66, 153, 225, 0)',
    }, {
      duration: 0.2,
      easing: 'ease-out',
    });
  });
});

// Animation du texte généré par l'IA
const iaResponseElement = document.getElementById('ia-response');
if (iaResponseElement) {
  motion.animate(iaResponseElement, {
    opacity: [0, 1],
    y: [10, 0],
  }, {
    duration: 0.5,
    easing: 'ease-out',
  });
}

// Animation pour les modals
function setupModalAnimations() {
  const modals = document.querySelectorAll('dialog.modal');
  
  modals.forEach(modal => {
    // Observer les changements d'attributs pour détecter quand le modal s'ouvre
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.attributeName === 'open' && modal.hasAttribute('open')) {
          const modalBox = modal.querySelector('.modal-box');
          if (modalBox) {
            motion.animate(modalBox, {
              opacity: [0, 1],
              scale: [0.9, 1],
              y: [20, 0],
            }, {
              duration: 0.3,
              easing: 'ease-out',
            });
          }
        }
      });
    });
    
    observer.observe(modal, { attributes: true });
  });
}

setupModalAnimations();

// Animation pour les notifications
function animateToast(toast) {
  motion.animate(toast, {
    opacity: [0, 1],
    y: [20, 0],
  }, {
    duration: 0.3,
    easing: 'ease-out',
  });
  
  // Animation de disparition après 3 secondes
  setTimeout(() => {
    motion.animate(toast, {
      opacity: [1, 0],
      y: [0, -20],
    }, {
      duration: 0.3,
      easing: 'ease-in',
      onComplete: () => {
        toast.remove();
      },
    });
  }, 3000);
}

// Remplacer la fonction showToast
window.showToast = function(type, message) {
  const toast = document.createElement('div');
  toast.className = 'toast toast-end';
  toast.innerHTML = `
    <div class="alert alert-${type}">
      <span>${message}</span>
    </div>
  `;
  document.body.appendChild(toast);
  animateToast(toast);
};

// Surveillance de la page et ajout d'animations pour les éléments dynamiques
const bodyObserver = new MutationObserver(mutations => {
  mutations.forEach(mutation => {
    if (mutation.type === 'childList') {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) { // Element node
          // Animer les nouveaux modals
          if (node.matches('dialog.modal')) {
            const modalBox = node.querySelector('.modal-box');
            if (modalBox) {
              motion.animate(modalBox, {
                opacity: [0, 1],
                scale: [0.9, 1],
                y: [20, 0],
              }, {
                duration: 0.3,
                easing: 'ease-out',
              });
            }
          }
          
          // Animer les nouveaux toasts
          if (node.matches('.toast')) {
            animateToast(node);
          }
        }
      });
    }
  });
});

bodyObserver.observe(document.body, { childList: true, subtree: true });
