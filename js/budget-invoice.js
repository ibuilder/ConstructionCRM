/**
 * Budget and Invoice JavaScript
 * 
 * This file handles the budget and invoice functionality, including AIA G702/G703 forms
 */

let currentProject = null;
let budgetData = null;
let invoiceData = null;
let aiaFormData = null;
let charts = {/**
 * Views an invoice
 * @param {string} invoiceId - The invoice ID
 */
function viewInvoice(invoiceId) {
    if (!invoiceData) return;
    
    // Find the invoice
    const invoice = invoiceData.invoices.find(inv => inv.id === invoiceId);
    if (!invoice) return;
    
    // Display invoice details (in a real application, this might show a modal or redirect to an invoice page)
    alert(`
        Invoice #: ${invoice.id}
        Date: ${invoice.date}
        Due Date: ${invoice.dueDate}
        Amount: ${formatCurrency(invoice.amount)}
        Retainage (${invoice.retainagePercent}%): ${formatCurrency(invoice.retainageAmount)}
        Net Amount: ${formatCurrency(invoice.netAmount)}
        Status: ${invoice.status}
        Description: ${invoice.description}
    `);
}

/**
 * Marks an invoice as paid
 * @param {string} invoiceId - The invoice ID
 */
function markInvoiceAsPaid(invoiceId) {
    if (!invoiceData) return;
    
    // Find the invoice
    const invoice = invoiceData.invoices.find(inv => inv.id === invoiceId);
    if (!invoice || invoice.status === 'Paid') return;
    
    // Update the invoice status
    invoice.status = 'Paid';
    
    // Update the summary data
    invoiceData.summary.totalPaid += invoice.netAmount;
    invoiceData.summary.totalOutstanding -= invoice.netAmount;
    
    // Refresh the display
    updateInvoiceDisplay(invoiceData);
    
    // In a real implementation, you would save changes to Procore API here
}

/**
 * Creates a new invoice
 */
function createInvoice() {
    if (!currentProject) {
        alert('Please select a project first');
        return;
    }
    
    // Get form values
    const invoiceNumber = document.getElementById('invoiceNumber').value;
    const invoiceDate = document.getElementById('invoiceDate').value;
    const invoiceDueDate = document.getElementById('invoiceDueDate').value;
    const retainagePercentage = parseFloat(document.getElementById('retainagePercentage').value);
    const invoiceAmount = parseFloat(document.getElementById('invoiceAmount').value);
    const invoiceDescription = document.getElementById('invoiceDescription').value;
    
    // Validate form
    if (!invoiceNumber || !invoiceDate || !invoiceDueDate || isNaN(invoiceAmount) || invoiceAmount <= 0) {
        alert('Please fill in all required fields with valid values');
        return;
    }
    
    // Calculate retainage amount
    const retainageAmount = (invoiceAmount * retainagePercentage) / 100;
    const netAmount = invoiceAmount - retainageAmount;
    
    // Create new invoice
    const newInvoice = {
        id: invoiceNumber,
        date: invoiceDate,
        dueDate: invoiceDueDate,
        amount: invoiceAmount,
        retainagePercent: retainagePercentage,
        retainageAmount: retainageAmount,
        netAmount: netAmount,
        status: 'Outstanding',
        description: invoiceDescription || `Invoice ${invoiceNumber}`
    };
    
    // Add to invoices array
    invoiceData.invoices.push(newInvoice);
    
    // Update summary data
    invoiceData.summary.totalInvoiced += invoiceAmount;
    invoiceData.summary.totalOutstanding += netAmount;
    invoiceData.summary.totalRetainage += retainageAmount;
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('createInvoiceModal'));
    modal.hide();
    
    // Reset form
    document.getElementById('createInvoiceForm').reset();
    
    // Refresh the display
    updateInvoiceDisplay(invoiceData);
    
    // Generate new AIA form based on the invoice
    const newAiaForm = generateAiaFormData(currentProject, { 
        invoices: [newInvoice],
        summary: invoiceData.summary
    });
    
    if (newAiaForm && newAiaForm.length > 0) {
        aiaFormData.push(newAiaForm[0]);
        updateAiaFormDisplay(aiaFormData);
    }
    
    // In a real implementation, you would save changes to Procore API here
}

