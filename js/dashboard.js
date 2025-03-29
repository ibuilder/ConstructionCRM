/**
 * Dashboard JavaScript
 * 
 * This file handles the main dashboard functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Setup project selector change event
    const projectSelector = document.getElementById('projectSelector');
    if (projectSelector) {
        projectSelector.addEventListener('change', function() {
            const projectId = this.value;
            if (projectId) {
                updateDashboardForProject(projectId);
            }
        });
    }
});

/**
 * Updates the dashboard for the selected project
 * @param {string} projectId - The ID of the selected project
 */
function updateDashboardForProject(projectId) {
    // Get project data
    const project = getSimulatedProjectById(projectId);
    if (!project) return;
    
    // Update project completion progress
    updateProjectProgress(project);
    
    // Update budget utilization progress
    updateBudgetProgress(project);
}

/**
 * Updates project completion progress
 * @param {Object} project - The project object
 */
function updateProjectProgress(project) {
    const projectCompletionPercent = document.getElementById('projectCompletionPercent');
    const projectCompletionProgress = document.getElementById('projectCompletionProgress');
    
    if (projectCompletionPercent && projectCompletionProgress) {
        const completionValue = project.completion_percentage;
        projectCompletionPercent.textContent = `${completionValue}%`;
        projectCompletionProgress.style.width = `${completionValue}%`;
        projectCompletionProgress.setAttribute('aria-valuenow', completionValue);
        
        // Set color based on progress
        projectCompletionProgress.className = 'progress-bar';
        if (completionValue < 30) {
            projectCompletionProgress.classList.add('bg-danger');
        } else if (completionValue < 70) {
            projectCompletionProgress.classList.add('bg-warning');
        } else {
            projectCompletionProgress.classList.add('bg-success');
        }
    }
}

/**
 * Updates budget utilization progress
 * @param {Object} project - The project object
 */
function updateBudgetProgress(project) {
    const budgetUtilizationPercent = document.getElementById('budgetUtilizationPercent');
    const budgetUtilizationProgress = document.getElementById('budgetUtilizationProgress');
    
    if (budgetUtilizationPercent && budgetUtilizationProgress) {
        const spentPercentage = Math.round((project.spent_to_date / project.budget) * 100);
        budgetUtilizationPercent.textContent = `${spentPercentage}%`;
        budgetUtilizationProgress.style.width = `${spentPercentage}%`;
        budgetUtilizationProgress.setAttribute('aria-valuenow', spentPercentage);
        
        // Set color based on budget utilization compared to completion
        budgetUtilizationProgress.className = 'progress-bar';
        
        // If spending percentage is significantly higher than completion percentage, show warning
        const completionPercentage = project.completion_percentage;
        if (spentPercentage > completionPercentage * 1.15) {
            budgetUtilizationProgress.classList.add('bg-danger');
        } else if (spentPercentage > completionPercentage * 1.05) {
            budgetUtilizationProgress.classList.add('bg-warning');
        } else {
            budgetUtilizationProgress.classList.add('bg-info');
        }
    }
}

/**
 * Updates the recent activities list in the dashboard
 */
function updateRecentActivities() {
    const recentActivitiesList = document.getElementById('recentActivitiesList');
    if (!recentActivitiesList) return;
    
    // Clear current activities
    recentActivitiesList.innerHTML = '';
    
    // Add simulated recent activities
    const activities = [
        { type: 'calendar-alt', description: 'Downtown Office Tower: Foundation inspection scheduled', time: '2 hours ago' },
        { type: 'file-invoice-dollar', description: 'Riverside Apartments: Invoice #1012 approved', time: '5 hours ago' },
        { type: 'tasks', description: 'Westside Shopping Mall: Site preparation task completed', time: '1 day ago' },
        { type: 'exclamation-circle', description: 'Downtown Office Tower: Budget alert for Electrical division', time: '2 days ago' },
        { type: 'user-plus', description: 'New team member Sarah Davis added to Riverside Apartments', time: '3 days ago' }
    ];
    
    activities.forEach(activity => {
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center';
        li.innerHTML = `
            <div>
                <span class="badge bg-primary rounded-pill me-2">
                    <i class="fas fa-${activity.type}"></i>
                </span>
                ${activity.description}
            </div>
            <span class="text-muted small">${activity.time}</span>
        `;
        recentActivitiesList.appendChild(li);
    });
}