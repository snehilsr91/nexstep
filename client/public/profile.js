document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '';
    
    const loadingSpinner = document.getElementById('loadingSpinner');
    const mainContent = document.getElementById('mainContent');
    const profileForm = document.getElementById('profileForm');
    const profileMessage = document.getElementById('profileMessage');
    const usernameDisplay = document.getElementById('username');
    const profileAvatar = document.getElementById('profileAvatar');
    const profileName = document.getElementById('profileName');
    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');
    const currentGoal = document.getElementById('currentGoal');
    const changeGoalBtn = document.getElementById('changeGoalBtn');
    const goalSelector = document.getElementById('goalSelector');
    const goalSelect = document.getElementById('goalSelect');
    const saveGoalBtn = document.getElementById('saveGoalBtn');
    const cancelGoalBtn = document.getElementById('cancelGoalBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    const roadmapsLink = document.getElementById('roadmapsLink');
    

    const nameInput = document.getElementById('name');
    const usernameInput = document.getElementById('username');
    const emailInput = document.getElementById('email');
    

    const token = localStorage.getItem('nexstepToken');
    if (!token) {
        window.location.href = 'auth.html';
        return;
    }
    
    const showLoading = () => {
        loadingSpinner.style.display = 'block';
        mainContent.style.opacity = '0.5';
    };
    
    const hideLoading = () => {
        loadingSpinner.style.display = 'none';
        mainContent.style.opacity = '1';
    };
    

    const showMessage = (message, isError = true) => {
        profileMessage.textContent = message;
        profileMessage.className = `message-area ${isError ? 'error' : 'success'}`;
        profileMessage.style.display = 'block';
        
        setTimeout(() => {
            profileMessage.style.display = 'none';
        }, 5000);
    };
    
    const fetchAPI = async (endpoint, options = {}) => {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        };
        
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...defaultOptions,
            ...options
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.message || 'Something went wrong');
        }
        
        return data;
    };
    
    const loadUserProfile = async () => {
        try {
            showLoading();
            const data = await fetchAPI('/api/auth/me');
            const user = data.user;
            
            usernameDisplay.textContent = user.username;
            profileName.textContent = user.name;
            profileUsername.textContent = `@${user.username}`;
            profileEmail.textContent = user.email;
            profileAvatar.textContent = user.name.charAt(0);
            
            nameInput.value = user.name;
            usernameInput.value = user.username;
            emailInput.value = user.email;
            

            if (user.currentGoal) {
                currentGoal.textContent = user.currentGoal.name;
            } else {
                currentGoal.textContent = 'Not set';
            }
            
            hideLoading();
        } catch (error) {
            console.error('Error loading user profile:', error);
            hideLoading();
            showMessage(`Failed to load profile: ${error.message}`);
        }
    };
    
    const loadGoals = async () => {
        try {
            showLoading();
            const data = await fetchAPI('/api/goals');
            const userData = await fetchAPI('/api/auth/me');
            const currentGoalId = userData.user.currentGoal ? userData.user.currentGoal._id : null;
            
            goalSelect.innerHTML = '<option value="">Select a goal...</option>';
            data.data.forEach(goal => {
                const option = document.createElement('option');
                option.value = goal._id;
                option.textContent = goal.name;
                if (currentGoalId && goal._id === currentGoalId) {
                    option.selected = true;
                }
                goalSelect.appendChild(option);
            });
            
            hideLoading();
        } catch (error) {
            console.error('Error loading goals:', error);
            hideLoading();
            showMessage(`Failed to load goals: ${error.message}`);
        }
    };
    
    const updateUserProfile = async (name, username, email) => {
        try {
            showLoading();
            const data = await fetchAPI('/api/users/profile', {
                method: 'PUT',
                body: JSON.stringify({ name, username, email })
            });
            
            const user = data.data;
            
            usernameDisplay.textContent = user.username;
            profileName.textContent = user.name;
            profileUsername.textContent = `@${user.username}`;
            profileEmail.textContent = user.email;
            profileAvatar.textContent = user.name.charAt(0);
            
            const userInfo = JSON.parse(localStorage.getItem('nexstepUser') || '{}');
            userInfo.name = user.name;
            userInfo.username = user.username;
            userInfo.email = user.email;
            localStorage.setItem('nexstepUser', JSON.stringify(userInfo));
            
            hideLoading();
            showMessage('Profile updated successfully!', false);
        } catch (error) {
            console.error('Error updating profile:', error);
            hideLoading();
            showMessage(`Failed to update profile: ${error.message}`);
        }
    };
    
    const updateUserGoal = async (goalId) => {
        try {
            showLoading();
            const data = await fetchAPI('/api/users/profile', {
                method: 'PUT',
                body: JSON.stringify({ goalId })
            });
            
            const user = data.data;
            
            currentGoal.textContent = user.currentGoal ? user.currentGoal.name : 'Not set';
            
            const userInfo = JSON.parse(localStorage.getItem('nexstepUser') || '{}');
            userInfo.currentGoal = user.currentGoal;
            localStorage.setItem('nexstepUser', JSON.stringify(userInfo));
            
            hideLoading();
            goalSelector.style.display = 'none';
            showMessage('Goal updated successfully!', false);
        } catch (error) {
            console.error('Error updating goal:', error);
            hideLoading();
            showMessage(`Failed to update goal: ${error.message}`);
        }
    };
    
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = nameInput.value.trim();
        const username = usernameInput.value.trim();
        const email = emailInput.value.trim();
        
        if (!name || !username || !email) {
            showMessage('Please fill in all fields.');
            return;
        }
        
        await updateUserProfile(name, username, email);
    });
    

    changeGoalBtn.addEventListener('click', () => {
        loadGoals(); 
        goalSelector.style.display = 'block';
    });
    
    saveGoalBtn.addEventListener('click', async () => {
        const goalId = goalSelect.value;
        if (goalId) {
            await updateUserGoal(goalId);
        } else {

            await updateUserGoal(null);
        }
    });
    
    cancelGoalBtn.addEventListener('click', () => {
        goalSelector.style.display = 'none';
    });
    
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('nexstepToken');
        localStorage.removeItem('nexstepUser');
        window.location.href = 'auth.html';
    });
    
    roadmapsLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'dashboard.html?section=roadmaps';
    });

    loadUserProfile();
});