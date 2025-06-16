window.addEventListener("DOMContentLoaded", () => {
const errorBox = document.querySelector(".alert-error");
if (errorBox) {
    setTimeout(() => {
    errorBox.remove();
    }, 5000);
}
});

function showLogin() {
document.getElementById("form-login").classList.remove("hidden");
document.getElementById("form-signup").classList.add("hidden");
document.getElementById("tab-login").classList.add("tab-active");
document.getElementById("tab-signup").classList.remove("tab-active");
}

function showSignUp() {
document.getElementById("form-login").classList.add("hidden");
document.getElementById("form-signup").classList.remove("hidden");
document.getElementById("tab-login").classList.remove("tab-active");
document.getElementById("tab-signup").classList.add("tab-active");
}

function goToStep2() {
const email = document.querySelector("#reg-email").value;
const password = document.querySelector("#reg-password").value;
const confirm = document.querySelector("#reg-confirm").value;

if (!email || !password || !confirm) return alert("Veuillez remplir tous les champs");
if (password !== confirm) return alert("Les mots de passe ne correspondent pas");

fetch('/check-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
})
.then(res => res.json())
.then(data => {
    if (data.exists) return alert("Cette adresse e-mail est déjà utilisée.");
    return fetch('/send-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
    });
})
.then(res => res?.json?.())
.then(data => {
    if (data?.success) {
    document.getElementById("step1").classList.add("hidden");
    document.getElementById("step2").classList.remove("hidden");
    document.getElementById("confirm-email").innerText = document.querySelector("#reg-email").value;
    } else {
    alert(data?.error || 'Erreur lors de l’envoi du code.');
    }
})
.catch(() => alert("Erreur réseau"));
}

function submitRegister() {
const email = document.querySelector("#reg-email").value;
const password = document.querySelector("#reg-password").value;
const confirm_password = document.querySelector("#reg-confirm").value;
const code = document.querySelector('input[name="email_code"]').value;

fetch('/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code })
})
.then(res => res.json())
.then(data => {
    if (data.success) {
    fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, confirm_password, email_code: code })
    })
    .then(res => res.json())
    .then(data => {
        if (data.success) {
        const popup = document.getElementById('success-popup');
        popup.classList.remove('hidden');
        popup.scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.getElementById("step2").classList.add("hidden");
        document.getElementById("step1").classList.remove("hidden");
        document.getElementById("register-form").reset();
        setTimeout(() => popup.classList.add('hidden'), 5000);
        } else {
        alert(data.error || 'Erreur lors de l’enregistrement.');
        }
    });
    } else {
    alert(data.error || 'Code incorrect.');
    }
})
.catch(() => alert("Erreur réseau lors de la vérification du code."));
}
