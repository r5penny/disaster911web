import React, { useState, useMemo } from 'react';
import { projectsData } from '../data/projectsData.js';

const DisasterOpsApp = () => {
  const [currentView, setCurrentView] = useState('dashboard');
  const [selectedProject, setSelectedProject] = useState(null);
  const [projects, setProjects] = useState(projectsData);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Calculate aggregate metrics
  const metrics = useMemo(() => {
    const totalRevenue = projects.reduce((sum, p) => sum + p.revenue, 0);
    const outstandingBalance = projects.reduce((sum, p) => sum + p.balanceDue, 0);
    const criticalProjects = projects.filter(p => p.priority === 'Critical').length;
    const depositsCollected = projects.reduce((sum, p) => sum + p.deposit, 0);
    const noDepositProjects = projects.filter(p => p.deposit === 0 && p.status !== 'Complete');
    const noDepositAmount = noDepositProjects.reduce((sum, p) => sum + p.revenue, 0);
    const overdueCount = projects.filter(p => p.overdue).length;

    const budgetedMarginTotal = projects.reduce((sum, p) => sum + (p.revenue * p.budgetedMargin), 0);
    const actualMarginTotal = projects.reduce((sum, p) => {
      const actualCosts = p.actualLabor + p.actualMaterials;
      return sum + (p.revenue - actualCosts);
    }, 0);

    return {
      totalRevenue,
      outstandingBalance,
      criticalProjects,
      depositsCollected,
      noDepositProjects,
      noDepositAmount,
      overdueCount,
      budgetedMarginTotal,
      actualMarginTotal
    };
  }, [projects]);

  // Sorting function
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedProjects = useMemo(() => {
    let sorted = [...projects];
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sorted;
  }, [projects, sortConfig]);

  // Schedule management
  const addToSchedule = (projectId, day) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        const scheduledDays = p.scheduledDays.includes(day)
          ? p.scheduledDays
          : [...p.scheduledDays, day];
        return { ...p, scheduledDays };
      }
      return p;
    }));
  };

  const removeFromSchedule = (projectId, day) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, scheduledDays: p.scheduledDays.filter(d => d !== day) };
      }
      return p;
    }));
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Format percentage
  const formatPercent = (decimal) => {
    return (decimal * 100).toFixed(0) + '%';
  };

  // Get today's date
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Week days for schedule
  const weekDays = [
    { name: 'Monday', date: '11/11' },
    { name: 'Tuesday', date: '11/12' },
    { name: 'Wednesday', date: '11/13' },
    { name: 'Thursday', date: '11/14' },
    { name: 'Friday', date: '11/15' }
  ];

  const getScheduledProjects = (day) => {
    return projects.filter(p => p.scheduledDays.includes(day));
  };

  const getCrewHours = (day) => {
    const scheduled = getScheduledProjects(day);
    return scheduled.reduce((sum, p) => sum + (p.crewSize * 8), 0);
  };

  const unscheduledProjects = projects.filter(p =>
    p.scheduledDays.length === 0 && p.status !== 'Complete'
  );

  // Render Dashboard View
  const renderDashboard = () => (
    <div className="dashboard-view">
      <div className="greeting">
        <h1>Good Morning, Team</h1>
        <p className="date">{dateString}</p>
        <div className="priority-badge">
          {metrics.overdueCount > 0 && (
            <span className="critical">{metrics.overdueCount} Critical Priorities Today</span>
          )}
        </div>
      </div>

      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">Total Revenue</div>
          <div className="metric-value">{formatCurrency(metrics.totalRevenue)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Outstanding Balance</div>
          <div className="metric-value">{formatCurrency(metrics.outstandingBalance)}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Critical Projects</div>
          <div className="metric-value">{metrics.criticalProjects}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">Deposits Collected</div>
          <div className="metric-value">{formatCurrency(metrics.depositsCollected)}</div>
        </div>
      </div>

      <div className="priorities-section">
        <h2>Today's Top Priorities</h2>
        <ul className="priority-list">
          {metrics.overdueCount > 0 && (
            <li className="priority-item critical">
              Call {metrics.overdueCount} overdue customer(s)
            </li>
          )}
          {metrics.noDepositProjects.length > 0 && (
            <li className="priority-item high">
              Get deposits from {metrics.noDepositProjects.length} jobs
            </li>
          )}
          <li className="priority-item">Complete Dave Bleeker by Thursday (11/14)</li>
          <li className="priority-item">Start American Legion (due 11/13)</li>
          <li className="priority-item">Review Kelly Carmody labor overrun</li>
        </ul>
      </div>

      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <button onClick={() => setCurrentView('projects')} className="action-btn">
            View All Projects
          </button>
          <button onClick={() => setCurrentView('schedule')} className="action-btn">
            Plan This Week
          </button>
          <button onClick={() => setCurrentView('margin')} className="action-btn">
            Analyze Margins
          </button>
        </div>
      </div>

      {metrics.noDepositProjects.length > 0 && (
        <div className="alert-box critical">
          <h3>🚨 CRITICAL: {metrics.noDepositProjects.length} Jobs With No Deposits</h3>
          <p>Total at risk: <strong>{formatCurrency(metrics.noDepositAmount)}</strong></p>
          <div className="alert-list">
            <h4>Top 3 Jobs Needing Deposits:</h4>
            <ul>
              {metrics.noDepositProjects.slice(0, 3).map(p => (
                <li key={p.id}>
                  <strong>{p.customer}</strong> - {formatCurrency(p.revenue)}
                </li>
              ))}
            </ul>
          </div>
          <button onClick={() => setCurrentView('projects')} className="alert-action-btn">
            Take Action Now
          </button>
        </div>
      )}
    </div>
  );

  // Render Projects View
  const renderProjects = () => (
    <div className="projects-view">
      <h1>Active Projects</h1>

      <div className="projects-table-container">
        <table className="projects-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('customer')}>Customer {sortConfig.key === 'customer' && (sortConfig.direction === 'asc' ? '▲' : '▼')}</th>
              <th onClick={() => handleSort('jobType')}>Type</th>
              <th onClick={() => handleSort('status')}>Status</th>
              <th onClick={() => handleSort('revenue')}>Revenue</th>
              <th onClick={() => handleSort('balanceDue')}>Balance Due</th>
              <th onClick={() => handleSort('actualMargin')}>Margin</th>
              <th onClick={() => handleSort('priority')}>Priority</th>
              <th>Issues</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {sortedProjects.map(project => (
              <tr key={project.id} className={`priority-${project.priority.toLowerCase()}`}>
                <td><strong>{project.customer}</strong></td>
                <td>
                  <span className={`job-type ${project.jobType.toLowerCase()}`}>
                    {project.jobType}
                  </span>
                </td>
                <td>
                  <span className={`status ${project.status.toLowerCase().replace(' ', '-')}`}>
                    {project.status}
                  </span>
                </td>
                <td>{formatCurrency(project.revenue)}</td>
                <td className={project.balanceDue > project.revenue * 0.8 ? 'high-balance' : ''}>
                  {formatCurrency(project.balanceDue)}
                </td>
                <td className={project.actualMargin < project.budgetedMargin ? 'margin-low' : 'margin-good'}>
                  {formatPercent(project.actualMargin)}
                </td>
                <td>
                  <span className={`priority-badge ${project.priority.toLowerCase()}`}>
                    {project.priority}
                  </span>
                </td>
                <td>
                  <div className="issues-tags">
                    {project.issues.map((issue, idx) => (
                      <span key={idx} className="issue-tag">{issue}</span>
                    ))}
                  </div>
                </td>
                <td>
                  <button
                    onClick={() => {
                      setSelectedProject(project);
                      setCurrentView('detail');
                    }}
                    className="view-btn"
                  >
                    View →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // Render Schedule View
  const renderSchedule = () => (
    <div className="schedule-view">
      <h1>Weekly Schedule</h1>
      <p className="subtitle">Week of November 11-15, 2025</p>

      <div className="calendar-grid">
        {weekDays.map(day => (
          <div key={day.name} className="day-column">
            <div className="day-header">
              <h3>{day.name}</h3>
              <p className="day-date">{day.date}</p>
              <p className="crew-hours">{getCrewHours(day.name)} crew-hours</p>
            </div>

            <div className="scheduled-projects">
              {getScheduledProjects(day.name).map(project => (
                <div key={project.id} className={`scheduled-card priority-${project.priority.toLowerCase()}`}>
                  <div className="scheduled-card-header">
                    <strong>{project.customer}</strong>
                    <button
                      onClick={() => removeFromSchedule(project.id, day.name)}
                      className="remove-btn"
                      title="Remove from schedule"
                    >
                      ✕
                    </button>
                  </div>
                  <p>{project.duration} days • {project.crewSize} crew</p>
                  <p className="scheduled-revenue">{formatCurrency(project.revenue)}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {unscheduledProjects.length > 0 && (
        <div className="unscheduled-section">
          <h2>Unscheduled Projects ({unscheduledProjects.length})</h2>
          <div className="unscheduled-grid">
            {unscheduledProjects.map(project => (
              <div key={project.id} className={`unscheduled-card priority-${project.priority.toLowerCase()}`}>
                <div className="unscheduled-header">
                  <strong>{project.customer}</strong>
                  <span className={`priority-badge ${project.priority.toLowerCase()}`}>
                    {project.priority}
                  </span>
                </div>
                <p>{project.jobType} • {project.duration} days • {project.crewSize} crew</p>
                <p className="unscheduled-revenue">{formatCurrency(project.revenue)}</p>
                {project.issues.length > 0 && (
                  <div className="issues-tags">
                    {project.issues.map((issue, idx) => (
                      <span key={idx} className="issue-tag-small">{issue}</span>
                    ))}
                  </div>
                )}
                <div className="schedule-actions">
                  <p className="schedule-label">Add to:</p>
                  <div className="day-buttons">
                    {weekDays.map(day => (
                      <button
                        key={day.name}
                        onClick={() => addToSchedule(project.id, day.name)}
                        className="day-btn"
                        title={`Add to ${day.name}`}
                      >
                        {day.name.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // Render Margin Analysis View
  const renderMarginAnalysis = () => {
    const budgetedLabor = projects.reduce((sum, p) => sum + p.budgetedLabor, 0);
    const actualLabor = projects.reduce((sum, p) => sum + p.actualLabor, 0);
    const budgetedMaterials = projects.reduce((sum, p) => sum + p.budgetedMaterials, 0);
    const actualMaterials = projects.reduce((sum, p) => sum + p.actualMaterials, 0);

    return (
      <div className="margin-view">
        <h1>Margin Analysis</h1>

        <div className="margin-summary">
          <div className="margin-card">
            <div className="margin-label">Total Revenue</div>
            <div className="margin-value">{formatCurrency(metrics.totalRevenue)}</div>
          </div>
          <div className="margin-card">
            <div className="margin-label">Budgeted Margin</div>
            <div className="margin-value">{formatCurrency(metrics.budgetedMarginTotal)}</div>
            <div className="margin-percent">{formatPercent(metrics.budgetedMarginTotal / metrics.totalRevenue)}</div>
          </div>
          <div className="margin-card">
            <div className="margin-label">Actual Margin</div>
            <div className="margin-value">{formatCurrency(metrics.actualMarginTotal)}</div>
            <div className="margin-percent">{formatPercent(metrics.actualMarginTotal / metrics.totalRevenue)}</div>
          </div>
        </div>

        <div className="cost-breakdown">
          <h2>Cost Breakdown</h2>
          <div className="breakdown-grid">
            <div className="breakdown-section">
              <h3>Labor Costs</h3>
              <div className="breakdown-row">
                <span>Budgeted:</span>
                <span>{formatCurrency(budgetedLabor)}</span>
              </div>
              <div className="breakdown-row">
                <span>Actual:</span>
                <span className={actualLabor > budgetedLabor ? 'over-budget' : 'under-budget'}>
                  {formatCurrency(actualLabor)}
                </span>
              </div>
              <div className="breakdown-row variance">
                <span>Variance:</span>
                <span className={actualLabor > budgetedLabor ? 'over-budget' : 'under-budget'}>
                  {formatCurrency(actualLabor - budgetedLabor)}
                  {actualLabor > budgetedLabor ? ' over' : ' under'}
                </span>
              </div>
            </div>

            <div className="breakdown-section">
              <h3>Material Costs</h3>
              <div className="breakdown-row">
                <span>Budgeted:</span>
                <span>{formatCurrency(budgetedMaterials)}</span>
              </div>
              <div className="breakdown-row">
                <span>Actual:</span>
                <span className={actualMaterials > budgetedMaterials ? 'over-budget' : 'under-budget'}>
                  {formatCurrency(actualMaterials)}
                </span>
              </div>
              <div className="breakdown-row variance">
                <span>Variance:</span>
                <span className={actualMaterials > budgetedMaterials ? 'over-budget' : 'under-budget'}>
                  {formatCurrency(actualMaterials - budgetedMaterials)}
                  {actualMaterials > budgetedMaterials ? ' over' : ' under'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="project-performance">
          <h2>Project Performance</h2>
          <table className="performance-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Revenue</th>
                <th>Budgeted Margin</th>
                <th>Actual Margin</th>
                <th>Variance</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              {projects.map(project => {
                const budgetedMargin = project.revenue * project.budgetedMargin;
                const actualCosts = project.actualLabor + project.actualMaterials;
                const actualMargin = project.revenue - actualCosts;
                const variance = actualMargin - budgetedMargin;

                return (
                  <tr key={project.id}>
                    <td><strong>{project.customer}</strong></td>
                    <td>{formatCurrency(project.revenue)}</td>
                    <td>{formatCurrency(budgetedMargin)}</td>
                    <td className={actualMargin < budgetedMargin ? 'margin-low' : 'margin-good'}>
                      {formatCurrency(actualMargin)}
                    </td>
                    <td className={variance < 0 ? 'over-budget' : 'under-budget'}>
                      {formatCurrency(Math.abs(variance))} {variance < 0 ? 'loss' : 'gain'}
                    </td>
                    <td>
                      <div className="performance-bar">
                        <div
                          className={`performance-fill ${actualMargin >= budgetedMargin ? 'good' : 'poor'}`}
                          style={{ width: `${Math.min((actualMargin / budgetedMargin) * 100, 100)}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // Render Project Detail View
  const renderProjectDetail = () => {
    if (!selectedProject) return null;

    const budgetedMargin = selectedProject.revenue * selectedProject.budgetedMargin;
    const actualCosts = selectedProject.actualLabor + selectedProject.actualMaterials;
    const actualMargin = selectedProject.revenue - actualCosts;
    const laborVariance = selectedProject.actualLabor - selectedProject.budgetedLabor;
    const materialVariance = selectedProject.actualMaterials - selectedProject.budgetedMaterials;

    return (
      <div className="detail-view">
        <button onClick={() => setCurrentView('projects')} className="back-btn">
          ← Back to Projects
        </button>

        <div className="detail-header">
          <h1>{selectedProject.customer}</h1>
          <span className={`status ${selectedProject.status.toLowerCase().replace(' ', '-')}`}>
            {selectedProject.status}
          </span>
        </div>

        <div className="detail-grid">
          <div className="detail-section">
            <h2>Financial Overview</h2>
            <div className="detail-row">
              <span>Total Revenue:</span>
              <strong>{formatCurrency(selectedProject.revenue)}</strong>
            </div>
            <div className="detail-row">
              <span>Deposit Collected:</span>
              <strong className={selectedProject.deposit === 0 ? 'alert-text' : ''}>
                {formatCurrency(selectedProject.deposit)}
              </strong>
            </div>
            <div className="detail-row">
              <span>Balance Due:</span>
              <strong>{formatCurrency(selectedProject.balanceDue)}</strong>
            </div>
            <div className="detail-row">
              <span>Budgeted Margin:</span>
              <strong>{formatCurrency(budgetedMargin)} ({formatPercent(selectedProject.budgetedMargin)})</strong>
            </div>
            <div className="detail-row">
              <span>Actual Margin:</span>
              <strong className={actualMargin < budgetedMargin ? 'margin-low' : 'margin-good'}>
                {formatCurrency(actualMargin)} ({formatPercent(actualMargin / selectedProject.revenue)})
              </strong>
            </div>
          </div>

          <div className="detail-section">
            <h2>Cost Details</h2>

            <h3>Labor</h3>
            <div className="detail-row">
              <span>Budgeted:</span>
              <span>{formatCurrency(selectedProject.budgetedLabor)}</span>
            </div>
            <div className="detail-row">
              <span>Actual:</span>
              <span className={laborVariance > 0 ? 'over-budget' : 'under-budget'}>
                {formatCurrency(selectedProject.actualLabor)}
              </span>
            </div>
            <div className="detail-row">
              <span>Variance:</span>
              <strong className={laborVariance > 0 ? 'over-budget' : 'under-budget'}>
                {formatCurrency(Math.abs(laborVariance))} {laborVariance > 0 ? 'over' : 'under'}
              </strong>
            </div>

            <h3>Materials</h3>
            <div className="detail-row">
              <span>Budgeted:</span>
              <span>{formatCurrency(selectedProject.budgetedMaterials)}</span>
            </div>
            <div className="detail-row">
              <span>Actual:</span>
              <span className={materialVariance > 0 ? 'over-budget' : 'under-budget'}>
                {formatCurrency(selectedProject.actualMaterials)}
              </span>
            </div>
            <div className="detail-row">
              <span>Variance:</span>
              <strong className={materialVariance > 0 ? 'over-budget' : 'under-budget'}>
                {formatCurrency(Math.abs(materialVariance))} {materialVariance > 0 ? 'over' : 'under'}
              </strong>
            </div>
          </div>

          <div className="detail-section">
            <h2>Project Info</h2>
            <div className="detail-row">
              <span>Job Type:</span>
              <strong>{selectedProject.jobType}</strong>
            </div>
            <div className="detail-row">
              <span>Priority:</span>
              <strong className={`priority-${selectedProject.priority.toLowerCase()}`}>
                {selectedProject.priority}
              </strong>
            </div>
            <div className="detail-row">
              <span>Duration:</span>
              <strong>{selectedProject.duration} days</strong>
            </div>
            <div className="detail-row">
              <span>Crew Size:</span>
              <strong>{selectedProject.crewSize} workers</strong>
            </div>
            <div className="detail-row">
              <span>Due Date:</span>
              <strong className={selectedProject.overdue ? 'alert-text' : ''}>
                {new Date(selectedProject.dueDate).toLocaleDateString()}
              </strong>
            </div>
          </div>

          {selectedProject.issues.length > 0 && (
            <div className="detail-section issues-section">
              <h2>Issues Requiring Attention</h2>
              <ul className="issues-list">
                {selectedProject.issues.map((issue, idx) => (
                  <li key={idx} className="issue-item">
                    <span className="issue-icon">⚠️</span>
                    {issue}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Main render
  return (
    <div className="disaster-ops-app">
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Disaster Response</h2>
          <p>Operations Center</p>
        </div>

        <nav className="nav-menu">
          <button
            className={`nav-item ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            <span className="nav-icon">📊</span>
            Dashboard
          </button>
          <button
            className={`nav-item ${currentView === 'projects' ? 'active' : ''}`}
            onClick={() => setCurrentView('projects')}
          >
            <span className="nav-icon">📋</span>
            Projects
          </button>
          <button
            className={`nav-item ${currentView === 'schedule' ? 'active' : ''}`}
            onClick={() => setCurrentView('schedule')}
          >
            <span className="nav-icon">📅</span>
            Schedule
          </button>
          <button
            className={`nav-item ${currentView === 'margin' ? 'active' : ''}`}
            onClick={() => setCurrentView('margin')}
          >
            <span className="nav-icon">💰</span>
            Margin Analysis
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="contact-info">
            <p><strong>Emergency Response</strong></p>
            <p>📞 (555) 911-HELP</p>
            <p>✉️ ops@disaster911.com</p>
          </div>
        </div>
      </div>

      <div className="main-content">
        {currentView === 'dashboard' && renderDashboard()}
        {currentView === 'projects' && renderProjects()}
        {currentView === 'schedule' && renderSchedule()}
        {currentView === 'margin' && renderMarginAnalysis()}
        {currentView === 'detail' && renderProjectDetail()}
      </div>

      <style>{`
        .disaster-ops-app {
          display: flex;
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: #f5f5f5;
        }

        /* Sidebar */
        .sidebar {
          width: 260px;
          background: #1a1a2e;
          color: white;
          display: flex;
          flex-direction: column;
          position: fixed;
          height: 100vh;
          overflow-y: auto;
        }

        .sidebar-header {
          padding: 24px 20px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }

        .sidebar-header h2 {
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 600;
        }

        .sidebar-header p {
          margin: 0;
          font-size: 13px;
          color: #a0a0a0;
        }

        .nav-menu {
          flex: 1;
          padding: 16px 0;
        }

        .nav-item {
          width: 100%;
          padding: 12px 20px;
          border: none;
          background: transparent;
          color: #ccc;
          text-align: left;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          gap: 12px;
          transition: all 0.2s;
        }

        .nav-item:hover {
          background: rgba(255,255,255,0.05);
          color: white;
        }

        .nav-item.active {
          background: rgba(76, 175, 80, 0.2);
          color: white;
          border-left: 3px solid #4CAF50;
        }

        .nav-icon {
          font-size: 18px;
        }

        .sidebar-footer {
          padding: 20px;
          border-top: 1px solid rgba(255,255,255,0.1);
          font-size: 12px;
        }

        .contact-info p {
          margin: 4px 0;
          color: #a0a0a0;
        }

        .contact-info strong {
          color: white;
        }

        /* Main Content */
        .main-content {
          flex: 1;
          margin-left: 260px;
          padding: 32px;
          overflow-y: auto;
        }

        /* Dashboard */
        .greeting h1 {
          margin: 0 0 8px 0;
          font-size: 32px;
          color: #333;
        }

        .date {
          color: #666;
          margin: 0 0 16px 0;
        }

        .priority-badge {
          margin: 16px 0;
        }

        .priority-badge .critical {
          background: #f44336;
          color: white;
          padding: 8px 16px;
          border-radius: 4px;
          display: inline-block;
          font-weight: 500;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin: 24px 0;
        }

        .metric-card {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .metric-label {
          color: #666;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .metric-value {
          font-size: 28px;
          font-weight: 600;
          color: #333;
        }

        .priorities-section {
          background: white;
          padding: 24px;
          border-radius: 8px;
          margin: 24px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .priorities-section h2 {
          margin: 0 0 16px 0;
          font-size: 20px;
          color: #333;
        }

        .priority-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .priority-item {
          padding: 12px;
          margin: 8px 0;
          background: #f9f9f9;
          border-left: 4px solid #2196F3;
          border-radius: 4px;
        }

        .priority-item.critical {
          background: #ffebee;
          border-left-color: #f44336;
        }

        .priority-item.high {
          background: #fff3e0;
          border-left-color: #ff9800;
        }

        .quick-actions {
          background: white;
          padding: 24px;
          border-radius: 8px;
          margin: 24px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .quick-actions h2 {
          margin: 0 0 16px 0;
          font-size: 20px;
          color: #333;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .action-btn {
          padding: 12px 24px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.2s;
        }

        .action-btn:hover {
          background: #45a049;
        }

        .alert-box {
          background: #ffebee;
          border: 2px solid #f44336;
          border-radius: 8px;
          padding: 24px;
          margin: 24px 0;
        }

        .alert-box h3 {
          margin: 0 0 12px 0;
          color: #c62828;
        }

        .alert-box p {
          margin: 8px 0;
        }

        .alert-list {
          margin: 16px 0;
        }

        .alert-list h4 {
          margin: 0 0 8px 0;
          color: #333;
        }

        .alert-list ul {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .alert-list li {
          padding: 8px;
          background: white;
          margin: 4px 0;
          border-radius: 4px;
        }

        .alert-action-btn {
          padding: 12px 24px;
          background: #f44336;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 600;
          margin-top: 16px;
          transition: background 0.2s;
        }

        .alert-action-btn:hover {
          background: #d32f2f;
        }

        /* Projects View */
        .projects-view {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .projects-view h1 {
          margin: 0 0 24px 0;
          color: #333;
        }

        .projects-table-container {
          overflow-x: auto;
        }

        .projects-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .projects-table th {
          background: #f5f5f5;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #333;
          cursor: pointer;
          user-select: none;
        }

        .projects-table th:hover {
          background: #eee;
        }

        .projects-table td {
          padding: 12px;
          border-bottom: 1px solid #eee;
        }

        .projects-table tr.priority-critical {
          background: #ffebee;
        }

        .projects-table tr.priority-high {
          background: #fff3e0;
        }

        .job-type {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .job-type.water {
          background: #e3f2fd;
          color: #1976d2;
        }

        .job-type.mold {
          background: #f3e5f5;
          color: #7b1fa2;
        }

        .job-type.structure {
          background: #e8f5e9;
          color: #388e3c;
        }

        .status {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .status.active {
          background: #e3f2fd;
          color: #1976d2;
        }

        .status.not-started {
          background: #fff3e0;
          color: #f57c00;
        }

        .status.complete {
          background: #e8f5e9;
          color: #388e3c;
        }

        .high-balance {
          color: #f44336;
          font-weight: 600;
        }

        .margin-low {
          color: #f44336;
        }

        .margin-good {
          color: #4caf50;
        }

        .priority-badge {
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 500;
        }

        .priority-badge.critical {
          background: #f44336;
          color: white;
        }

        .priority-badge.high {
          background: #ff9800;
          color: white;
        }

        .priority-badge.medium {
          background: #2196f3;
          color: white;
        }

        .issues-tags {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
        }

        .issue-tag {
          background: #f44336;
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 600;
        }

        .view-btn {
          padding: 6px 12px;
          background: #2196f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: background 0.2s;
        }

        .view-btn:hover {
          background: #1976d2;
        }

        /* Schedule View */
        .schedule-view {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .schedule-view h1 {
          margin: 0 0 8px 0;
          color: #333;
        }

        .subtitle {
          color: #666;
          margin: 0 0 24px 0;
        }

        .calendar-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        .day-column {
          background: #f9f9f9;
          border-radius: 8px;
          min-height: 400px;
        }

        .day-header {
          background: #1a1a2e;
          color: white;
          padding: 12px;
          border-radius: 8px 8px 0 0;
          text-align: center;
        }

        .day-header h3 {
          margin: 0 0 4px 0;
          font-size: 16px;
        }

        .day-date {
          margin: 0;
          font-size: 12px;
          color: #a0a0a0;
        }

        .crew-hours {
          margin: 8px 0 0 0;
          font-size: 12px;
          color: #4caf50;
          font-weight: 600;
        }

        .scheduled-projects {
          padding: 12px;
        }

        .scheduled-card {
          background: white;
          padding: 12px;
          border-radius: 6px;
          margin-bottom: 8px;
          border-left: 4px solid #2196f3;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .scheduled-card.priority-critical {
          border-left-color: #f44336;
        }

        .scheduled-card.priority-high {
          border-left-color: #ff9800;
        }

        .scheduled-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .remove-btn {
          background: #f44336;
          color: white;
          border: none;
          border-radius: 50%;
          width: 20px;
          height: 20px;
          cursor: pointer;
          font-size: 12px;
          line-height: 1;
          transition: background 0.2s;
        }

        .remove-btn:hover {
          background: #d32f2f;
        }

        .scheduled-card p {
          margin: 4px 0;
          font-size: 12px;
          color: #666;
        }

        .scheduled-revenue {
          font-weight: 600;
          color: #333;
        }

        .unscheduled-section {
          margin-top: 32px;
          padding-top: 32px;
          border-top: 2px solid #eee;
        }

        .unscheduled-section h2 {
          margin: 0 0 16px 0;
          color: #333;
        }

        .unscheduled-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .unscheduled-card {
          background: white;
          border: 2px solid #eee;
          border-radius: 8px;
          padding: 16px;
        }

        .unscheduled-card.priority-critical {
          border-color: #f44336;
        }

        .unscheduled-card.priority-high {
          border-color: #ff9800;
        }

        .unscheduled-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .unscheduled-card p {
          margin: 4px 0;
          font-size: 13px;
          color: #666;
        }

        .unscheduled-revenue {
          font-weight: 600;
          color: #333;
          margin: 8px 0;
        }

        .issue-tag-small {
          background: #f44336;
          color: white;
          padding: 2px 6px;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 600;
          margin-right: 4px;
        }

        .schedule-actions {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #eee;
        }

        .schedule-label {
          font-size: 12px;
          color: #666;
          margin: 0 0 8px 0;
        }

        .day-buttons {
          display: flex;
          gap: 4px;
        }

        .day-btn {
          flex: 1;
          padding: 6px 4px;
          background: #2196f3;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
          transition: background 0.2s;
        }

        .day-btn:hover {
          background: #1976d2;
        }

        /* Margin Analysis */
        .margin-view {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .margin-view h1 {
          margin: 0 0 24px 0;
          color: #333;
        }

        .margin-summary {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 32px;
        }

        .margin-card {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
        }

        .margin-label {
          color: #666;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .margin-value {
          font-size: 24px;
          font-weight: 600;
          color: #333;
        }

        .margin-percent {
          font-size: 16px;
          color: #4caf50;
          margin-top: 4px;
        }

        .cost-breakdown {
          margin: 32px 0;
        }

        .cost-breakdown h2 {
          margin: 0 0 16px 0;
          color: #333;
        }

        .breakdown-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }

        .breakdown-section {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
        }

        .breakdown-section h3 {
          margin: 0 0 16px 0;
          color: #333;
          font-size: 16px;
        }

        .breakdown-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }

        .breakdown-row.variance {
          font-weight: 600;
          border-bottom: none;
          margin-top: 8px;
        }

        .over-budget {
          color: #f44336;
        }

        .under-budget {
          color: #4caf50;
        }

        .project-performance {
          margin-top: 32px;
        }

        .project-performance h2 {
          margin: 0 0 16px 0;
          color: #333;
        }

        .performance-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 14px;
        }

        .performance-table th {
          background: #f5f5f5;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          color: #333;
        }

        .performance-table td {
          padding: 12px;
          border-bottom: 1px solid #eee;
        }

        .performance-bar {
          width: 100%;
          height: 20px;
          background: #eee;
          border-radius: 10px;
          overflow: hidden;
        }

        .performance-fill {
          height: 100%;
          transition: width 0.3s;
        }

        .performance-fill.good {
          background: #4caf50;
        }

        .performance-fill.poor {
          background: #f44336;
        }

        /* Detail View */
        .detail-view {
          background: white;
          padding: 24px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .back-btn {
          padding: 8px 16px;
          background: #666;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
          margin-bottom: 24px;
          transition: background 0.2s;
        }

        .back-btn:hover {
          background: #555;
        }

        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .detail-header h1 {
          margin: 0;
          color: #333;
        }

        .detail-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
        }

        .detail-section {
          background: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
        }

        .detail-section h2 {
          margin: 0 0 16px 0;
          font-size: 18px;
          color: #333;
        }

        .detail-section h3 {
          margin: 16px 0 8px 0;
          font-size: 14px;
          color: #666;
        }

        .detail-row {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid #eee;
        }

        .alert-text {
          color: #f44336;
        }

        .issues-section {
          grid-column: 1 / -1;
        }

        .issues-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .issue-item {
          background: white;
          padding: 12px;
          margin: 8px 0;
          border-radius: 4px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .issue-icon {
          font-size: 18px;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .sidebar {
            width: 200px;
          }

          .main-content {
            margin-left: 200px;
            padding: 16px;
          }

          .calendar-grid {
            grid-template-columns: 1fr;
          }

          .metrics-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default DisasterOpsApp;
