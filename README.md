# Construction CRM Dashboard

A web-based dashboard for construction project management that integrates with the Procore API to visualize project schedules (Gantt charts) and manage budget/invoice information (including AIA G702/G703 forms).

## Features

- **Dashboard Overview**: View project completion percentage, budget utilization, and recent activities
- **Project Schedule Management**:
  - Interactive Gantt chart visualization
  - Task filtering by status, department, and assignee
  - Critical path highlighting
  - Task editing capabilities
  - CSV export functionality
- **Budget & Invoice Management**:
  - Budget allocation visualization
  - Budget vs. actual cost tracking
  - Invoice creation and management
  - AIA G702/G703 form generation
  - PDF export capability for AIA forms

## Technology Stack

- **Frontend**:
  - HTML5, CSS3, JavaScript
  - Bootstrap 5.3.0 for responsive design
  - Font Awesome 6.4.0 for icons
  - Chart.js 3.9.1 for data visualization
  - Frappe Gantt 0.6.1 for Gantt chart functionality
  - jQuery 3.6.0 for DOM manipulation

## Setup Instructions

1. Clone or download the repository
2. Open the `index.html` file in a web browser
3. Click "Connect to Procore" on the dashboard
4. Enter your Procore API credentials (for demo purposes, any values will work)
5. Select a project from the dropdown menu to view its data

## Project Structure

```
construction-crm-dashboard/
├── css/
│   └── styles.css
├── js/
│   ├── procore-api.js
│   ├── dashboard.js
│   ├── project-schedule.js
│   └── budget-invoice.js
├── index.html
├── project-schedule.html
├── budget-invoice.html
├── callback.html
└── README.md
```

## Procore API Integration

This dashboard integrates with the Procore API for retrieving project data. For demonstration purposes, the application uses simulated data instead of making actual API calls. In a production environment, the `procore-api.js` file would need to be updated to use your actual Procore API credentials and endpoints.

The application implements OAuth 2.0 flow for authentication with Procore, though in the demo version this is simulated.

## Using the Dashboard

### Project Schedule

1. Navigate to the "Project Schedule" page
2. Select a project from the dropdown
3. View and interact with the Gantt chart
4. Use the filters to narrow down the displayed tasks
5. Click on a task to view its details
6. Click "Edit" to modify task information
7. Export the schedule to CSV if needed

### Budget & Invoices

1. Navigate to the "Budget & Invoices" page
2. Select a project from the dropdown
3. View budget allocation, costs, and invoice information
4. Create new invoices as needed
5. Generate AIA G702/G703 forms for payment applications
6. Print or download forms as PDF

## Notes for Production Use

- Replace simulated data functions with actual Procore API calls
- Implement proper error handling for API requests
- Set up secure authentication with Procore
- Add user authentication and role-based access control
- Implement data persistence (database or cloud storage)
- Add comprehensive testing

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Procore API documentation
- Bootstrap team for the UI framework
- Chart.js for data visualization
- Frappe Gantt for the Gantt chart implementation