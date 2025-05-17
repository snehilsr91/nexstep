document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '';
    
    const loadingSpinner = document.getElementById('loadingSpinner');
    const mainContent = document.getElementById('mainContent');
    const roadmapsContainer = document.getElementById('roadmapsContainer');
    const username = document.getElementById('username');
    const logoutBtn = document.getElementById('logoutBtn');
    
    const goalFilter = document.getElementById('goalFilter');
    const searchFilter = document.getElementById('searchFilter');
    const applyFiltersBtn = document.getElementById('applyFiltersBtn');
    
    const token = localStorage.getItem('nexstepToken');
    if (!token) {
        window.location.href = 'auth.html';
        return;
    }
    
    const userInfo = JSON.parse(localStorage.getItem('nexstepUser') || '{}');
    if (userInfo.username) {
        username.textContent = userInfo.username;
    }
    
    const showLoading = () => {
        loadingSpinner.style.display = 'block';
        mainContent.style.opacity = '0.5';
    };
    
    const hideLoading = () => {
        loadingSpinner.style.display = 'none';
        mainContent.style.opacity = '1';
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
    
    const getQueryParam = (param) => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    };
    
    const loadGoals = async () => {
        try {
            const data = await fetchAPI('/api/goals');
            goalFilter.innerHTML = '<option value="">All Goals</option>';
            data.data.forEach(goal => {
                const option = document.createElement('option');
                option.value = goal._id;
                option.textContent = goal.name;
                goalFilter.appendChild(option);
            });
            
            const goalId = getQueryParam('goalId');
            if (goalId) {
                goalFilter.value = goalId;
            }
        } catch (error) {
            console.error('Error loading goals:', error);
            alert(`Failed to load goals: ${error.message}`);
        }
    };
    
    const loadRoadmaps = async () => {
        try {
            showLoading();
            const goalId = goalFilter.value;
            const searchTerm = searchFilter.value.trim();
            let queryString = '';
            if (goalId) {
                queryString += `goalId=${goalId}`;
            }
            const endpoint = `/api/roadmaps${queryString ? `?${queryString}` : ''}`;
            const data = await fetchAPI(endpoint);
            roadmapsContainer.innerHTML = '';
            if (data.data.length === 0) {
                roadmapsContainer.innerHTML = `
                    <div class="col-12 text-center py-5">
                        <i class="fas fa-route fa-4x mb-3 text-muted"></i>
                        <h3>No Roadmaps Found</h3>
                        <p>Try adjusting your filters or check back later.</p>
                    </div>
                `;
                hideLoading();
                return;
            }
            let filteredRoadmaps = data.data;
            if (searchTerm) {
                filteredRoadmaps = data.data.filter(roadmap => 
                    roadmap.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (roadmap.description && roadmap.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                    (roadmap.tags && roadmap.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
                );
                
                if (filteredRoadmaps.length === 0) {
                    roadmapsContainer.innerHTML = `
                        <div class="col-12 text-center py-5">
                            <i class="fas fa-search fa-4x mb-3 text-muted"></i>
                            <h3>No Results Found</h3>
                            <p>No roadmaps match your search criteria.</p>
                        </div>
                    `;
                    hideLoading();
                    return;
                }
            }
            filteredRoadmaps.forEach(roadmap => {
                const roadmapCard = document.createElement('div');
                roadmapCard.className = 'col-md-4 mb-4';
                
                let tagsHtml = '';
                if (roadmap.tags && roadmap.tags.length > 0) {
                    tagsHtml = `
                        <div class="roadmap-tags mt-2">
                            ${roadmap.tags.map(tag => `<span class="badge tag-badge">${tag}</span>`).join('')}
                        </div>
                    `;
                }
                
                let goalBadge = '';
                if (roadmap.goal) {
                    goalBadge = `<span class="badge bg-secondary mb-2">Goal: ${roadmap.goal.name}</span>`;
                }
                
                roadmapCard.innerHTML = `
                    <div class="card roadmap-card">
                        <div class="card-body">
                            ${goalBadge}
                            <h4 class="card-title text-light">${roadmap.title}</h4>
                            <p class="card-text text-light">${roadmap.description || 'No description available'}</p>
                            ${tagsHtml}
                            <div class="mt-3">
                                <p class="text-light small">${roadmap.estimatedDuration || 'Duration not specified'}</p>
                            </div>
                            <a href="roadmap.html?id=${roadmap._id}" class="btn btn-primary mt-auto">View Roadmap</a>
                        </div>
                    </div>
                `;
                
                roadmapsContainer.appendChild(roadmapCard);
            });
            
            hideLoading();
        } catch (error) {
            console.error('Error loading roadmaps:', error);
            hideLoading();
            roadmapsContainer.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="fas fa-exclamation-circle fa-4x mb-3 text-danger"></i>
                    <h3>Error</h3>
                    <p>Failed to load roadmaps: ${error.message}</p>
                </div>
            `;
        }
    };
    
    applyFiltersBtn.addEventListener('click', loadRoadmaps);
    
    searchFilter.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            loadRoadmaps();
        }
    });
    
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('nexstepToken');
        localStorage.removeItem('nexstepUser');
        window.location.href = 'auth.html';
    });
    
    const init = async () => {
        await loadGoals();
        await loadRoadmaps();
    };
    
    init();
});
