/**
 * Project Schedule JavaScript
 * 
 * This file handles the project schedule and Gantt chart functionality
 */

let ganttChart = null;
let currentProject = null;
let currentTasks = [];
let currentView = 'Month';

document.addEventListener('DOMContentLoaded', function() {
    // Initialize view mode buttons
    document.getElementById('view-day').addEventListener('click', () => changeViewMode('Day'));
    document.getElementById('view-week').addEventListener('click', () => changeViewMode('Week'));
    document.getElementById('view-month').addEventListener('click', () => changeViewMode('Month'));
    
    // Initialize refresh button
    const refreshBtn = document.getElementById('refreshScheduleBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            if (currentProject) {
                loadProjectSchedule(currentProject);
            

/**
 * Changes the Gantt chart view mode
 * @param {string} viewMode - The view mode (Day, Week, Month)
 */
function changeViewMode(viewMode) {
    currentView = viewMode;
    
    // Update active button state
    document.getElementById('view-day').classList.remove('active');
    document.getElementById('view-week').classList.remove('active');
    document.getElementById('view-month').classList.remove('active');
    document.getElementById(`view-${viewMode.toLowerCase()}`).classList.add('active');
    
    // Update Gantt chart view
    if (ganttChart) {
        ganttChart.change_view_mode(viewMode);
    }
}

/**
 * Shows task details in the details panel
 * @param {Object} task - The selected task
 */
function showTaskDetails(task) {
    const taskDetails = document.getElementById('taskDetails');
    if (!taskDetails) return;
    
    // Get the original task data
    const taskData = task._data;
    
    // Determine task class
    let taskClass = '';
    if (taskData.isMilestone) {
        taskClass = 'milestone';
    } else if (taskData.status === 'completed') {
        taskClass = 'complete';
    } else if (taskData.status === 'delayed') {
        taskClass = 'critical-path';
    }
    
    // Create task details HTML
    taskDetails.innerHTML = `
        <div class="task-info ${taskClass}">
            <div class="d-flex justify-content-between align-items-center mb-3">
                <h4>${taskData.name}</h4>
                <button class="btn btn-sm btn-primary" onclick="editTask('${taskData.id}')">
                    <i class="fas fa-edit me-1"></i> Edit
                </button>
            </div>
            <div class="row">
                <div class="col-md-6">
                    <p><strong>Status:</strong> ${taskData.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</p>
                    <p><strong>Start Date:</strong> ${taskData.start}</p>
                    <p><strong>End Date:</strong> ${taskData.end}</p>
                    <p><strong>Progress:</strong> ${taskData.progress}%</p>
                </div>
                <div class="col-md-6">
                    <p><strong>Assignee:</strong> ${taskData.assignee}</p>
                    <p><strong>Department:</strong> ${taskData.department}</p>
                    <p><strong>Dependencies:</strong> ${taskData.dependencies ? taskData.dependencies.split(',').map(dep => {
                        const depTask = currentTasks.find(t => t.id === dep.trim());
                        return depTask ? depTask.name : dep;
                    }).join(', ') : 'None'}</p>
                    <p><strong>Type:</strong> ${taskData.isMilestone ? 'Milestone' : 'Task'}</p>
                </div>
            </div>
            ${taskData.description ? `<div class="mt-3"><p><strong>Description:</strong></p><p>${taskData.description}</p></div>` : ''}
        </div>
    `;
}

/**
 * Opens the task edit modal for a specific task
 * @param {string} taskId - The ID of the task to edit
 */
function editTask(taskId) {
    const task = currentTasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Fill in form fields
    document.getElementById('taskId').value = task.id;
    document.getElementById('taskName').value = task.name;
    document.getElementById('taskStartDate').value = task.start;
    document.getElementById('taskEndDate').value = task.end;
    document.getElementById('taskProgress').value = task.progress;
    document.getElementById('taskStatus').value = task.status;
    
    const taskAssignee = document.getElementById('taskAssignee');
    if (taskAssignee) {
        // Find and select the assignee option
        for (let i = 0; i < taskAssignee.options.length; i++) {
            if (taskAssignee.options[i].value === task.assignee) {
                taskAssignee.selectedIndex = i;
                break;
            }
        }
    }
    
    const taskDepartment = document.getElementById('taskDepartment');
    if (taskDepartment) {
        // Find and select the department option
        for (let i = 0; i < taskDepartment.options.length; i++) {
            if (taskDepartment.options[i].value === task.department) {
                taskDepartment.selectedIndex = i;
                break;
            }
        }
    }
    
    const taskDependencies = document.getElementById('taskDependencies');
    if (taskDependencies) {
        // Clear all selections
        for (let i = 0; i < taskDependencies.options.length; i++) {
            taskDependencies.options[i].selected = false;
        }
        
        // Select dependencies
        if (task.dependencies) {
            const deps = task.dependencies.split(',');
            for (let i = 0; i < taskDependencies.options.length; i++) {
                if (deps.includes(taskDependencies.options[i].value)) {
                    taskDependencies.options[i].selected = true;
                }
            }
        }
    }
    
    document.getElementById('taskDescription').value = task.description || '';
    document.getElementById('taskMilestone').checked = task.isMilestone || false;
    
    // Show modal
    const modal = new bootstrap.Modal(document.getElementById('taskEditModal'));
    modal.show();
}

/**
 * Saves task changes from the edit form
 */
function saveTaskChanges() {
    const taskId = document.getElementById('taskId').value;
    const task = currentTasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Update task with form values
    task.name = document.getElementById('taskName').value;
    task.start = document.getElementById('taskStartDate').value;
    task.end = document.getElementById('taskEndDate').value;
    task.progress = parseInt(document.getElementById('taskProgress').value);
    task.status = document.getElementById('taskStatus').value;
    task.assignee = document.getElementById('taskAssignee').value;
    task.department = document.getElementById('taskDepartment').value;
    
    // Handle dependencies
    const taskDependencies = document.getElementById('taskDependencies');
    if (taskDependencies) {
        const selectedDeps = Array.from(taskDependencies.selectedOptions).map(option => option.value);
        task.dependencies = selectedDeps.join(',');
    }
    
    task.description = document.getElementById('taskDescription').value;
    task.isMilestone = document.getElementById('taskMilestone').checked;
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('taskEditModal'));
    modal.hide();
    
    // Refresh Gantt chart
    initializeGanttChart(currentTasks);
    
    // Show updated task details
    const ganttTask = ganttChart.tasks.find(t => t.id === taskId);
    if (ganttTask) {
        showTaskDetails(ganttTask);
    }
    
    // In a real implementation, you would save changes to Procore API here
}

/**
 * Updates task dates after drag-and-drop in Gantt chart
 * @param {Object} task - The task
 * @param {string} start - New start date
 * @param {string} end - New end date
 */
function updateTaskDates(task, start, end) {
    // Find task in our data
    const taskData = currentTasks.find(t => t.id === task.id);
    if (taskData) {
        // Update dates
        taskData.start = start;
        taskData.end = end;
        
        // In a real implementation, you would save changes to Procore API here
    }
}

/**
 * Updates task progress after progress change in Gantt chart
 * @param {Object} task - The task
 * @param {number} progress - New progress value (0-1)
 */
function updateTaskProgress(task, progress) {
    // Find task in our data
    const taskData = currentTasks.find(t => t.id === task.id);
    if (taskData) {
        // Update progress
        taskData.progress = Math.round(progress * 100);
        
        // Update status based on progress
        if (taskData.progress === 100) {
            taskData.status = 'completed';
        } else if (taskData.progress > 0) {
            taskData.status = 'in_progress';
        }
        
        // In a real implementation, you would save changes to Procore API here
    }
}

/**
 * Applies the selected filters to the Gantt chart
 */
function applyFilters() {
    if (!currentTasks || !ganttChart) return;
    
    const statusFilter = document.getElementById('taskFilter').value;
    const departmentFilter = document.getElementById('departmentFilter').value;
    const assigneeFilter = document.getElementById('assigneeFilter').value;
    
    // Filter tasks
    let filteredTasks = [...currentTasks];
    
    if (statusFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.status === statusFilter);
    }
    
    if (departmentFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.department === departmentFilter);
    }
    
    if (assigneeFilter !== 'all') {
        filteredTasks = filteredTasks.filter(task => task.assignee === assigneeFilter);
    }
    
    // Update Gantt chart with filtered tasks
    initializeGanttChart(filteredTasks);
}

