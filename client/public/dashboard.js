document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '';
    
    const loadingSpinner = document.getElementById('loadingSpinner');
    const dashboardContent = document.getElementById('dashboardContent');
    const roadmapsSection = document.getElementById('roadmapsSection');
    const goalsSection = document.getElementById('goalsSection');
    const progressSection = document.getElementById('progressSection');
    const profileSection = document.getElementById('profileSection');
    
    const roadmapsLink = document.getElementById('roadmapsLink');
    const goalsLink = document.getElementById('goalsLink');
    const progressLink = document.getElementById('progressLink');
    const profileLink = document.getElementById('profileLink');
    const logoutBtn = document.getElementById('logoutBtn');
    
    const username = document.getElementById('username');
    const userAvatar = document.getElementById('userAvatar');
    const userFullName = document.getElementById('userFullName');
    const userEmail = document.getElementById('userEmail');
    const currentGoal = document.getElementById('currentGoal');
    const changeGoalBtn = document.getElementById('changeGoalBtn');
    const goalSelector = document.getElementById('goalSelector');
    const goalSelect = document.getElementById('goalSelect');
    const saveGoalBtn = document.getElementById('saveGoalBtn');
    const cancelGoalBtn = document.getElementById('cancelGoalBtn');

    const roadmapTitle = document.getElementById('roadmapTitle');
    const roadmapDescription = document.getElementById('roadmapDescription');
    const progressPercentage = document.getElementById('progressPercentage');
    const progressBar = document.getElementById('progressBar');
    const roadmapItems = document.getElementById('roadmapItems');
    const viewAllRoadmapsBtn = document.getElementById('viewAllRoadmapsBtn');
    const allRoadmaps = document.getElementById('allRoadmaps');
    const allGoals = document.getElementById('allGoals');

    const profileForm = document.getElementById('profileForm');
    const profileName = document.getElementById('profileName');
    const profileUsername = document.getElementById('profileUsername');
    const profileEmail = document.getElementById('profileEmail');

    let currentUser = null;
    let currentRoadmapId = null;

    const token = localStorage.getItem('nexstepToken');
    if (!token) {
        window.location.href = 'auth.html';
    }
    
    const showLoading = () => {
        loadingSpinner.style.display = 'block';
    };
    

    const hideLoading = () => {
        loadingSpinner.style.display = 'none';
    };
    

    const showSection = (section) => {
        dashboardContent.style.display = 'none';
        roadmapsSection.style.display = 'none';
        goalsSection.style.display = 'none';
        progressSection.style.display = 'none';
        profileSection.style.display = 'none';
        
        section.style.display = 'flex';
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
            currentUser = data.user;
            
            username.textContent = currentUser.username;
            userFullName.textContent = currentUser.name;
            userEmail.textContent = currentUser.email;
            userAvatar.textContent = currentUser.name.charAt(0);
            
            profileName.value = currentUser.name;
            profileUsername.value = currentUser.username;
            profileEmail.value = currentUser.email;
            
            if (currentUser.currentGoal) {
                currentGoal.textContent = currentUser.currentGoal.name;
                loadRoadmapsForGoal(currentUser.currentGoal._id);
            } else {
                currentGoal.textContent = 'Not set';
            }
            
            hideLoading();
        } catch (error) {
            console.error('Error loading user profile:', error);
            hideLoading();
            alert('Failed to load user profile. Please try again.');
        }
    };

    const loadGoals = async () => {
        try {
            showLoading();
            const data = await fetchAPI('/api/goals');
            
            goalSelect.innerHTML = '<option value="">Select a goal...</option>';
            data.data.forEach(goal => {
                const option = document.createElement('option');
                option.value = goal._id;
                option.textContent = goal.name;
                if (currentUser.currentGoal && goal._id === currentUser.currentGoal._id) {
                    option.selected = true;
                }
                goalSelect.appendChild(option);
            });
            

            allGoals.innerHTML = '';
            data.data.forEach(goal => {
                const goalCard = document.createElement('div');
                goalCard.className = 'col-md-4 mb-4';
                goalCard.innerHTML = `
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">${goal.name}</h5>
                            <p class="card-text">${goal.description || 'No description available'}</p>
                            <button class="btn btn-primary select-goal-btn" data-goal-id="${goal._id}">Select Goal</button>
                        </div>
                    </div>
                `;
                allGoals.appendChild(goalCard);
            });
            
            document.querySelectorAll('.select-goal-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const goalId = e.target.dataset.goalId;
                    await updateUserGoal(goalId);
                    showSection(dashboardContent);
                });
            });
            
            hideLoading();
        } catch (error) {
            console.error('Error loading goals:', error);
            hideLoading();
            alert('Failed to load goals. Please try again.');
        }
    };
    
    const updateUserGoal = async (goalId) => {
        try {
            showLoading();
            const data = await fetchAPI('/api/users/profile', {
                method: 'PUT',
                body: JSON.stringify({ goalId })
            });
            
            currentUser = data.data;
            currentGoal.textContent = currentUser.currentGoal ? currentUser.currentGoal.name : 'Not set';
            

            if (currentUser.currentGoal) {
                loadRoadmapsForGoal(currentUser.currentGoal._id);
            }
            
            hideLoading();
            goalSelector.style.display = 'none';
        } catch (error) {
            console.error('Error updating goal:', error);
            hideLoading();
            alert('Failed to update goal. Please try again.');
        }
    };

    const loadRoadmapsForGoal = async (goalId) => {
        try {
            showLoading();
            const data = await fetchAPI(`/api/roadmaps?goalId=${goalId}`);
            

            allRoadmaps.innerHTML = '';
            data.data.forEach(roadmap => {
                const roadmapCard = document.createElement('div');
                roadmapCard.className = 'col-md-4 mb-4';
                roadmapCard.innerHTML = `
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">${roadmap.title}</h5>
                            <p class="card-text">${roadmap.description || 'No description available'}</p>
                            <p class="card-text"><small class="text-muted">Duration: ${roadmap.estimatedDuration || 'Not specified'}</small></p>
                            <button class="btn btn-primary view-roadmap-btn" data-roadmap-id="${roadmap._id}">View Roadmap</button>
                        </div>
                    </div>
                `;
                allRoadmaps.appendChild(roadmapCard);
            });

            document.querySelectorAll('.view-roadmap-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const roadmapId = e.target.dataset.roadmapId;
                    loadRoadmapDetails(roadmapId);
                    showSection(dashboardContent);
                });
            });
            
            if (data.data.length > 0 && !currentRoadmapId) {
                loadRoadmapDetails(data.data[0]._id);
            }
            
            hideLoading();
        } catch (error) {
            console.error('Error loading roadmaps:', error);
            hideLoading();
            alert('Failed to load roadmaps. Please try again.');
        }
    };
    
    const loadRoadmapDetails = async (roadmapId) => {
        try {
            showLoading();
            currentRoadmapId = roadmapId;
            
            const roadmapData = await fetchAPI(`/api/roadmaps/${roadmapId}`);
            const progressData = await fetchAPI(`/api/progress/roadmap/${roadmapId}`);
            
            const roadmap = roadmapData.data;
            
            roadmapTitle.textContent = roadmap.title;
            roadmapDescription.textContent = roadmap.description || 'No description available';
            
            const percent = progressData.data.percentComplete || 0;
            progressPercentage.textContent = `${percent}%`;
            progressBar.style.width = `${percent}%`;
            
            roadmapItems.innerHTML = '';
            
            if (roadmap.pathItems && roadmap.pathItems.length > 0) {
                roadmap.pathItems.forEach(item => {
                    const itemElement = document.createElement('div');
                    itemElement.className = 'roadmap-item';
                    
                    let resourcesHtml = '';
                    if (item.resources && item.resources.length > 0) {
                        resourcesHtml = '<div class="resources mt-2">';
                        item.resources.forEach(resource => {
                            const resourceStatus = progressData.data.resourceStatus[resource._id] || 'incomplete';
                            const statusBadge = resourceStatus === 'completed' ? 
                                '<span class="badge bg-success">Completed</span>' : 
                                '<span class="badge bg-secondary">Incomplete</span>';
                            
                            resourcesHtml += `
                                <div class="resource-item">
                                    <div class="d-flex justify-content-between align-items-center">
                                        <a href="${resource.url}" target="_blank" class="resource-link">${resource.title}</a>
                                        ${statusBadge}
                                    </div>
                                    <div class="mt-2">
                                        <button class="btn btn-sm btn-outline-light mark-complete-btn" data-resource-id="${resource._id}" ${resourceStatus === 'completed' ? 'disabled' : ''}>Mark Complete</button>
                                    </div>
                                </div>
                            `;
                        });
                        resourcesHtml += '</div>';
                    } else {
                        resourcesHtml = '<p class="text-muted">No resources available</p>';
                    }
                    
                    itemElement.innerHTML = `
                        <h5>${item.title}</h5>
                        <p>${item.description || ''}</p>
                        <div class="progress mb-3">
                            <div class="progress-bar" role="progressbar" style="width: ${item.completedCount / (item.totalCount || 1) * 100}%"></div>
                        </div>
                        ${resourcesHtml}
                    `;
                    
                    roadmapItems.appendChild(itemElement);
                });
                
                document.querySelectorAll('.mark-complete-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const resourceId = e.target.dataset.resourceId;
                        await markResourceComplete(resourceId);
                        loadRoadmapDetails(currentRoadmapId); // Reload to update progress
                    });
                });
            } else {
                roadmapItems.innerHTML = '<p class="text-muted">No items in this roadmap</p>';
            }
            
            hideLoading();
        } catch (error) {
            console.error('Error loading roadmap details:', error);
            hideLoading();
            alert('Failed to load roadmap details. Please try again.');
        }
    };
    
    const markResourceComplete = async (resourceId) => {
        try {
            showLoading();
            await fetchAPI(`/api/progress/resource/${resourceId}`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'completed' })
            });
            hideLoading();
        } catch (error) {
            console.error('Error marking resource complete:', error);
            hideLoading();
            alert('Failed to update progress. Please try again.');
        }
    };
    
    const loadUserProgress = async () => {
        try {
            showLoading();
            
            if (currentUser.currentGoal) {
                const roadmapsData = await fetchAPI(`/api/roadmaps?goalId=${currentUser.currentGoal._id}`);
                
                const progressContent = document.getElementById('progressContent');
                progressContent.innerHTML = '';
                
                if (roadmapsData.data.length === 0) {
                    progressContent.innerHTML = '<p>No roadmaps available for your current goal.</p>';
                    hideLoading();
                    return;
                }
                
                for (const roadmap of roadmapsData.data) {
                    const progressData = await fetchAPI(`/api/progress/roadmap/${roadmap._id}`);
                    
                    const roadmapProgress = document.createElement('div');
                    roadmapProgress.className = 'card mb-4';
                    roadmapProgress.innerHTML = `
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <span>${roadmap.title}</span>
                            <span class="badge bg-primary">${progressData.data.percentComplete || 0}% Complete</span>
                        </div>
                        <div class="card-body">
                            <div class="progress mb-3">
                                <div class="progress-bar" role="progressbar" style="width: ${progressData.data.percentComplete || 0}%"></div>
                            </div>
                            <div class="roadmap-progress-items">
                                <!-- Path items will be added here -->
                            </div>
                        </div>
                    `;
                    
                    const roadmapProgressItems = roadmapProgress.querySelector('.roadmap-progress-items');
                    
                    if (progressData.data.pathItems && progressData.data.pathItems.length > 0) {
                        progressData.data.pathItems.forEach(item => {
                            const itemElement = document.createElement('div');
                            itemElement.className = 'roadmap-item';
                            itemElement.innerHTML = `
                                <h5>${item.title}</h5>
                                <div class="d-flex justify-content-between">
                                    <span>Progress</span>
                                    <span>${item.completedCount}/${item.totalCount} resources</span>
                                </div>
                                <div class="progress mt-2 mb-3">
                                    <div class="progress-bar" role="progressbar" style="width: ${item.completedCount / (item.totalCount || 1) * 100}%"></div>
                                </div>
                            `;
                            roadmapProgressItems.appendChild(itemElement);
                        });
                    } else {
                        roadmapProgressItems.innerHTML = '<p class="text-muted">No progress data available</p>';
                    }
                    
                    progressContent.appendChild(roadmapProgress);
                }
            } else {
                document.getElementById('progressContent').innerHTML = '<p>Please select a goal to track progress.</p>';
            }
            
            hideLoading();
        } catch (error) {
            console.error('Error loading user progress:', error);
            hideLoading();
            alert('Failed to load progress. Please try again.');
        }
    };
    
    const loadAllRoadmaps = async () => {
        try {
            showLoading();
            const data = await fetchAPI('/api/roadmaps');
            
            allRoadmaps.innerHTML = '';
            data.data.forEach(roadmap => {
                const roadmapCard = document.createElement('div');
                roadmapCard.className = 'col-md-4 mb-4';
                roadmapCard.innerHTML = `
                    <div class="card h-100">
                        <div class="card-body">
                            <h5 class="card-title">${roadmap.title}</h5>
                            <p class="card-text">${roadmap.description || 'No description available'}</p>
                            <p class="card-text"><small class="text-muted">Goal: ${roadmap.goal ? roadmap.goal.name : 'Not specified'}</small></p>
                            <button class="btn btn-primary view-roadmap-btn" data-roadmap-id="${roadmap._id}">View Roadmap</button>
                        </div>
                    </div>
                `;
                allRoadmaps.appendChild(roadmapCard);
            });
            
            document.querySelectorAll('.view-roadmap-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const roadmapId = e.target.dataset.roadmapId;
                    loadRoadmapDetails(roadmapId);
                    showSection(dashboardContent);
                });
            });
            
            hideLoading();
        } catch (error) {
            console.error('Error loading all roadmaps:', error);
            hideLoading();
            alert('Failed to load roadmaps. Please try again.');
        }
    };
    
    const updateUserProfile = async (name, username, email) => {
        try {
            showLoading();
            const data = await fetchAPI('/api/users/profile', {
                method: 'PUT',
                body: JSON.stringify({ name, username, email })
            });
            
            currentUser = data.data;
            
            // Update UI with user data
            document.getElementById('username').textContent = currentUser.username;
            userFullName.textContent = currentUser.name;
            userEmail.textContent = currentUser.email;
            userAvatar.textContent = currentUser.name.charAt(0);
            
            hideLoading();
            alert('Profile updated successfully!');
            showSection(dashboardContent);
        } catch (error) {
            console.error('Error updating profile:', error);
            hideLoading();
            alert(`Failed to update profile: ${error.message}`);
        }
    };
    
    roadmapsLink.addEventListener('click', (e) => {
        e.preventDefault();
        loadAllRoadmaps();
        showSection(roadmapsSection);
    });
    
    goalsLink.addEventListener('click', (e) => {
        e.preventDefault();
        loadGoals();
        showSection(goalsSection);
    });
    
    progressLink.addEventListener('click', (e) => {
        e.preventDefault();
        loadUserProgress();
        showSection(progressSection);
    });
    
    profileLink.addEventListener('click', (e) => {
        e.preventDefault();
        showSection(profileSection);
    });
    
    viewAllRoadmapsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        loadAllRoadmaps();
        showSection(roadmapsSection);
    });
    
    changeGoalBtn.addEventListener('click', () => {
        loadGoals();
        goalSelector.style.display = 'block';
    });
    
    saveGoalBtn.addEventListener('click', async () => {
        const goalId = goalSelect.value;
        if (goalId) {
            await updateUserGoal(goalId);
        }
    });
    
    cancelGoalBtn.addEventListener('click', () => {
        goalSelector.style.display = 'none';
    });
    
    profileForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = profileName.value.trim();
        const username = profileUsername.value.trim();
        const email = profileEmail.value.trim();
        
        if (!name || !username || !email) {
            alert('Please fill in all fields.');
            return;
        }
        
        await updateUserProfile(name, username, email);
    });
    
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('nexstepToken');
        localStorage.removeItem('nexstepUser');
        window.location.href = 'auth.html';
    });
    
    const initDashboard = async () => {
        await loadUserProfile();
        showSection(dashboardContent);
    };
    
    initDashboard();
});