/**
 * Creates a new AIA form
 */
function createAiaForm() {
    if (!currentProject) {
        alert('Please select a project first');
        return;
    }
    
    // Get form values
    const applicationNumber = document.getElementById('applicationNumber').value;
    const applicationDate = document.getElementById('applicationDate').value;
    const periodTo = document.getElementById('periodTo').value;
    const contractDate = document.getElementById('contractDate').value || currentProject.start_date;
    const ownerName = document.getElementById('ownerName').value || 'Sample Client Inc.';
    const architectName = document.getElementById('architectName').value || 'Design Architects LLC';
    const contractFor = document.getElementById('contractFor').value || 'Construction Services';
    const retainagePercentage = parseFloat(document.getElementById('retainagePercentageAia').value);
    
    // Validate form
    if (!applicationNumber || !applicationDate || !periodTo) {
        alert('Please fill in all required fields');
        return;
    }
    
    // Get budget data
    const budgetData = getSimulatedProjectBudget(currentProject.id);
    
    // Calculate amounts based on project completion percentage
    const totalCompleted = currentProject.budget * (currentProject.completion_percentage / 100);
    const retainageAmount = totalCompleted * (retainagePercentage / 100);
    const totalEarnedLessRetainage = totalCompleted - retainageAmount;
    
    // Determine previous certificates amount (sum of all previous AIA forms)
    const previousCertificates = aiaFormData.reduce((sum, form) => sum + form.amount, 0);
    
    // Calculate current payment due
    const currentPaymentDue = totalEarnedLessRetainage - previousCertificates;
    
    // Create G702 data
    const g702Data = {
        applicationNumber: applicationNumber,
        periodTo: periodTo,
        applicationDate: applicationDate,
        projectName: currentProject.name,
        projectAddress: currentProject.address,
        ownerName: ownerName,
        contractorName: 'Your Construction Company',
        architectName: architectName,
        contractDate: contractDate,
        contractFor: contractFor,
        originalContractSum: currentProject.budget,
        netChangeOrders: (budgetData.summary.totalBudget - currentProject.budget),
        contractSumToDate: budgetData.summary.totalBudget,
        totalCompletedStored: totalCompleted,
        retainagePercent: retainagePercentage,
        retainageAmount: retainageAmount,
        totalEarnedLessRetainage: totalEarnedLessRetainage,
        lessPreviousCertificates: previousCertificates,
        currentPaymentDue: currentPaymentDue,
        balanceToFinish: budgetData.summary.totalBudget - totalCompleted,
        changeOrderSummary: {
            previousAdditions: Math.max(0, (budgetData.summary.totalBudget - currentProject.budget) * 0.8),
            previousDeductions: Math.max(0, (currentProject.budget - budgetData.summary.totalBudget) * 0.8),
            currentAdditions: Math.max(0, (budgetData.summary.totalBudget - currentProject.budget) * 0.2),
            currentDeductions: Math.max(0, (currentProject.budget - budgetData.summary.totalBudget) * 0.2)
        },
        signatureDate: applicationDate,
        status: 'Outstanding'
    };
    
    // Create G703 data (continuation sheet)
    const g703Data = {
        applicationNumber: applicationNumber,
        periodTo: periodTo,
        applicationDate: applicationDate,
        projectName: currentProject.name,
        architectProjectNo: 'ARCH-' + currentProject.id,
        lineItems: budgetData.budgetItems.map((item, index) => {
            // Calculate completion percentage based on project progress
            const completionPercentage = Math.min(100, Math.round((currentProject.completion_percentage / 100) * (100 + (Math.random() * 20 - 10))));
            const previousApplications = item.currentBudget * (completionPercentage / 100) * 0.7; // Assume 70% of work was in previous applications
            const thisPeriod = item.currentBudget * (completionPercentage / 100) * 0.3; // Assume 30% of work is in this period
            
            return {
                itemNo: (index + 1).toString(),
                description: item.description,
                scheduledValue: item.currentBudget,
                previousApplications: previousApplications,
                thisPeriod: thisPeriod,
                materialsStored: 0, // Assuming no materials stored
                totalCompletedStored: previousApplications + thisPeriod,
                percentComplete: completionPercentage,
                balanceToFinish: item.currentBudget * (1 - (completionPercentage / 100)),
                retainage: (previousApplications + thisPeriod) * (retainagePercentage / 100)
            };
        })
    };
    
    // Create AIA form
    const newForm = {
        id: `AIA-${applicationNumber}`,
        applicationNumber: applicationNumber,
        periodTo: periodTo,
        applicationDate: applicationDate,
        dueDate: new Date(new Date(applicationDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        amount: currentPaymentDue,
        status: 'Outstanding',
        g702Data: g702Data,
        g703Data: g703Data
    };
    
    // Add to AIA forms array
    aiaFormData.push(newForm);
    
    // Close modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('createAiaFormModal'));
    modal.hide();
    
    // Reset form
    document.getElementById('createAiaForm').reset();
    
    // Refresh the display
    updateAiaFormDisplay(aiaFormData);
    
    // In a real implementation, you would save changes to Procore API here
}

/**
 * Prints the current AIA form
 */
function printAiaForm() {
    window.print();
}

/**
 * Downloads the current AIA form as PDF
 * In a real implementation, this would use a PDF library to generate the PDF
 */
function downloadAiaPdf() {
    alert('In a real implementation, this would generate a PDF of the AIA form for download.');
    // In a real implementation, this would use a PDF library like jsPDF
}

/**
 * Exports budget data to CSV
 */
function exportBudgetData() {
    if (!budgetData) return;
    
    // Create CSV content
    let csvContent = "Cost Code,Description,Original Budget,Change Orders,Current Budget,Committed,Spent to Date,Remaining\n";
    
    budgetData.budgetItems.forEach(item => {
        // Format CSV row
        csvContent += `${item.costCode},"${item.description}",${item.originalBudget},${item.changeOrders},${item.currentBudget},${item.committed},${item.spentToDate},${item.remaining}\n`;
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${currentProject ? currentProject.name : 'Project'}_Budget.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Filters the budget table based on search text
 * @param {string} searchText - The search text
 */
function filterBudgetTable(searchText) {
    const table = document.getElementById('budgetTable');
    const rows = table.getElementsByTagName('tbody')[0].getElementsByTagName('tr');
    
    const searchTextLower = searchText.toLowerCase();
    
    for (let i = 0; i < rows.length; i++) {
        const rowData = rows[i].textContent.toLowerCase();
        if (rowData.includes(searchTextLower)) {
            rows[i].style.display = '';
        } else {
            rows[i].style.display = 'none';
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    // Initialize section navigation
    document.getElementById('viewBudgetBtn').addEventListener('click', () => showSection('budgetOverviewSection'));
    document.getElementById('viewInvoicesBtn').addEventListener('click', () => showSection('invoicesSection'));
    document.getElementById('viewAiaFormsBtn').addEventListener('click', () => showSection('aiaFormsSection'));
    
    // Initialize refresh button
    const refreshBtn = document.getElementById('refreshBudgetBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            if (currentProject) {
                loadProjectBudget(currentProject);
            }
        });
    }
    
    // Initialize export button
    const exportBtn = document.getElementById('exportBudgetBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', exportBudgetData);
    }
    
    // Initialize project selector
    const projectSelector = document.getElementById('projectSelector');
    if (projectSelector) {
        projectSelector.addEventListener('change', function() {
            const projectId = this.value;
            if (projectId) {
                // Get project and load budget/invoice data
                const project = getSimulatedProjectById(projectId);
                if (project) {
                    loadProjectBudget(project);
                }
            }
        });
    }
    
    // Setup invoice and AIA form creation handlers
    document.getElementById('saveInvoiceBtn').addEventListener('click', createInvoice);
    document.getElementById('saveAiaFormBtn').addEventListener('click', createAiaForm);
    
    // Setup print and download buttons for AIA forms
    document.getElementById('printAiaBtn').addEventListener('click', printAiaForm);
    document.getElementById('downloadAiaPdfBtn').addEventListener('click', downloadAiaPdf);
    
    // Setup search functionality for budget items
    const budgetSearchInput = document.getElementById('budgetSearchInput');
    if (budgetSearchInput) {
        budgetSearchInput.addEventListener('input', function() {
            filterBudgetTable(this.value);
        });
    }
});

/**
 * Shows the selected section and hides others
 * @param {string} sectionId - The ID of the section to show
 */
function showSection(sectionId) {
    // Hide all sections
    document.getElementById('budgetOverviewSection').style.display = 'none';
    document.getElementById('invoicesSection').style.display = 'none';
    document.getElementById('aiaFormsSection').style.display = 'none';
    document.getElementById('aiaFormPreview').style.display = 'none';
    
    // Show selected section
    document.getElementById(sectionId).style.display = 'block';
    
    // Update button states
    document.getElementById('viewBudgetBtn').classList.remove('active');
    document.getElementById('viewInvoicesBtn').classList.remove('active');
    document.getElementById('viewAiaFormsBtn').classList.remove('active');
    
    if (sectionId === 'budgetOverviewSection') {
        document.getElementById('viewBudgetBtn').classList.add('active');
    } else if (sectionId === 'invoicesSection') {
        document.getElementById('viewInvoicesBtn').classList.add('active');
    } else if (sectionId === 'aiaFormsSection') {
        document.getElementById('viewAiaFormsBtn').classList.add('active');
    }
    
    // Refresh charts if needed
    if (sectionId === 'budgetOverviewSection' && charts.budgetAllocation) {
        charts.budgetAllocation.update();
        charts.budgetVsActual.update();
    } else if (sectionId === 'invoicesSection' && charts.invoiceTimeline) {
        charts.invoiceTimeline.update();
        charts.paymentStatus.update();
    }
}

/**
 * Loads the project budget, invoice, and AIA form data
 * @param {Object} project - The project object
 */
function loadProjectBudget(project) {
    currentProject = project;
    
    // In a real implementation, these would fetch data from Procore API
    // For demo purposes, we'll use simulated data
    
    // Load budget data
    budgetData = getSimulatedProjectBudget(project.id);
    updateBudgetDisplay(budgetData);
    
    // Load invoice data
    invoiceData = getSimulatedProjectInvoices(project.id);
    updateInvoiceDisplay(invoiceData);
    
    // Generate simulated AIA form data based on invoices
    aiaFormData = generateAiaFormData(project, invoiceData);
    updateAiaFormDisplay(aiaFormData);
}

/**
 * Updates the budget display with the fetched data
 * @param {Object} data - The budget data
 */
function updateBudgetDisplay(data) {
    if (!data || !data.budgetItems) return;
    
    // Update summary metrics
    document.getElementById('totalBudgetAmount').textContent = formatCurrency(data.summary.totalBudget);
    document.getElementById('committedAmount').textContent = formatCurrency(data.summary.totalCommitted);
    document.getElementById('spentToDateAmount').textContent = formatCurrency(data.summary.totalSpent);
    document.getElementById('remainingAmount').textContent = formatCurrency(data.summary.totalRemaining);
    
    // Update budget table
    updateBudgetTable(data.budgetItems);
    
    // Create or update charts
    createBudgetCharts(data);
}

/**
 * Updates the budget table with the fetched data
 * @param {Array} budgetItems - The budget items
 */
function updateBudgetTable(budgetItems) {
    const tableBody = document.querySelector('#budgetTable tbody');
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Add budget items to table
    let totalOriginalBudget = 0;
    let totalChangeOrders = 0;
    let totalCurrentBudget = 0;
    let totalCommitted = 0;
    let totalSpentToDate = 0;
    let totalRemaining = 0;
    
    budgetItems.forEach(item => {
        const row = document.createElement('tr');
        
        // Add CSS class for cost code rows
        row.className = 'cost-code-row';
        
        // Create cells
        row.innerHTML = `
            <td>${item.costCode}</td>
            <td>${item.description}</td>
            <td class="number-cell">${formatCurrency(item.originalBudget)}</td>
            <td class="number-cell">${formatCurrency(item.changeOrders)}</td>
            <td class="number-cell">${formatCurrency(item.currentBudget)}</td>
            <td class="number-cell">${formatCurrency(item.committed)}</td>
            <td class="number-cell">${formatCurrency(item.spentToDate)}</td>
            <td class="number-cell">${formatCurrency(item.remaining)}</td>
        `;
        
        // Add row to table
        tableBody.appendChild(row);
        
        // Update totals
        totalOriginalBudget += item.originalBudget;
        totalChangeOrders += item.changeOrders;
        totalCurrentBudget += item.currentBudget;
        totalCommitted += item.committed;
        totalSpentToDate += item.spentToDate;
        totalRemaining += item.remaining;
    });
    
    // Update footer totals
    document.getElementById('totalOriginalBudget').textContent = formatCurrency(totalOriginalBudget);
    document.getElementById('totalChangeOrders').textContent = formatCurrency(totalChangeOrders);
    document.getElementById('totalCurrentBudget').textContent = formatCurrency(totalCurrentBudget);
    document.getElementById('totalCommitted').textContent = formatCurrency(totalCommitted);
    document.getElementById('totalSpentToDate').textContent = formatCurrency(totalSpentToDate);
    document.getElementById('totalRemaining').textContent = formatCurrency(totalRemaining);
}

/**
 * Creates or updates budget charts
 * @param {Object} data - The budget data
 */
function createBudgetCharts(data) {
    // Create budget allocation chart
    const allocationCtx = document.getElementById('budgetAllocationChart').getContext('2d');
    
    // Prepare data for budget allocation chart
    const divisions = data.budgetItems.map(item => item.description);
    const budgetAmounts = data.budgetItems.map(item => item.currentBudget);
    
    // Create or update chart
    if (charts.budgetAllocation) {
        charts.budgetAllocation.data.labels = divisions;
        charts.budgetAllocation.data.datasets[0].data = budgetAmounts;
        charts.budgetAllocation.update();
    } else {
        charts.budgetAllocation = new Chart(allocationCtx, {
            type: 'pie',
            data: {
                labels: divisions,
                datasets: [{
                    data: budgetAmounts,
                    backgroundColor: generateColors(divisions.length),
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            boxWidth: 15,
                            font: {
                                size: 10
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const percentage = Math.round((value / data.summary.totalBudget) * 100);
                                return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Create budget vs actual chart
    const budgetVsActualCtx = document.getElementById('budgetVsActualChart').getContext('2d');
    
    // Prepare data for budget vs actual chart
    const labels = data.budgetItems.map(item => item.description);
    const budgetValues = data.budgetItems.map(item => item.currentBudget);
    const spentValues = data.budgetItems.map(item => item.spentToDate);
    
    // Create or update chart
    if (charts.budgetVsActual) {
        charts.budgetVsActual.data.labels = labels;
        charts.budgetVsActual.data.datasets[0].data = budgetValues;
        charts.budgetVsActual.data.datasets[1].data = spentValues;
        charts.budgetVsActual.update();
    } else {
        charts.budgetVsActual = new Chart(budgetVsActualCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Budget',
                        data: budgetValues,
                        backgroundColor: 'rgba(54, 162, 235, 0.6)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Actual',
                        data: spentValues,
                        backgroundColor: 'rgba(255, 99, 132, 0.6)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 90,
                            minRotation: 0
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                return `${context.dataset.label}: ${formatCurrency(value)}`;
                            }
                        }
                    }
                }
            }
        });
    }
}

/**
 * Generates an array of colors for chart elements
 * @param {number} count - Number of colors needed
 * @returns {Array} - Array of color strings
 */
function generateColors(count) {
    const baseColors = [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 206, 86, 0.8)',
        'rgba(75, 192, 192, 0.8)',
        'rgba(153, 102, 255, 0.8)',
        'rgba(255, 159, 64, 0.8)',
        'rgba(199, 199, 199, 0.8)',
        'rgba(83, 102, 255, 0.8)',
        'rgba(40, 159, 64, 0.8)',
        'rgba(210, 99, 132, 0.8)'
    ];
    
    const colors = [];
    
    for (let i = 0; i < count; i++) {
        if (i < baseColors.length) {
            colors.push(baseColors[i]);
        } else {
            // Generate random colors if we need more than the base colors
            const r = Math.floor(Math.random() * 255);
            const g = Math.floor(Math.random() * 255);
            const b = Math.floor(Math.random() * 255);
            colors.push(`rgba(${r}, ${g}, ${b}, 0.8)`);
        }
    }
    
    return colors;
}

/**
 * Updates the invoice display with the fetched data
 * @param {Object} data - The invoice data
 */
function updateInvoiceDisplay(data) {
    if (!data || !data.invoices) return;
    
    // Update summary metrics
    document.getElementById('totalInvoicedAmount').textContent = formatCurrency(data.summary.totalInvoiced);
    document.getElementById('paidAmount').textContent = formatCurrency(data.summary.totalPaid);
    document.getElementById('outstandingAmount').textContent = formatCurrency(data.summary.totalOutstanding);
    document.getElementById('retainageAmount').textContent = formatCurrency(data.summary.totalRetainage);
    
    // Update invoices table
    const tableBody = document.querySelector('#invoicesTable tbody');
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    // Add invoices to table
    data.invoices.forEach(invoice => {
        const row = document.createElement('tr');
        
        // Create cells
        row.innerHTML = `
            <td>${invoice.id}</td>
            <td>${invoice.date}</td>
            <td>${invoice.dueDate}</td>
            <td>${formatCurrency(invoice.amount)}</td>
            <td>${invoice.retainagePercent}% (${formatCurrency(invoice.retainageAmount)})</td>
            <td><span class="badge ${invoice.status === 'Paid' ? 'bg-success' : 'bg-warning'}">${invoice.status}</span></td>
            <td>
                <button class="btn btn-sm btn-primary view-invoice-btn" data-invoice-id="${invoice.id}">
                    <i class="fas fa-eye me-1"></i> View
                </button>
                ${invoice.status !== 'Paid' ? `
                <button class="btn btn-sm btn-success mark-paid-btn" data-invoice-id="${invoice.id}">
                    <i class="fas fa-check-circle me-1"></i> Mark Paid
                </button>` : ''}
            </td>
        `;
        
        // Add row to table
        tableBody.appendChild(row);
    });
    
    // Add event listeners for invoice buttons
    document.querySelectorAll('.view-invoice-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const invoiceId = this.getAttribute('data-invoice-id');
            viewInvoice(invoiceId);
        });
    });
    
    document.querySelectorAll('.mark-paid-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const invoiceId = this.getAttribute('data-invoice-id');
            markInvoiceAsPaid(invoiceId);
        });
    });
    
    // Create or update invoice charts
    createInvoiceCharts(data);
}