/**
 * Toggles the critical path highlighting
 */
function toggleCriticalPath() {
    const showCriticalPath = document.getElementById('criticalPathToggle').checked;
    
    if (!currentTasks || !ganttChart) return;
    
    // In a real implementation, you would calculate the critical path
    // For demo purposes, we'll just highlight tasks with dependencies
    if (showCriticalPath) {
        // Find tasks that are on the critical path (simplified)
        // In a real implementation, you would use a proper critical path algorithm
        const criticalTasks = currentTasks.filter(task => {
            // For demo, we'll consider tasks with dependencies as critical
            return task.dependencies && task.dependencies.length > 0;
        });
        
        // Highlight critical tasks
        ganttChart.tasks.forEach(task => {
            if (criticalTasks.some(ct => ct.id === task.id)) {
                task.custom_class = 'critical-task';
            }
        });
    } else {
        // Reset custom classes
        ganttChart.tasks.forEach(task => {
            const originalTask = currentTasks.find(t => t.id === task.id);
            if (originalTask) {
                task.custom_class = originalTask.isMilestone ? 'milestone-task' : 
                                   (originalTask.status === 'completed' ? 'completed-task' : 
                                   originalTask.status === 'delayed' ? 'delayed-task' : '');
            }
        });
    }
    
    // Refresh chart
    ganttChart.refresh(ganttChart.tasks);
}

