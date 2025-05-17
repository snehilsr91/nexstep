document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '';
    
    const loadingSpinner = document.getElementById('loadingSpinner');
    const mainContent = document.getElementById('mainContent');
    const roadmapProgressList = document.getElementById('roadmapProgressList');
    const noProgressMessage = document.getElementById('noProgressMessage');
    const username = document.getElementById('username');
    const logoutBtn = document.getElementById('logoutBtn');
    const roadmapsLink = document.getElementById('roadmapsLink');
    const profileLink = document.getElementById('profileLink');
    
    const totalRoadmaps = document.getElementById('totalRoadmaps');
    const totalResources = document.getElementById('totalResources');
    const completedResources = document.getElementById('completedResources');
    const overallProgress = document.getElementById('overallProgress');
    
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
    
    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };
    
    const loadUserProgress = async () => {
        try {
            showLoading();
            
            const userData = await fetchAPI('/api/auth/me');
            const currentGoalId = userData.user.currentGoal ? userData.user.currentGoal._id : null;
            
            if (!currentGoalId) {
                roadmapProgressList.innerHTML = '';
                noProgressMessage.style.display = 'block';
                
                totalRoadmaps.textContent = '0';
                totalResources.textContent = '0';
                completedResources.textContent = '0';
                overallProgress.textContent = '0%';
                
                hideLoading();
                return;
            }
            
            const roadmapsData = await fetchAPI(`/api/roadmaps?goalId=${currentGoalId}`);
            
            if (roadmapsData.data.length === 0) {
                roadmapProgressList.innerHTML = `
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        No roadmaps available for your current goal. Please select a different goal or check back later.
                    </div>
                `;
                noProgressMessage.style.display = 'none';
                
                totalRoadmaps.textContent = '0';
                totalResources.textContent = '0';
                completedResources.textContent = '0';
                overallProgress.textContent = '0%';
                
                hideLoading();
                return;
            }
            
            let allRoadmapsCount = roadmapsData.data.length;
            let allResourcesCount = 0;
            let allCompletedCount = 0;
            
            roadmapProgressList.innerHTML = '';
            noProgressMessage.style.display = 'none';
            
            for (const roadmap of roadmapsData.data) {
                const progressData = await fetchAPI(`/api/progress/roadmap/${roadmap._id}`);
                
                const pathItemsData = await fetchAPI(`/api/pathItems/roadmap/${roadmap._id}`);
                
                let roadmapResourceCount = 0;
                pathItemsData.data.forEach(item => {
                    if (item.resources) {
                        roadmapResourceCount += item.resources.length;
                    }
                });
                
                allResourcesCount += roadmapResourceCount;
                allCompletedCount += progressData.data.completedCount || 0;
                
                const roadmapCard = document.createElement('div');
                roadmapCard.className = 'roadmap-progress';
                
                roadmapCard.innerHTML = `
                    <div class="card">
                        <div class="card-header">
                            <h5>${roadmap.title}</h5>
                            <span class="badge bg-${progressData.data.percentComplete >= 100 ? 'success' : 'primary'}">
                                ${progressData.data.percentComplete || 0}% Complete
                            </span>
                        </div>
                        <div class="card-body">
                            <div class="progress mb-4">
                                <div class="progress-bar" role="progressbar" 
                                    style="width: ${progressData.data.percentComplete || 0}%" 
                                    aria-valuenow="${progressData.data.percentComplete || 0}" 
                                    aria-valuemin="0" aria-valuemax="100">
                                </div>
                            </div>
                            <div class="path-items-container">
                            </div>
                            <div class="text-end mt-3">
                                <a href="roadmap.html?id=${roadmap._id}" class="btn btn-primary btn-sm">
                                    View Full Roadmap
                                </a>
                            </div>
                        </div>
                    </div>
                `;
                
                const pathItemsContainer = roadmapCard.querySelector('.path-items-container');
                
                if (progressData.data.pathItems && progressData.data.pathItems.length > 0) {
                    progressData.data.pathItems.forEach((item, index) => {
                        const isLastItem = index === progressData.data.pathItems.length - 1;
                        const pathItemElement = document.createElement('div');
                        pathItemElement.className = `path-item-progress ${isLastItem ? 'last-item' : ''}`;
                        
                        const pathItemData = pathItemsData.data.find(pi => pi._id === item._id);
                        let resourcesHtml = '';
                        
                        if (pathItemData && pathItemData.resources && pathItemData.resources.length > 0) {
                            const displayResources = pathItemData.resources.slice(0, 3);
                            const remainingCount = pathItemData.resources.length - 3;
                            
                            resourcesHtml = '<div class="resources-list mt-2">';
                            displayResources.forEach(resource => {
                                const resourceStatus = progressData.data.resourceStatus[resource._id] || 'incomplete';
                                const isCompleted = resourceStatus === 'completed';
                                const completionDate = progressData.data.completionDates[resource._id];
                                
                                resourcesHtml += `
                                    <div class="resource-progress">
                                        <div>
                                            <i class="fas ${isCompleted ? 'fa-check-circle completed' : 'fa-circle incomplete'}"></i>
                                            <a href="${resource.url}" target="_blank" class="ms-2">${resource.title}</a>
                                            ${isCompleted && completionDate ? 
                                                `<div class="completion-date">Completed on ${formatDate(completionDate)}</div>` : 
                                                ''}
                                        </div>
                                        <div>
                                            <span class="badge bg-${resource.type === 'video' ? 'danger' : 
                                                resource.type === 'article' ? 'primary' : 
                                                resource.type === 'course' ? 'success' : 
                                                resource.type === 'book' ? 'warning' : 'secondary'}">                                                
                                                ${resource.type}
                                            </span>
                                        </div>
                                    </div>
                                `;
                            });
                            
                            if (remainingCount > 0) {
                                resourcesHtml += `
                                    <div class="text-center mt-2">
                                        <a href="roadmap.html?id=${roadmap._id}" class="text-muted">
                                            + ${remainingCount} more resources
                                        </a>
                                    </div>
                                `;
                            }
                            
                            resourcesHtml += '</div>';
                        } else {
                            resourcesHtml = '<p class="text-muted small">No resources available</p>';
                        }
                        
                        pathItemElement.innerHTML = `
                            <div class="progress-indicator"></div>
                            <h5>${item.title}</h5>
                            <div class="d-flex justify-content-between align-items-center mb-2">
                                <div class="progress-text">
                                    <span class="text-muted">${item.completedCount}/${item.totalCount} resources</span>
                                </div>
                                <div class="progress" style="width: 100px;">
                                    <div class="progress-bar" role="progressbar" 
                                        style="width: ${item.totalCount > 0 ? (item.completedCount / item.totalCount) * 100 : 0}%">
                                    </div>
                                </div>
                            </div>
                            ${resourcesHtml}
                        `;
                        
                        pathItemsContainer.appendChild(pathItemElement);
                    });
                } else {
                    pathItemsContainer.innerHTML = '<p class="text-muted">No progress data available</p>';
                }
                
                roadmapProgressList.appendChild(roadmapCard);
            }
            
            totalRoadmaps.textContent = allRoadmapsCount;
            totalResources.textContent = allResourcesCount;
            completedResources.textContent = allCompletedCount;
            
            const overallPercentage = allResourcesCount > 0 ? 
                Math.round((allCompletedCount / allResourcesCount) * 100) : 0;
            overallProgress.textContent = `${overallPercentage}%`;
            
            hideLoading();
        } catch (error) {
            console.error('Error loading progress:', error);
            hideLoading();
            roadmapProgressList.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle me-2"></i>
                    Error loading progress: ${error.message}
                </div>
            `;
            noProgressMessage.style.display = 'none';
        }
    };
    
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
    
    profileLink.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'dashboard.html?section=profile';
    });
    
    loadUserProgress();
});