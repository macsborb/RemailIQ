// Handle mobile history panel toggling
function toggleHistoryPanel() {
  const historyPanel = document.querySelector('.email-history-panel');
  const overlay = document.querySelector('.mobile-nav-overlay');
  historyPanel.classList.toggle('show');
  overlay.classList.toggle('show');
}

// Handle contacts modal
function showContacts() {
  console.log('showContacts called');
  const modal = document.getElementById('contacts_modal');
  
  if (!modal) {
    console.error('Contacts modal not found');
    return;
  }

  // Charger les contacts quand on ouvre le modal
  if (typeof loadContacts === 'function') {
    console.log('Loading contacts');
    loadContacts();
  } else {
    console.log('loadContacts function not found');
  }

  modal.showModal();
}


// Close panels when clicking outside
document.addEventListener('click', (e) => {
  const historyPanel = document.querySelector('.email-history-panel');
  const historyToggle = document.querySelector('.history-toggle');
  const drawer = document.querySelector('.drawer-side');
  const drawerToggle = document.querySelector('#my-drawer');
  const overlay = document.querySelector('.mobile-nav-overlay');

  // Close history panel if clicking outside
  if (historyPanel && historyPanel.classList.contains('show')) {
    if (!historyPanel.contains(e.target) && !historyToggle.contains(e.target)) {
      historyPanel.classList.remove('show');
      overlay.classList.remove('show');
    }
  }

  // Close drawer if clicking outside
  if (drawer && drawer.classList.contains('show')) {
    if (!drawer.contains(e.target) && !e.target.closest('.contact-toggle')) {
      drawer.classList.remove('show');
      overlay.classList.remove('show');
    }
  }

  // Close everything when clicking overlay
  if (overlay && overlay.classList.contains('show') && e.target === overlay) {
    historyPanel.classList.remove('show');
    drawer.classList.remove('show');
    overlay.classList.remove('show');
  }
});

// Handle mobile viewport height issues
function setMobileHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
}

window.addEventListener('resize', setMobileHeight);
window.addEventListener('orientationchange', setMobileHeight);
setMobileHeight();