/**
 * Exports the schedule to CSV
 */
function exportSchedule() {
    if (!currentTasks) return;
    
    // Create CSV content
    let csvContent = "ID,Task Name,Start Date,End Date,Duration (days),Progress,Status,Assignee,Department,Dependencies\n";
    
    currentTasks.forEach(task => {
        // Calculate duration in days
        const start = new Date(task.start);
        const end = new Date(task.end);
        const duration = Math.round((end - start) / (1000 * 60 * 60 * 24));
        
        // Format CSV row
        csvContent += `${task.id},"${task.name}",${task.start},${task.end},${duration},${task.progress}%,${task.status},"${task.assignee}","${task.department}","${task.dependencies || ''}"\n`;
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentProject ? currentProject.name : 'Project'}_Schedule.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
        });
    }
    
    // Initialize export button
    const exportBtn = document.getElementById('exportScheduleBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportSchedule);
    }
    
    // Initialize save task button
    const saveTaskBtn = document.getElementById('saveTaskBtn');
    if (saveTaskBtn) {
        saveTaskBtn.addEventListener('click', saveTaskChanges);
    }
    
    // Initialize project selector
    const projectSelector = document.getElementById('projectSelector');
    if (projectSelector) {
        projectSelector.addEventListener('change', function() {
            const projectId = this.value;
            if (projectId) {
                // Get project and load schedule
                const project = getSimulatedProjectById(projectId);
                if (project) {
                    loadProjectSchedule(project);
                }
            }
        });
    }
    
    // Initialize task filters
    setupFilterHandlers();
});

/**
 * Sets up the filter handlers for the schedule
 */
function setupFilterHandlers() {
    // Task status filter
    const taskFilter = document.getElementById('taskFilter');
    if (taskFilter) {
        taskFilter.addEventListener('change', applyFilters);
    }
    
    // Department filter
    const departmentFilter = document.getElementById('departmentFilter');
    if (departmentFilter) {
        departmentFilter.addEventListener('change', applyFilters);
    }
    
    // Assignee filter
    const assigneeFilter = document.getElementById('assigneeFilter');
    if (assigneeFilter) {
        assigneeFilter.addEventListener('change', applyFilters);
    }
    
    // Critical path toggle
    const criticalPathToggle = document.getElementById('criticalPathToggle');
    if (criticalPathToggle) {
        criticalPathToggle.addEventListener('change', toggleCriticalPath);
    }
}

/**
 * Loads the project schedule data and initializes the Gantt chart
 * @param {Object} project - The project object
 */
function loadProjectSchedule(project) {
    currentProject = project;
    
    // In a real implementation, this would fetch schedule data from Procore API
    // For demo purposes, we'll use simulated data
    const scheduleData = getSimulatedProjectSchedule(project.id);
    
    // Save current tasks
    currentTasks = scheduleData.tasks;
    
    // Update task counts
    updateTaskCounts(scheduleData.stats);
    
    // Populate department and assignee filters
    populateFilters(scheduleData.tasks);
    
    // Initialize Gantt chart
    initializeGanttChart(scheduleData.tasks);
}

/**
 * Updates the task count metrics
 * @param {Object} stats - Task statistics
 */
function updateTaskCounts(stats) {
    document.getElementById('totalTasksCount').textContent = stats.totalTasks;
    document.getElementById('completedTasksCount').textContent = stats.completed;
    document.getElementById('inProgressTasksCount').textContent = stats.inProgress;
    document.getElementById('delayedTasksCount').textContent = stats.delayed;
}

/**
 * Populates the department and assignee filter dropdowns
 * @param {Array} tasks - The list of tasks
 */
