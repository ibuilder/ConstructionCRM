/**
 * Procore API Integration for Construction CRM Dashboard
 * 
 * This file handles authentication and API calls to the Procore API
 */

// Procore API Configuration
const procoreApiConfig = {
    baseUrl: 'https://api.procore.com',
    apiVersion: 'v1.0',
    oauthUrl: 'https://login.procore.com/oauth/authorize',
    tokenUrl: 'https://login.procore.com/oauth/token',
    clientId: '',
    clientSecret: '',
    redirectUri: '',
    accessToken: null,
    refreshToken: null,
    tokenExpiry: null
};

// Check if the user is already authenticated
document.addEventListener('DOMContentLoaded', function() {
    const savedToken = localStorage.getItem('procoreAccessToken');
    const savedExpiry = localStorage.getItem('procoreTokenExpiry');
    
    if (savedToken && savedExpiry) {
        procoreApiConfig.accessToken = savedToken;
        procoreApiConfig.tokenExpiry = new Date(savedExpiry);
        
        // Check if token is expired or about to expire
        const now = new Date();
        const expiryBuffer = 5 * 60 * 1000; // 5 minutes buffer
        
        if (procoreApiConfig.tokenExpiry > new Date(now.getTime() + expiryBuffer)) {
            console.log('Procore: Using saved authentication');
            updateUIAfterAuth();
        } else {
            console.log('Procore: Token expired, need to re-authenticate');
            resetAuthState();
        }
    }
    
    // Setup authentication button handler
    const authBtn = document.getElementById('procoreAuthBtn');
    if (authBtn) {
        authBtn.addEventListener('click', initiateProcoreAuth);
    }
    
    // Setup authentication form submission handler
    const authSubmitBtn = document.getElementById('procoreAuthSubmit');
    if (authSubmitBtn) {
        authSubmitBtn.addEventListener('click', submitProcoreAuthForm);
    }
});

/**
 * Initiates the Procore authentication process by showing the auth modal
 */
function initiateProcoreAuth() {
    // Show the authentication modal
    const authModal = new bootstrap.Modal(document.getElementById('procoreAuthModal'));
    authModal.show();
}

/**
 * Submits the Procore authentication form and processes the OAuth flow
 */
function submitProcoreAuthForm() {
    const clientId = document.getElementById('clientId').value;
    const clientSecret = document.getElementById('clientSecret').value;
    const redirectUri = document.getElementById('redirectUri').value;
    
    if (!clientId || !clientSecret || !redirectUri) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Save the credentials for the OAuth flow
    procoreApiConfig.clientId = clientId;
    procoreApiConfig.clientSecret = clientSecret;
    procoreApiConfig.redirectUri = redirectUri;
    
    // Since we're using a simulated environment for the demo without real OAuth flow,
    // we'll simulate a successful authentication for demonstration purposes
    simulateSuccessfulAuth();
}

/**
 * Simulates a successful authentication with Procore
 * In a real implementation, this would be replaced with the actual OAuth flow
 */
function simulateSuccessfulAuth() {
    // Simulate a successful OAuth response
    const expiresIn = 3600; // 1 hour token
    const now = new Date();
    const expiryTime = new Date(now.getTime() + expiresIn * 1000);
    
    procoreApiConfig.accessToken = 'simulated_access_token_' + Math.random().toString(36).substring(7);
    procoreApiConfig.refreshToken = 'simulated_refresh_token_' + Math.random().toString(36).substring(7);
    procoreApiConfig.tokenExpiry = expiryTime;
    
    // Save the tokens to local storage
    localStorage.setItem('procoreAccessToken', procoreApiConfig.accessToken);
    localStorage.setItem('procoreRefreshToken', procoreApiConfig.refreshToken);
    localStorage.setItem('procoreTokenExpiry', procoreApiConfig.tokenExpiry.toISOString());
    
    // Close the modal
    const authModal = bootstrap.Modal.getInstance(document.getElementById('procoreAuthModal'));
    authModal.hide();
    
    // Update UI to reflect authenticated state
    updateUIAfterAuth();
    
    // Load projects
    loadProjects();
}

/**
 * Updates the UI to reflect that the user is authenticated
 */
