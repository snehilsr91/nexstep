document.addEventListener('DOMContentLoaded', () => {
    const API_BASE_URL = '';
    
    const loadingSpinner = document.getElementById('loadingSpinner');
    const mainContent = document.getElementById('mainContent');
    const roadmapTitle = document.getElementById('roadmapTitle');
    const roadmapDescription = document.getElementById('roadmapDescription');
    const goalBadge = document.getElementById('goalBadge');
    const estimatedDuration = document.getElementById('estimatedDuration');
    const progressPercentage = document.getElementById('progressPercentage');
    const progressBar = document.getElementById('progressBar');
    const roadmapContent = document.getElementById('roadmapContent');
    const username = document.getElementById('username');
    const logoutBtn = document.getElementById('logoutBtn');

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

    const roadmapId = getQueryParam('id');
    if (!roadmapId) {
        roadmapTitle.textContent = 'Roadmap not found';
        roadmapDescription.textContent = 'Please select a roadmap from the dashboard.';
        return;
    }

    const loadRoadmapDetails = async () => {
        try {
            showLoading();

            const roadmapData = await fetchAPI(`/api/roadmaps/${roadmapId}`);
            const progressData = await fetchAPI(`/api/progress/roadmap/${roadmapId}`);

            const roadmap = roadmapData.data;

            roadmapTitle.textContent = roadmap.title;
            roadmapDescription.textContent = roadmap.description || 'No description available';

            if (roadmap.goal) {
                goalBadge.textContent = roadmap.goal.name;
                goalBadge.style.display = 'inline-block';
            } else {
                goalBadge.style.display = 'none';
            }

            if (roadmap.estimatedDuration) {
                estimatedDuration.textContent = `Estimated duration: ${roadmap.estimatedDuration}`;
                estimatedDuration.style.color = '#ffffff';
            } else {
                estimatedDuration.textContent = 'Estimated duration: Not specified';
                estimatedDuration.style.color = '#ffffff';
            }

            const percent = progressData.data.percentComplete || 0;
            progressPercentage.textContent = `${percent}%`;
            progressPercentage.style.color = '#ffffff';
            progressBar.style.width = `${percent}%`;

            roadmapContent.innerHTML = '';

            if (roadmap.pathItems && roadmap.pathItems.length > 0) {
                roadmap.pathItems.sort((a, b) => a.order - b.order);

                roadmap.pathItems.forEach((item, index) => {
                    const isLastItem = index === roadmap.pathItems.length - 1;
                    const pathItemElement = document.createElement('div');
                    pathItemElement.className = `path-item ${isLastItem ? 'last-item' : ''}`;

                    const itemProgress = progressData.data.pathItems.find(pi => pi._id === item._id);
                    const completedCount = itemProgress ? itemProgress.completedCount : 0;
                    const totalCount = itemProgress ? itemProgress.totalCount : 0;
                    const itemProgressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

                    let resourcesHtml = '';
                    if (item.resources && item.resources.length > 0) {
                        resourcesHtml = '<div class="resource-list">';
                        item.resources.forEach(resource => {
                            const resourceStatus = progressData.data.resourceStatus[resource._id] || 'incomplete';
                            const isCompleted = resourceStatus === 'completed';

                            let typeClass = 'type-other';
                            switch(resource.type.toLowerCase()) {
                                case 'video': typeClass = 'type-video'; break;
                                case 'article': typeClass = 'type-article'; break;
                                case 'course': typeClass = 'type-course'; break;
                                case 'book': typeClass = 'type-book'; break;
                            }

                            const rating = resource.avgRating || 0;
                            const ratingStars = Array(5).fill().map((_, i) => 
                                `<i class="${i < Math.round(rating) ? 'fas' : 'far'} fa-star" style="color: #ffffff;"></i>`
                            ).join('');

                            resourcesHtml += `
                                <div class="resource-card ${isCompleted ? 'bg-success bg-opacity-10' : ''}">
                                    <div class="d-flex justify-content-between align-items-start">
                                        <div>
                                            <h5>
                                                <a href="${resource.url}" target="_blank" class="text-light">
                                                    ${resource.title}
                                                </a>
                                            </h5>
                                            <div>
                                                <span class="resource-type ${typeClass}">${resource.type}</span>
                                                <span class="resource-rating">${ratingStars}</span>
                                                <small style="color: #ffffff;">(${resource.ratingsCount || 0} ratings)</small>
                                            </div>
                                        </div>
                                        <div>
                                            ${isCompleted ? 
                                                '<span class="badge bg-success">Completed</span>' : 
                                                `<button class="btn btn-sm btn-outline-light mark-complete-btn" data-resource-id="${resource._id}">Mark Complete</button>`
                                            }
                                        </div>
                                    </div>
                                </div>
                            `;
                        });
                        resourcesHtml += '</div>';
                    } else {
                        resourcesHtml = '<p style="color: #ffffff;">No resources available for this step</p>';
                    }

                    pathItemElement.innerHTML = `
                        <div class="progress-indicator"></div>
                        <h3>${item.title}</h3>
                        <p>${item.description || ''}</p>
                        <div class="progress-section mb-3">
                            <div class="d-flex justify-content-between">
                                <span>Progress</span>
                                <span>${completedCount}/${totalCount} resources</span>
                            </div>
                            <div class="progress mt-2">
                                <div class="progress-bar" role="progressbar" style="width: ${itemProgressPercent}%"></div>
                            </div>
                        </div>
                        ${resourcesHtml}
                    `;

                    roadmapContent.appendChild(pathItemElement);
                });

                document.querySelectorAll('.mark-complete-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        const resourceId = e.target.dataset.resourceId;
                        await markResourceComplete(resourceId);
                        loadRoadmapDetails();
                    });
                });
            } else {
                roadmapContent.innerHTML = '<p class="text-center text-muted">This roadmap has no content yet.</p>';
            }

            hideLoading();
        } catch (error) {
            console.error('Error loading roadmap details:', error);
            hideLoading();
            roadmapContent.innerHTML = `<p class="text-center text-danger">Error loading roadmap: ${error.message}</p>`;
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

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('nexstepToken');
        localStorage.removeItem('nexstepUser');
        window.location.href = 'auth.html';
    });

    loadRoadmapDetails();
});