function populateFilters(tasks) {
    // Collect unique departments
    const departments = [...new Set(tasks.map(task => task.department))];
    const departmentFilter = document.getElementById('departmentFilter');
    
    if (departmentFilter) {
        // Clear existing options except the first one
        while (departmentFilter.options.length > 1) {
            departmentFilter.remove(1);
        }
        
        // Add department options
        departments.forEach(department => {
            const option = document.createElement('option');
            option.value = department;
            option.textContent = department;
            departmentFilter.appendChild(option);
        });
    }
    
    // Collect unique assignees
    const assignees = [...new Set(tasks.map(task => task.assignee))];
    const assigneeFilter = document.getElementById('assigneeFilter');
    
    if (assigneeFilter) {
        // Clear existing options except the first one
        while (assigneeFilter.options.length > 1) {
            assigneeFilter.remove(1);
        }
        
        // Add assignee options
        assignees.forEach(assignee => {
            const option = document.createElement('option');
            option.value = assignee;
            option.textContent = assignee;
            assigneeFilter.appendChild(option);
        });
    }
    
    // Populate edit form dropdowns as well
    populateEditFormDropdowns(departments, assignees, tasks);
}

/**
 * Populates the task edit form dropdowns
 * @param {Array} departments - List of departments
 * @param {Array} assignees - List of assignees
 * @param {Array} tasks - List of tasks
 */
function populateEditFormDropdowns(departments, assignees, tasks) {
    // Populate department dropdown
    const taskDepartment = document.getElementById('taskDepartment');
    if (taskDepartment) {
        // Clear existing options except the first one
        while (taskDepartment.options.length > 1) {
            taskDepartment.remove(1);
        }
        
        // Add department options
        departments.forEach(department => {
            const option = document.createElement('option');
            option.value = department;
            option.textContent = department;
            taskDepartment.appendChild(option);
        });
    }
    
    // Populate assignee dropdown
    const taskAssignee = document.getElementById('taskAssignee');
    if (taskAssignee) {
        // Clear existing options except the first one
        while (taskAssignee.options.length > 1) {
            taskAssignee.remove(1);
        }
        
        // Add assignee options
        assignees.forEach(assignee => {
            const option = document.createElement('option');
            option.value = assignee;
            option.textContent = assignee;
            taskAssignee.appendChild(option);
        });
    }
    
    // Populate dependencies dropdown
    const taskDependencies = document.getElementById('taskDependencies');
    if (taskDependencies) {
        // Clear existing options
        taskDependencies.innerHTML = '';
        
        // Add task options
        tasks.forEach(task => {
            const option = document.createElement('option');
            option.value = task.id;
            option.textContent = task.name;
            taskDependencies.appendChild(option);
        });
    }
}

/**
 * Initializes the Gantt chart with task data
 * @param {Array} tasks - The list of tasks
 */
function initializeGanttChart(tasks) {
    // Convert tasks to Frappe Gantt format
    const ganttTasks = tasks.map(task => {
        return {
            id: task.id,
            name: task.name,
            start: task.start,
            end: task.end,
            progress: task.progress / 100,
            dependencies: task.dependencies,
            custom_class: task.isMilestone ? 'milestone-task' : (task.status === 'completed' ? 'completed-task' : task.status === 'delayed' ? 'delayed-task' : ''),
            // Store additional data for reference
            _data: task
        };
    });
    
    // Initialize or update Gantt chart
    const ganttContainer = document.getElementById('gantt-container');
    
    if (ganttContainer) {
        if (ganttChart) {
            // Update existing chart
            ganttChart.tasks = ganttTasks;
            ganttChart.refresh(ganttTasks);
        } else {
            // Create new chart
            ganttChart = new Gantt(ganttContainer, ganttTasks, {
                view_mode: currentView,
                date_format: 'YYYY-MM-DD',
                on_click: function(task) {
                    showTaskDetails(task);
                },
                on_date_change: function(task, start, end) {
                    updateTaskDates(task, start, end);
                },
                on_progress_change: function(task, progress) {
                    updateTaskProgress(task, progress);
                },
                custom_popup_html: function(task) {
                    // Define popup content
                    return `
                        <div class="gantt-task-popup">
                            <h6>${task.name}</h6>
                            <p>
                                <strong>Start:</strong> ${task.start}<br>
                                <strong>End:</strong> ${task.end}<br>
                                <strong>Progress:</strong> ${Math.round(task.progress * 100)}%<br>
                                <strong>Status:</strong> ${task._data.status}
                            </p>
                        </div>
                    `;
                }
            });
        }
    }
}