function updateUIAfterAuth() {
    const authBtn = document.getElementById('procoreAuthBtn');
    if (authBtn) {
        authBtn.innerHTML = '<i class="fas fa-check-circle me-2"></i>Connected to Procore';
        authBtn.classList.remove('btn-primary');
        authBtn.classList.add('btn-success');
    }
    
    // Enable project selector
    const projectSelector = document.getElementById('projectSelector');
    if (projectSelector) {
        projectSelector.disabled = false;
    }
}

/**
 * Resets the authentication state
 */
function resetAuthState() {
    procoreApiConfig.accessToken = null;
    procoreApiConfig.refreshToken = null;
    procoreApiConfig.tokenExpiry = null;
    
    localStorage.removeItem('procoreAccessToken');
    localStorage.removeItem('procoreRefreshToken');
    localStorage.removeItem('procoreTokenExpiry');
    
    const authBtn = document.getElementById('procoreAuthBtn');
    if (authBtn) {
        authBtn.innerHTML = '<i class="fas fa-plug me-2"></i>Connect to Procore';
        authBtn.classList.remove('btn-success');
        authBtn.classList.add('btn-primary');
    }
    
    // Disable project selector
    const projectSelector = document.getElementById('projectSelector');
    if (projectSelector) {
        projectSelector.disabled = true;
    }
}

/**
 * Loads the list of projects from Procore
 */
function loadProjects() {
    // In a real implementation, this would make an API call to Procore
    // For demo purposes, we'll use simulated data
    const projects = getSimulatedProjects();
    populateProjectSelector(projects);
    
    // Update dashboard stats
    updateDashboardStats(projects);
}

/**
 * Populates the project selector dropdown with available projects
 * @param {Array} projects - The list of projects
 */
function populateProjectSelector(projects) {
    const projectSelector = document.getElementById('projectSelector');
    if (!projectSelector) return;
    
    // Clear existing options
    projectSelector.innerHTML = '<option selected value="">Select a project...</option>';
    
    // Add project options
    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = project.name;
        projectSelector.appendChild(option);
    });
    
    // Add change event listener
    projectSelector.addEventListener('change', function() {
        const projectId = this.value;
        if (projectId) {
            selectProject(projectId);
        }
    });
}

/**
 * Handles project selection
 * @param {string} projectId - The ID of the selected project
 */
function selectProject(projectId) {
    // In a real implementation, this would fetch project-specific data from Procore
    // For demo purposes, we'll use simulated data
    const project = getSimulatedProjectById(projectId);
    if (project) {
        if (typeof loadProjectSchedule === 'function') {
            loadProjectSchedule(project);
        }
        
        if (typeof loadProjectBudget === 'function') {
            loadProjectBudget(project);
        }
        
        // Update dashboard stats for the selected project
        updateDashboardForProject(projectId);
    }
}

/**
 * Makes an API call to Procore
 * @param {string} endpoint - The API endpoint
 * @param {Object} options - Request options
 * @returns {Promise} - Promise resolving to the API response
 */
async function callProcoreApi(endpoint, options = {}) {
    // Check if authenticated
    if (!procoreApiConfig.accessToken) {
        throw new Error('Not authenticated');
    }
    
    // In a real implementation, this would make actual API calls
    // For demo purposes, we'll simulate the API responses
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Parse endpoint and return simulated data
    if (endpoint.includes('/projects')) {
        return getSimulatedProjects();
    } else if (endpoint.includes('/schedule')) {
        const projectId = endpoint.match(/\/projects\/(\d+)/)[1];
        return getSimulatedProjectSchedule(projectId);
    } else if (endpoint.includes('/budget')) {
        const projectId = endpoint.match(/\/projects\/(\d+)/)[1];
        return getSimulatedProjectBudget(projectId);
    } else if (endpoint.includes('/invoices')) {
        const projectId = endpoint.match(/\/projects\/(\d+)/)[1];
        return getSimulatedProjectInvoices(projectId);
    }
    
    return { error: 'Endpoint not simulated' };
}

/**
 * Returns simulated project data
 * @returns {Array} - List of simulated projects
 */
