document.addEventListener('DOMContentLoaded', () => {
    // API Base URL (empty string for relative paths)
    const API_BASE_URL = '';
    
    // DOM Elements
    const loadingSpinner = document.getElementById('loadingSpinner');
    const mainContent = document.getElementById('mainContent');
    const goalsContainer = document.getElementById('goalsContainer');
    const username = document.getElementById('username');
    const logoutBtn = document.getElementById('logoutBtn');
    const roadmapsLink = document.getElementById('roadmapsLink');
    const progressLink = document.getElementById('progressLink');
    const profileLink = document.getElementById('profileLink');
    
    // Check if user is logged in
    const token = localStorage.getItem('nexstepToken');
    if (!token) {
        window.location.href = 'auth.html'; // Redirect to login if no token
        return;
    }
    
    // Get user info from localStorage
    const userInfo = JSON.parse(localStorage.getItem('nexstepUser') || '{}');
    if (userInfo.username) {
        username.textContent = userInfo.username;
    }
    
    // Helper function to show loading spinner
    const showLoading = () => {
        loadingSpinner.style.display = 'block';
        mainContent.style.opacity = '0.5';
    };
    
    // Helper function to hide loading spinner
    const hideLoading = () => {
        loadingSpinner.style.display = 'none';
        mainContent.style.opacity = '1';
    };
    
    // Helper function for API calls
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
    
    // Load all goals
    const loadGoals = async () => {
        try {
            showLoading();
            const data = await fetchAPI('/api/goals');
            
            // Get current user to check current goal
            const userData = await fetchAPI('/api/auth/me');
            const currentGoalId = userData.user.currentGoal ? userData.user.currentGoal._id : null;
            
            // Populate goals container
            goalsContainer.innerHTML = '';
            
            if (data.data.length === 0) {
                goalsContainer.innerHTML = '<div class="col-12"><p class="text-center">No goals available yet.</p></div>';
                hideLoading();
                return;
            }
            
            data.data.forEach(goal => {
                const goalCard = document.createElement('div');
                goalCard.className = 'col-md-4 mb-4';
                
                // Determine icon based on goal.icon or use a default
                const iconClass = goal.icon || 'fa-graduation-cap';
                
                // Create roadmaps list if available
                let roadmapsHtml = '';
                if (goal.roadmaps && goal.roadmaps.length > 0) {
                    roadmapsHtml = `
                        <div class="goal-roadmaps">
                            <h6>Available Roadmaps:</h6>
                            <ul>
                                ${goal.roadmaps.map(roadmap => `<li>${roadmap.title}</li>`).join('')}
                            </ul>
                        </div>
                    `;
                }
                
                // Check if this is the current goal
                const isCurrentGoal = currentGoalId === goal._id;
                const currentGoalBadge = isCurrentGoal ? '<div class="current-goal-badge">Current Goal</div>' : '';
                
                goalCard.innerHTML = `
                    <div class="card goal-card">
                        ${currentGoalBadge}
                        <div class="card-body">
                            <div class="goal-icon">
                                <i class="fas ${iconClass}"></i>
                            </div>
                            <h4 class="card-title">${goal.name}</h4>
                            <p class="card-text">${goal.description || 'No description available'}</p>
                            ${roadmapsHtml}
                            <button class="btn btn-primary mt-3 select-goal-btn" data-goal-id="${goal._id}" ${isCurrentGoal ? 'disabled' : ''}>
                                ${isCurrentGoal ? 'Current Goal' : 'Select Goal'}
                            </button>
                            <a href="#" class="btn btn-outline-light mt-2 view-roadmaps-btn" data-goal-id="${goal._id}">View Roadmaps</a>
                        </div>
                    </div>
                `;
                
                goalsContainer.appendChild(goalCard);
            });
            
            // Add event listeners to buttons
            document.querySelectorAll('.select-goal-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    if (!e.target.disabled) {
                        const goalId = e.target.dataset.goalId;
                        await updateUserGoal(goalId);
                    }
                });
            });
            
            document.querySelectorAll('.view-roadmaps-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const goalId = e.target.dataset.goalId;
                    window.location.href = `dashboard.html?goalId=${goalId}&section=roadmaps`;
                });
            });
            
            hideLoading();
        } catch (error) {
            console.error('Error loading goals:', error);
            hideLoading();
            goalsContainer.innerHTML = `<div class="col-12"><p class="text-center text-danger">Error loading goals: ${error.message}</p></div>`;
        }
    };
    
    // Update user's current goal
    const updateUserGoal = async (goalId) => {
        try {
            showLoading();
            const data = await fetchAPI('/api/users/profile', {
                method: 'PUT',
                body: JSON.stringify({ goalId })
            });
            
            // Update user info in localStorage
            const userInfo = JSON.parse(localStorage.getItem('nexstepUser') || '{}');
            userInfo.currentGoal = data.data.currentGoal;
            localStorage.setItem('nexstepUser', JSON.stringify(userInfo));
            
            // Reload goals to update UI
            await loadGoals();
            
            // Show success message
            alert('Goal updated successfully!');
            
            hideLoading();
        } catch (error) {
            console.error('Error updating goal:', error);
            hideLoading();
            alert(`Failed to update goal: ${error.message}`);
        }
    };
    
    // Event Listeners
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
    
    progressLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'dashboard.html?section=progress';
    });
    
    profileLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'dashboard.html?section=profile';
    });
    
    // Initialize the page
    loadGoals();
});