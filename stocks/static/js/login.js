const usernameField = document.getElementById('username');
const passwordField = document.getElementById('password');
const loginForm = document.getElementById('loginForm');
const loginButton = document.getElementById('loginButton');
const btnText = loginButton.querySelector('.btn-text');
const btnSpinner = loginButton.querySelector('.btn-spinner');

// Pressing Enter in username field → move to password field
usernameField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        passwordField.focus();
    }
});

// Pressing Enter in password field → submit the form
passwordField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        loginForm.requestSubmit();
    }
});

loginForm.addEventListener('submit', () => {
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline';
    loginButton.disabled = true;
});