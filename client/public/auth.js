document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const loginMessage = document.getElementById('loginMessage');
    const registerMessage = document.getElementById('registerMessage');
    const learningGoalSelect = document.getElementById('learningGoal');

    const loginGoogleBtn = document.getElementById('loginGoogleBtn');
    const registerGoogleBtn = document.getElementById('registerGoogleBtn');

    const API_BASE_URL = '';
    const loadGoals = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/goals`);
            const data = await response.json();

            if (response.ok && data.data) {
                learningGoalSelect.innerHTML = '<option value="" disabled selected>Select your goal</option>';
                data.data.forEach(goal => {
                    const option = document.createElement('option');
                    option.value = goal._id;
                    option.textContent = goal.name;
                    learningGoalSelect.appendChild(option);
                });
            } else {
                console.error('Failed to load goals:', data.message);
            }
        } catch (error) {
            console.error('Error loading goals:', error);
        }
    };
    if (learningGoalSelect) {
        loadGoals();
    }
    const showMessage = (element, message, isError = true) => {
        element.textContent = message;
        element.className = 'message-area ' + (isError ? 'error' : 'success');
        element.style.display = 'block';
    
        setTimeout(() => {
            element.style.display = 'none';
        }, 5000);
    };

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showMessage(loginMessage, '');

            const emailOrUsername = loginForm.emailOrUsername.value.trim();
            const password = loginForm.password.value.trim();

            if (!emailOrUsername || !password) {
                showMessage(loginMessage, 'Please fill in all fields.');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ emailOrUsername, password }),
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showMessage(loginMessage, 'Login successful! Redirecting...', false);
                    localStorage.setItem('nexstepToken', data.token);
                    localStorage.setItem('nexstepUser', JSON.stringify(data.user));
                    window.location.href = 'dashboard.html';
                } else {
                    showMessage(loginMessage, data.message || 'Login failed. Please check your credentials.');
                }
            } catch (error) {
                console.error('Login error:', error);
                showMessage(loginMessage, 'An error occurred. Please try again.');
            }
        });
    }
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            showMessage(registerMessage, '');

            const name = registerForm.name.value.trim();
            const username = registerForm.username.value.trim();
            const email = registerForm.email.value.trim();
            const password = registerForm.password.value.trim();
            const confirmPassword = registerForm.confirmPassword.value.trim();
            const goalId = registerForm.goalName.value;

            if (!name || !username || !email || !password || !confirmPassword || !goalId) {
                showMessage(registerMessage, 'Please fill in all fields.');
                return;
            }

            if (password !== confirmPassword) {
                showMessage(registerMessage, 'Passwords do not match.');
                return;
            }

            if (password.length < 6) {
                showMessage(registerMessage, 'Password must be at least 6 characters long.');
                return;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, username, email, password, goalId }),
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    showMessage(registerMessage, 'Registration successful! Redirecting to dashboard...', false);
                    localStorage.setItem('nexstepToken', data.token);
                    localStorage.setItem('nexstepUser', JSON.stringify(data.user));
                    window.location.href = 'dashboard.html';
                } else {
                    showMessage(registerMessage, data.message || 'Registration failed. Please try again.');
                }
            } catch (error) {
                console.error('Registration error:', error);
                showMessage(registerMessage, 'An error occurred. Please try again.');
            }
        });
    }

    if (loginGoogleBtn) {
        loginGoogleBtn.addEventListener('click', () => {
            window.location.href = `${API_BASE_URL}/api/auth/google`;
        });
    }
    if (registerGoogleBtn) {
        registerGoogleBtn.addEventListener('click', () => {
            window.location.href = `${API_BASE_URL}/api/auth/google`;
        });
    }

    const handleGoogleToken = () => {
        const urlParams = new URLSearchParams(window.location.search);
        const googleToken = urlParams.get('google_token');
        const googleError = urlParams.get('error');

        if (googleToken) {
            localStorage.setItem('nexstepToken', googleToken);
            fetch(`${API_BASE_URL}/api/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${googleToken}`
                }
            })
            .then(res => res.json())
            .then(data => {
                if (data.success && data.user) {
                    localStorage.setItem('nexstepUser', JSON.stringify(data.user));
                    showMessage(loginMessage, 'Google login successful! Redirecting...', false);
                } else {
                     showMessage(loginMessage, 'Google login succeeded, but failed to fetch user details.', true);
                }
                window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            })
            .catch(err => {
                console.error("Error fetching user after Google auth:", err);
                showMessage(loginMessage, 'Google login succeeded, but an error occurred fetching user details.', true);
                window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
                 setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);
            });


        } else if (googleError) {
            const errorMessage = googleError === 'google_auth_failed' ? 'Google authentication failed. Please try again.' : 'An error occurred with Google Sign-In.';
            if(window.location.hash === '#register' && registerMessage) {
                showMessage(registerMessage, errorMessage);
            } else if (loginMessage) {
                showMessage(loginMessage, errorMessage);
            }
            window.history.replaceState({}, document.title, window.location.pathname + window.location.hash);
        }
    };

    handleGoogleToken();

});