/**
 * Creates or updates invoice charts
 * @param {Object} data - The invoice data
 */
function createInvoiceCharts(data) {
    // Create invoice timeline chart
    const timelineCtx = document.getElementById('invoiceTimelineChart').getContext('2d');
    
    // Prepare data for invoice timeline chart
    const invoiceDates = data.invoices.map(invoice => invoice.date);
    const invoiceAmounts = data.invoices.map(invoice => invoice.amount);
    
    // Create or update chart
    if (charts.invoiceTimeline) {
        charts.invoiceTimeline.data.labels = invoiceDates;
        charts.invoiceTimeline.data.datasets[0].data = invoiceAmounts;
        charts.invoiceTimeline.update();
    } else {
        charts.invoiceTimeline = new Chart(timelineCtx, {
            type: 'line',
            data: {
                labels: invoiceDates,
                datasets: [{
                    label: 'Invoice Amount',
                    data: invoiceAmounts,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    borderWidth: 2,
                    tension: 0.4,
                    pointBackgroundColor: 'rgba(75, 192, 192, 1)',
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return ' + value.toLocaleString();
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                return `Amount: ${formatCurrency(value)}`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    // Create payment status chart
    const statusCtx = document.getElementById('paymentStatusChart').getContext('2d');
    
    // Prepare data for payment status chart
    const paidAmount = data.summary.totalPaid;
    const outstandingAmount = data.summary.totalOutstanding;
    const retainageAmount = data.summary.totalRetainage;
    
    // Create or update chart
    if (charts.paymentStatus) {
        charts.paymentStatus.data.datasets[0].data = [paidAmount, outstandingAmount, retainageAmount];
        charts.paymentStatus.update();
    } else {
        charts.paymentStatus = new Chart(statusCtx, {
            type: 'doughnut',
            data: {
                labels: ['Paid', 'Outstanding', 'Retainage'],
                datasets: [{
                    data: [paidAmount, outstandingAmount, retainageAmount],
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(255, 159, 64, 0.8)',
                        'rgba(54, 162, 235, 0.8)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const value = context.raw;
                                const sum = paidAmount + outstandingAmount + retainageAmount;
                                const percentage = Math.round((value / sum) * 100);
                                return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
}

/**
 * Updates the AIA form display with the fetched data
 * @param {Array} forms - The AIA forms data
 */
function updateAiaFormDisplay(forms) {
    if (!forms || !Array.isArray(forms)) return;
    
    // Update AIA forms table
    const tableBody = document.querySelector('#aiaFormsTable tbody');
    if (!tableBody) return;
    
    // Clear existing rows
    tableBody.innerHTML = '';
    
    if (forms.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="6" class="text-center">No pay applications found</td>';
        tableBody.appendChild(row);
        return;
    }
    
    // Add forms to table
    forms.forEach(form => {
        const row = document.createElement('tr');
        
        // Create cells
        row.innerHTML = `
            <td>${form.applicationNumber}</td>
            <td>${form.periodTo}</td>
            <td>${form.applicationDate}</td>
            <td>${formatCurrency(form.amount)}</td>
            <td><span class="badge ${form.status === 'Paid' ? 'bg-success' : 'bg-warning'}">${form.status}</span></td>
            <td>
                <button class="btn btn-sm btn-primary view-aia-btn" data-aia-id="${form.id}">
                    <i class="fas fa-eye me-1"></i> View
                </button>
            </td>
        `;
        
        // Add row to table
        tableBody.appendChild(row);
    });
    
    // Add event listeners for AIA form buttons
    document.querySelectorAll('.view-aia-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const aiaId = this.getAttribute('data-aia-id');
            viewAiaForm(aiaId);
        });
    });
}

/**
 * Views an AIA form
 * @param {string} aiaId - The AIA form ID
 */
function viewAiaForm(aiaId) {
    if (!aiaFormData) return;
    
    // Find the form
    const form = aiaFormData.find(form => form.id === aiaId);
    if (!form) return;
    
    // Hide the AIA forms section and show the preview
    document.getElementById('aiaFormsSection').style.display = 'none';
    document.getElementById('aiaFormPreview').style.display = 'block';
    
    // Update the application number in the header
    document.getElementById('previewApplicationNumber').textContent = form.applicationNumber;
    
    // Update G702 form data
    const g702 = form.g702Data;
    
    document.getElementById('g702OwnerName').textContent = g702.ownerName;
    document.getElementById('g702ProjectName').textContent = g702.projectName;
    document.getElementById('g702ApplicationNo').textContent = g702.applicationNumber;
    document.getElementById('g702PeriodTo').textContent = g702.periodTo;
    document.getElementById('g702ContractorName').textContent = g702.contractorName;
    document.getElementById('g702ArchitectName').textContent = g702.architectName;
    document.getElementById('g702ContractDate').textContent = g702.contractDate;
    document.getElementById('g702ContractFor').textContent = g702.contractFor;
    
    document.getElementById('g702OriginalContractSum').textContent = formatCurrency(g702.originalContractSum);
    document.getElementById('g702NetChangeOrders').textContent = formatCurrency(g702.netChangeOrders);
    document.getElementById('g702ContractSumToDate').textContent = formatCurrency(g702.contractSumToDate);
    document.getElementById('g702TotalCompletedStored').textContent = formatCurrency(g702.totalCompletedStored);
    document.getElementById('g702Retainage').textContent = formatCurrency(g702.retainageAmount);
    document.getElementById('g702TotalEarnedLessRetainage').textContent = formatCurrency(g702.totalEarnedLessRetainage);
    document.getElementById('g702LessPreviousCertificates').textContent = formatCurrency(g702.lessPreviousCertificates);
    document.getElementById('g702CurrentPaymentDue').textContent = formatCurrency(g702.currentPaymentDue);
    document.getElementById('g702BalanceToFinish').textContent = formatCurrency(g702.balanceToFinish);
    
    document.getElementById('g702PrevAdditions').textContent = formatCurrency(g702.changeOrderSummary.previousAdditions);
    document.getElementById('g702PrevDeductions').textContent = formatCurrency(g702.changeOrderSummary.previousDeductions);
    document.getElementById('g702CurrAdditions').textContent = formatCurrency(g702.changeOrderSummary.currentAdditions);
    document.getElementById('g702CurrDeductions').textContent = formatCurrency(g702.changeOrderSummary.currentDeductions);
    document.getElementById('g702TotalAdditions').textContent = formatCurrency(g702.changeOrderSummary.previousAdditions + g702.changeOrderSummary.currentAdditions);
    document.getElementById('g702TotalDeductions').textContent = formatCurrency(g702.changeOrderSummary.previousDeductions + g702.changeOrderSummary.currentDeductions);
    document.getElementById('g702NetChanges').textContent = formatCurrency(g702.netChangeOrders);
    
    document.getElementById('g702SignatureContractor').textContent = g702.contractorName;
    document.getElementById('g702SignatureDate').textContent = g702.signatureDate;
    document.getElementById('g702SignatureArchitect').textContent = g702.architectName;
    document.getElementById('g702ArchitectSignatureDate').textContent = g702.signatureDate;
    
    // Update G703 form data
    const g703 = form.g703Data;
    
    document.getElementById('g703ApplicationNo').textContent = g703.applicationNumber;
    document.getElementById('g703ApplicationDate').textContent = g703.applicationDate;
    document.getElementById('g703PeriodTo').textContent = g703.periodTo;
    document.getElementById('g703ProjectName').textContent = g703.projectName;
    document.getElementById('g703ArchitectProjectNo').textContent = g703.architectProjectNo;
    
    // Update G703 line items
    const g703Body = document.getElementById('g703Body');
    if (g703Body) {
        // Clear existing rows
        g703Body.innerHTML = '';
        
        // Add line items
        g703.lineItems.forEach((item, index) => {
            const row = document.createElement('tr');
            
            // Create cells
            row.innerHTML = `
                <td>${item.itemNo}</td>
                <td>${item.description}</td>
                <td class="text-end">${formatCurrency(item.scheduledValue)}</td>
                <td class="text-end">${formatCurrency(item.previousApplications)}</td>
                <td class="text-end">${formatCurrency(item.thisPeriod)}</td>
                <td class="text-end">${formatCurrency(item.materialsStored)}</td>
                <td class="text-end">${formatCurrency(item.totalCompletedStored)}</td>
                <td class="text-end">${item.percentComplete}%</td>
                <td class="text-end">${formatCurrency(item.balanceToFinish)}</td>
                <td class="text-end">${formatCurrency(item.retainage)}</td>
            `;
            
            // Add row to table
            g703Body.appendChild(row);
        });
        
        // Update totals
        document.getElementById('g703TotalScheduledValue').textContent = formatCurrency(g703.lineItems.reduce((sum, item) => sum + item.scheduledValue, 0));
        document.getElementById('g703TotalPrevious').textContent = formatCurrency(g703.lineItems.reduce((sum, item) => sum + item.previousApplications, 0));
        document.getElementById('g703TotalThisPeriod').textContent = formatCurrency(g703.lineItems.reduce((sum, item) => sum + item.thisPeriod, 0));
        document.getElementById('g703TotalMaterialsStored').textContent = formatCurrency(g703.lineItems.reduce((sum, item) => sum + item.materialsStored, 0));
        document.getElementById('g703TotalCompleted').textContent = formatCurrency(g703.lineItems.reduce((sum, item) => sum + item.totalCompletedStored, 0));
        
        const totalScheduled = g703.lineItems.reduce((sum, item) => sum + item.scheduledValue, 0);
        const totalCompleted = g703.lineItems.reduce((sum, item) => sum + item.totalCompletedStored, 0);
        const percentComplete = totalScheduled > 0 ? Math.round((totalCompleted / totalScheduled) * 100) : 0;
        
        document.getElementById('g703TotalPercentage').textContent = percentComplete + '%';
        document.getElementById('g703TotalBalance').textContent = formatCurrency(g703.lineItems.reduce((sum, item) => sum + item.balanceToFinish, 0));
        document.getElementById('g703TotalRetainage').textContent = formatCurrency(g703.lineItems.reduce((sum, item) => sum + item.retainage, 0));
    }
}