function getSimulatedProjects() {
    return [
        {
            id: '1001',
            name: 'Downtown Office Tower',
            address: '123 Main St, Metropolis',
            status: 'active',
            start_date: '2025-01-15',
            estimated_completion_date: '2026-04-30',
            completion_percentage: 35,
            budget: 25000000,
            committed: 15500000,
            spent_to_date: 9750000,
            remaining: 15250000,
            invoiced: 10500000,
            paid: 8750000
        },
        {
            id: '1002',
            name: 'Riverside Apartments',
            address: '456 River Rd, Metropolis',
            status: 'active',
            start_date: '2024-11-01',
            estimated_completion_date: '2025-12-15',
            completion_percentage: 62,
            budget: 18500000,
            committed: 14800000,
            spent_to_date: 12100000,
            remaining: 6400000,
            invoiced: 12500000,
            paid: 11200000
        },
        {
            id: '1003',
            name: 'Westside Shopping Mall',
            address: '789 West Blvd, Metropolis',
            status: 'planning',
            start_date: '2025-05-01',
            estimated_completion_date: '2026-08-30',
            completion_percentage: 0,
            budget: 32000000,
            committed: 6500000,
            spent_to_date: 2100000,
            remaining: 29900000,
            invoiced: 2500000,
            paid: 2100000
        }
    ];
    
    // Add milestones
    const milestones = [
        {
            id: 'm1',
            name: 'Project Start',
            start: formatDate(startDate),
            end: formatDate(startDate),
            progress: 100,
            dependencies: '',
            status: 'completed',
            isMilestone: true,
            assignee: 'Project Team',
            department: 'Management',
            description: 'Official project start date.'
        },
        {
            id: 'm2',
            name: 'Foundation Complete',
            start: formatDate(addDays(startDate, 75)),
            end: formatDate(addDays(startDate, 75)),
            progress: projectProgress > 25 ? 100 : 0,
            dependencies: 't2',
            status: projectProgress > 25 ? 'completed' : 'not_started',
            isMilestone: true,
            assignee: 'Project Team',
            department: 'Management',
            description: 'All foundation work completed and inspected.'
        },
        {
            id: 'm3',
            name: 'Structure Complete',
            start: formatDate(addDays(startDate, 140)),
            end: formatDate(addDays(startDate, 140)),
            progress: projectProgress > 40 ? 100 : 0,
            dependencies: 't3',
            status: projectProgress > 40 ? 'completed' : 'not_started',
            isMilestone: true,
            assignee: 'Project Team',
            department: 'Management',
            description: 'Structural framing completed and inspected.'
        },
        {
            id: 'm4',
            name: 'Building Dried-In',
            start: formatDate(addDays(startDate, 200)),
            end: formatDate(addDays(startDate, 200)),
            progress: projectProgress > 55 ? 100 : 0,
            dependencies: 't4',
            status: projectProgress > 55 ? 'completed' : 'not_started',
            isMilestone: true,
            assignee: 'Project Team',
            department: 'Management',
            description: 'Building envelope completed and weather-tight.'
        },
        {
            id: 'm5',
            name: 'Project Complete',
            start: formatDate(endDate),
            end: formatDate(endDate),
            progress: projectProgress === 100 ? 100 : 0,
            dependencies: 't7',
            status: projectProgress === 100 ? 'completed' : 'not_started',
            isMilestone: true,
            assignee: 'Project Team',
            department: 'Management',
            description: 'Project fully completed and turned over to owner.'
        }
    ];
    
    return {
        tasks: [...tasks, ...milestones],
        projectStartDate: formatDate(startDate),
        projectEndDate: formatDate(endDate),
        stats: {
            totalTasks: tasks.length + milestones.length,
            completed: [...tasks, ...milestones].filter(task => task.status === 'completed').length,
            inProgress: [...tasks, ...milestones].filter(task => task.status === 'in_progress').length,
            delayed: [...tasks, ...milestones].filter(task => task.status === 'delayed').length,
            notStarted: [...tasks, ...milestones].filter(task => task.status === 'not_started').length
        }
    };
}

/**
 * Returns a simulated project by ID
 * @param {string} projectId - The project ID
 * @returns {Object|null} - The project object or null if not found
 */
function getSimulatedProjectById(projectId) {
    const projects = getSimulatedProjects();
    return projects.find(project => project.id === projectId) || null;
}

/**
 * Returns simulated project schedule data
 * @param {string} projectId - The project ID
 * @returns {Object} - Simulated schedule data
 */
