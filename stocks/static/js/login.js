const usernameField = document.getElementById('username');
const passwordField = document.getElementById('password');
const loginForm = document.getElementById('loginForm');
const loginButton = document.getElementById('loginButton');
const btnText = loginButton.querySelector('.btn-text');
const btnSpinner = loginButton.querySelector('.btn-spinner');

usernameField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') e.preventDefault();
});
passwordField.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginForm.requestSubmit();
});

loginForm.addEventListener('submit', () => {
    btnText.style.display = 'none';
    btnSpinner.style.display = 'inline';
    loginButton.disabled = true;
});