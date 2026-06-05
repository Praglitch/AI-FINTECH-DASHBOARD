const usernameField = document.getElementById('username');
const passwordField = document.getElementById('password');

usernameField.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        e.preventDefault();
        passwordField.focus();
    }
});