function getSimulatedProjectSchedule(projectId) {
    const project = getSimulatedProjectById(projectId);
    
    if (!project) {
        return { error: 'Project not found' };
    }
    
    // Create simulated schedule data based on project
    const startDate = new Date(project.start_date);
    const endDate = new Date(project.estimated_completion_date);
    const today = new Date();
    
    // Calculate task progress based on project completion percentage
    const projectProgress = project.completion_percentage;
    
    // Generate tasks
    const tasks = [
        {
            id: 't1',
            name: 'Site Preparation',
            start: formatDate(startDate),
            end: formatDate(addDays(startDate, 30)),
            progress: projectProgress > 10 ? 100 : projectProgress * 10,
            dependencies: '',
            status: projectProgress > 10 ? 'completed' : 'in_progress',
            assignee: 'John Smith',
            department: 'Site Work',
            description: 'Site clearing, grading, and preparation work.'
        },
        {
            id: 't2',
            name: 'Foundation Work',
            start: formatDate(addDays(startDate, 25)),
            end: formatDate(addDays(startDate, 75)),
            progress: projectProgress > 25 ? 100 : Math.max(0, (projectProgress - 10) * 6.7),
            dependencies: 't1',
            status: projectProgress > 25 ? 'completed' : projectProgress > 10 ? 'in_progress' : 'not_started',
            assignee: 'Mike Johnson',
            department: 'Structural',
            description: 'Excavation, formwork, reinforcement, and concrete pouring for foundations.'
        },
        {
            id: 't3',
            name: 'Structural Framing',
            start: formatDate(addDays(startDate, 70)),
            end: formatDate(addDays(startDate, 140)),
            progress: projectProgress > 40 ? 100 : Math.max(0, (projectProgress - 25) * 6.7),
            dependencies: 't2',
            status: projectProgress > 40 ? 'completed' : projectProgress > 25 ? 'in_progress' : 'not_started',
            assignee: 'Robert Brown',
            department: 'Structural',
            description: 'Steel erection, concrete columns, beams, and floor slabs.'
        },
        {
            id: 't4',
            name: 'Building Envelope',
            start: formatDate(addDays(startDate, 135)),
            end: formatDate(addDays(startDate, 200)),
            progress: projectProgress > 55 ? 100 : Math.max(0, (projectProgress - 40) * 6.7),
            dependencies: 't3',
            status: projectProgress > 55 ? 'completed' : projectProgress > 40 ? 'in_progress' : 'not_started',
            assignee: 'Linda Williams',
            department: 'Envelope',
            description: 'Exterior walls, windows, doors, and roofing systems.'
        },
        {
            id: 't5',
            name: 'MEP Rough-In',
            start: formatDate(addDays(startDate, 155)),
            end: formatDate(addDays(startDate, 245)),
            progress: projectProgress > 70 ? 100 : Math.max(0, (projectProgress - 55) * 6.7),
            dependencies: 't3',
            status: projectProgress > 70 ? 'completed' : projectProgress > 55 ? 'in_progress' : 'not_started',
            assignee: 'David Miller',
            department: 'MEP',
            description: 'Mechanical, electrical, and plumbing systems installation.'
        },
        {
            id: 't6',
            name: 'Interior Finishes',
            start: formatDate(addDays(startDate, 210)),
            end: formatDate(addDays(startDate, 320)),
            progress: projectProgress > 85 ? 100 : Math.max(0, (projectProgress - 70) * 6.7),
            dependencies: 't4,t5',
            status: projectProgress > 85 ? 'completed' : projectProgress > 70 ? 'in_progress' : 'not_started',
            assignee: 'Sarah Davis',
            department: 'Finishes',
            description: 'Drywall, painting, flooring, ceilings, and interior fixtures.'
        },
        {
            id: 't7',
            name: 'Final Inspections & Closeout',
            start: formatDate(addDays(startDate, 320)),
            end: formatDate(endDate),
            progress: projectProgress > 95 ? 100 : Math.max(0, (projectProgress - 85) * 10),
            dependencies: 't6',
            status: projectProgress > 95 ? 'completed' : projectProgress > 85 ? 'in_progress' : 'not_started',
            assignee: 'James Wilson',
            department: 'Management',
            description: 'Final inspections, punch list completion, and project closeout documentation.'
        }