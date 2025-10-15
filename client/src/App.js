import React, { useState, useEffect } from 'react';
import moment from 'moment';
import { 
  Plus, 
  CheckCircle, 
  Circle, 
  Calendar, 
  BarChart3, 
  Tag, 
  Edit3, 
  Trash2,
  X,
  Clock,
  Download,
  Upload,
  Settings,
  Sun,
  Moon
} from 'lucide-react';
import { taskService, categoryService, statisticsService, dataService } from './services/localStorage';
import notificationService from './services/notificationService';
import './index.css';

function App() {
  const [tasks, setTasks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [activeTab, setActiveTab] = useState('today');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Form states
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    dueDate: moment().add(1, 'day').format('YYYY-MM-DD'),
    time: ''
  });

  const [categoryForm, setCategoryForm] = useState({
    name: '',
    color: '#3B82F6'
  });

  // Load data
  useEffect(() => {
    loadTasks();
    loadCategories();
    loadStatistics();
  }, []);

  // Initialize notification service when tasks change
  useEffect(() => {
    if (tasks.length > 0) {
      notificationService.updateNotifications(tasks);
    }
  }, [tasks]);

  // Theme toggle
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    if (isDarkMode) {
      document.body.classList.add('light-mode');
      document.body.classList.remove('dark-mode');
    } else {
      document.body.classList.add('dark-mode');
      document.body.classList.remove('light-mode');
    }
  };

  const loadTasks = () => {
    try {
      const tasks = taskService.getAll();
      setTasks(tasks);
      // Update notifications when tasks are loaded
      notificationService.updateNotifications(tasks);
      // Check for overdue tasks
      notificationService.checkOverdueTasks(tasks);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadCategories = () => {
    try {
      const categories = categoryService.getAll();
      setCategories(categories);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadStatistics = () => {
    try {
      const stats = statisticsService.getAll();
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleTaskSubmit = (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (editingTask) {
        taskService.update(editingTask.id, taskForm);
        showNotification('Task updated successfully!', 'success');
      } else {
        taskService.create(taskForm);
        showNotification('Task created successfully!', 'success');
      }
      loadTasks();
      loadStatistics();
      setShowTaskModal(false);
      setEditingTask(null);
      setTaskForm({
        title: '',
        description: '',
        category: '',
        priority: 'medium',
        dueDate: moment().add(1, 'day').format('YYYY-MM-DD'),
        time: ''
      });
    } catch (error) {
      console.error('Error saving task:', error);
      showNotification('Error saving task. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        categoryService.update(editingCategory.id, categoryForm);
      } else {
        categoryService.create(categoryForm);
      }
      loadCategories();
      setShowCategoryModal(false);
      setEditingCategory(null);
      setCategoryForm({ name: '', color: '#3B82F6' });
    } catch (error) {
      console.error('Error saving category:', error);
    }
  };

  const toggleTaskCompletion = (taskId) => {
    try {
      taskService.toggleCompletion(taskId);
      loadTasks();
      loadStatistics();
      // Clear notification for completed task
      notificationService.clearTaskNotification(taskId);
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const deleteTask = (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        taskService.delete(taskId);
        // Clear notification for deleted task
        notificationService.clearTaskNotification(taskId);
        loadTasks();
        loadStatistics();
      } catch (error) {
        console.error('Error deleting task:', error);
      }
    }
  };

  const deleteCategory = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    if (!category) return;

    // Check if category is being used by any tasks
    const tasksUsingCategory = tasks.filter(task => task.category === category.name);
    if (tasksUsingCategory.length > 0) {
      const reassign = window.confirm(
        `Category "${category.name}" is being used by ${tasksUsingCategory.length} task(s). ` +
        `Would you like to reassign these tasks to another category before deleting?`
      );
      
      if (reassign) {
        const availableCategories = categories.filter(cat => cat.id !== categoryId);
        if (availableCategories.length === 0) {
          alert('Cannot delete the last category. Please create another category first.');
          return;
        }
        
        const newCategoryName = window.prompt(
          `Choose a new category for these tasks:\n${availableCategories.map(cat => `- ${cat.name}`).join('\n')}`,
          availableCategories[0].name
        );
        
        if (newCategoryName && availableCategories.find(cat => cat.name === newCategoryName)) {
          // Reassign tasks to new category
          tasksUsingCategory.forEach(task => {
            taskService.update(task.id, { category: newCategoryName });
          });
          loadTasks();
        } else {
          return; // User cancelled or invalid category
        }
      } else {
        return; // User cancelled
      }
    }

    if (window.confirm(`Are you sure you want to delete the category "${category.name}"?`)) {
      try {
        categoryService.delete(categoryId);
        loadCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error deleting category. Please try again.');
      }
    }
  };

  const editTask = (task) => {
    setEditingTask(task);
    setTaskForm({
      title: task.title,
      description: task.description,
      category: task.category,
      priority: task.priority,
      dueDate: moment(task.dueDate).format('YYYY-MM-DD'),
      time: task.time || ''
    });
    setShowTaskModal(true);
  };

  const editCategory = (category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      color: category.color
    });
    setShowCategoryModal(true);
  };

  const getFilteredTasks = () => {
    const today = moment().startOf('day');
    const tomorrow = moment().add(1, 'day').startOf('day');
    const endOfWeek = moment().endOf('week');
    const yesterday = moment().subtract(1, 'day').startOf('day');

    switch (activeTab) {
      case 'today':
        return tasks.filter(task => moment(task.dueDate).isSame(today, 'day'));
      case 'tomorrow':
        return tasks.filter(task => moment(task.dueDate).isSame(tomorrow, 'day'));
      case 'week':
        return tasks.filter(task => moment(task.dueDate).isBetween(today, endOfWeek, null, '[]'));
      case 'completed':
        return tasks.filter(task => task.completed);
      case 'past':
        return tasks.filter(task => moment(task.dueDate).isBefore(today, 'day'));
      default:
        return tasks;
    }
  };

  const getCategoryColor = (categoryName) => {
    const category = categories.find(cat => cat.name === categoryName);
    return category ? category.color : '#6B7280';
  };

  const getPriorityClass = (priority) => {
    return `priority-${priority}`;
  };

  const formatDate = (date) => {
    return moment(date).format('MMM D, YYYY');
  };

  const isOverdue = (dueDate) => {
    return moment(dueDate).isBefore(moment(), 'day') && !tasks.find(t => t.dueDate === dueDate)?.completed;
  };

  return (
    <div className="container">
      {/* Notification Banner */}
      {notification && (
        <div className={`notification notification-${notification.type}`}>
          <div className="notification-content">
            <span className="notification-icon">
              {notification.type === 'success' ? '✅' : '❌'}
            </span>
            <span className="notification-message">{notification.message}</span>
          </div>
        </div>
      )}

      <div className="header">
        <h1>Task Planner</h1>
        <p>Plan, track, and manage your daily tasks with categories and progress tracking</p>
      </div>

      {/* Statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{statistics.totalTasks || 0}</div>
          <div className="stat-label">Total Tasks</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{statistics.completedTasks || 0}</div>
          <div className="stat-label">Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{statistics.completionRate || 0}%</div>
          <div className="stat-label">Completion Rate</div>
          <div className="progress-bar-container">
            <div 
              className="progress-bar" 
              style={{ width: `${statistics.completionRate || 0}%` }}
            ></div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{statistics.upcomingTasks || 0}</div>
          <div className="stat-label">Upcoming</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'today' ? 'active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          Today
        </button>
        <button 
          className={`tab ${activeTab === 'tomorrow' ? 'active' : ''}`}
          onClick={() => setActiveTab('tomorrow')}
        >
          Tomorrow
        </button>
        <button 
          className={`tab ${activeTab === 'week' ? 'active' : ''}`}
          onClick={() => setActiveTab('week')}
        >
          This Week
        </button>
        <button 
          className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed
        </button>
        <button 
          className={`tab ${activeTab === 'past' ? 'active' : ''}`}
          onClick={() => setActiveTab('past')}
        >
          Past Tasks
        </button>
        <button 
          className={`tab ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          <Tag size={16} />
          Categories
        </button>
        <button 
          className={`tab ${activeTab === 'statistics' ? 'active' : ''}`}
          onClick={() => setActiveTab('statistics')}
        >
          <BarChart3 size={16} />
          Stats
        </button>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button 
          className="btn btn-primary"
          onClick={() => {
            setEditingTask(null);
            setShowTaskModal(true);
          }}
        >
          <Plus size={16} />
          Add Task
        </button>
        <button 
          className="btn btn-secondary"
          onClick={() => {
            setEditingCategory(null);
            setShowCategoryModal(true);
          }}
        >
          <Tag size={16} />
          Add Category
        </button>
        <button 
          className="btn btn-success"
          onClick={() => dataService.downloadData()}
        >
          <Download size={16} />
          Export Data
        </button>
        <input
          type="file"
          accept=".json"
          onChange={(e) => {
            const file = e.target.files[0];
            if (file) {
              dataService.uploadData(file)
                .then(() => {
                  loadTasks();
                  loadCategories();
                  loadStatistics();
                  alert('Data imported successfully!');
                })
                .catch(() => {
                  alert('Error importing data. Please check the file format.');
                });
              e.target.value = '';
            }
          }}
          style={{ display: 'none' }}
          id="import-file"
        />
        <button 
          className="btn btn-secondary"
          onClick={() => document.getElementById('import-file').click()}
        >
          <Upload size={16} />
          Import Data
        </button>
        <button 
          className="btn btn-secondary"
          onClick={toggleTheme}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          {isDarkMode ? 'Light' : 'Dark'}
        </button>
        <button 
          className="btn btn-secondary"
          onClick={() => {
            if (notificationService.isNotificationSupported()) {
              alert('Notifications are enabled! You will receive reminders for your tasks.');
            } else {
              alert('Notifications are not supported or permission not granted. Please enable notifications in your browser settings.');
            }
          }}
          title="Check notification status"
        >
          <Settings size={16} />
          Notifications
        </button>
      </div>

      {/* Categories Management */}
      {activeTab === 'categories' && (
        <div className="categories-container">
          <div className="categories-header">
            <h2 className="categories-title">🏷️ Category Management</h2>
            <p className="categories-subtitle">Organize your tasks with custom categories and track your productivity</p>
          </div>
          
          {categories.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏷️</div>
              <h3>No categories found</h3>
              <p>Create your first category to organize your tasks!</p>
            </div>
          ) : (
            <div className="categories-grid">
              {categories.map(category => {
                const categoryTasks = tasks.filter(task => task.category === category.name);
                const completedTasks = categoryTasks.filter(task => task.completed);
                const completionRate = categoryTasks.length > 0 ? Math.round((completedTasks.length / categoryTasks.length) * 100) : 0;
                
                return (
                  <div key={category.id} className="category-card enhanced">
                    <div className="category-card-header">
                      <div className="category-color-indicator" style={{ backgroundColor: category.color }} />
                      <div className="category-main-info">
                        <h3 className="category-name">{category.name}</h3>
                        <div className="category-stats">
                          <span className="category-task-count">{categoryTasks.length} tasks</span>
                          <span className="category-completion">{completionRate}% complete</span>
                        </div>
                      </div>
                      <div className="category-actions">
                        <button 
                          className="btn btn-sm btn-secondary"
                          onClick={() => editCategory(category)}
                          title="Edit category"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => deleteCategory(category.id)}
                          title="Delete category"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    
                    <div className="category-progress-section">
                      <div className="category-progress-bar-container">
                        <div 
                          className="category-progress-bar"
                          style={{
                            width: `${completionRate}%`,
                            background: `linear-gradient(90deg, ${category.color} 0%, ${category.color}CC 100%)`
                          }}
                        />
                      </div>
                      <div className="category-progress-text">
                        {completedTasks.length} of {categoryTasks.length} completed
                      </div>
                    </div>
                    
                    {categoryTasks.length > 0 && (
                      <div className="category-tasks-preview">
                        <div className="preview-header">
                          <span className="preview-title">Recent Tasks</span>
                          <span className="preview-count">{categoryTasks.length} total</span>
                        </div>
                        <div className="preview-tasks">
                          {categoryTasks.slice(0, 3).map(task => (
                            <div key={task.id} className={`preview-task ${task.completed ? 'completed' : ''}`}>
                              <div className="preview-task-status">
                                {task.completed ? '✓' : '○'}
                              </div>
                              <div className="preview-task-content">
                                <div className="preview-task-title">{task.title}</div>
                                <div className="preview-task-meta">
                                  <span className={`preview-task-priority priority-${task.priority}`}>
                                    {task.priority}
                                  </span>
                                  <span className="preview-task-date">
                                    {moment(task.dueDate).format('MMM D')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                          {categoryTasks.length > 3 && (
                            <div className="preview-more">
                              +{categoryTasks.length - 3} more tasks
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="category-footer">
                      <div className="category-metrics">
                        <div className="metric">
                          <span className="metric-label">Completed</span>
                          <span className="metric-value">{completedTasks.length}</span>
                        </div>
                        <div className="metric">
                          <span className="metric-label">Pending</span>
                          <span className="metric-value">{categoryTasks.length - completedTasks.length}</span>
                        </div>
                        <div className="metric">
                          <span className="metric-label">Rate</span>
                          <span className="metric-value">{completionRate}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tasks List */}
      {activeTab !== 'statistics' && activeTab !== 'categories' && (
        <div className="card">
          <h2 style={{ marginBottom: '20px', color: '#111827' }}>
            {activeTab === 'today' && 'Today\'s Tasks'}
            {activeTab === 'tomorrow' && 'Tomorrow\'s Tasks'}
            {activeTab === 'week' && 'This Week\'s Tasks'}
            {activeTab === 'completed' && 'Completed Tasks'}
            {activeTab === 'past' && 'Past Tasks'}
          </h2>

          {getFilteredTasks().length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">
                {activeTab === 'past' ? '📅' : '📝'}
              </div>
              <h3>
                {activeTab === 'past' ? 'No past tasks found' : 'No tasks found'}
              </h3>
              <p>
                {activeTab === 'past' 
                  ? 'Tasks from yesterday and before will appear here.' 
                  : 'Create your first task to get started!'
                }
              </p>
            </div>
          ) : (
            getFilteredTasks().map((task, index) => {
              const isPastTask = activeTab === 'past';
              const isOverdueTask = moment(task.dueDate).isBefore(moment(), 'day') && !task.completed;
              
              return (
              <div 
                key={task.id} 
                className={`task-item ${task.completed ? 'completed' : ''} ${isPastTask ? 'past-task' : ''} ${isOverdueTask ? 'overdue-task' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div 
                  className={`task-checkbox ${task.completed ? 'checked' : ''}`}
                  onClick={() => toggleTaskCompletion(task.id)}
                >
                  {task.completed && <CheckCircle size={16} />}
                </div>
                
                <div className="task-content">
                  <div className="task-title">{task.title}</div>
                  {task.description && (
                    <div className="task-description">{task.description}</div>
                  )}
                  <div className="task-meta">
                    <span 
                      className="task-category"
                      style={{ backgroundColor: getCategoryColor(task.category) }}
                    >
                      {task.category}
                    </span>
                    <span className={`task-priority ${getPriorityClass(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Calendar size={12} />
                      {formatDate(task.dueDate)}
                      {task.time && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '2px', marginLeft: '8px' }}>
                          <Clock size={12} />
                          {task.time}
                        </span>
                      )}
                      {isOverdue(task.dueDate) && (
                        <span style={{ color: '#EF4444', fontSize: '12px' }}>Overdue</span>
                      )}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn btn-sm btn-secondary"
                    onClick={() => editTask(task)}
                  >
                    <Edit3 size={14} />
                  </button>
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={() => deleteTask(task.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              );
            })
          )}
        </div>
      )}

      {/* Statistics View */}
      {activeTab === 'statistics' && (
        <div className="statistics-container">
          {/* Enhanced Overview Statistics */}
          <div className="stats-grid enhanced-stats">
            <div className="stat-card featured">
              <div className="stat-icon">📊</div>
              <div className="stat-number">{statistics.totalTasks || 0}</div>
              <div className="stat-label">Total Tasks</div>
              <div className="stat-trend">+12% this week</div>
            </div>
            <div className="stat-card featured">
              <div className="stat-icon">✅</div>
              <div className="stat-number">{statistics.completedTasks || 0}</div>
              <div className="stat-label">Completed</div>
              <div className="stat-trend">Great progress!</div>
            </div>
            <div className="stat-card featured">
              <div className="stat-icon">🎯</div>
              <div className="stat-number">{statistics.completionRate || 0}%</div>
              <div className="stat-label">Completion Rate</div>
              <div className="progress-bar-container">
                <div 
                  className="progress-bar" 
                  style={{ width: `${statistics.completionRate || 0}%` }}
                ></div>
              </div>
            </div>
            <div className="stat-card featured">
              <div className="stat-icon">⏰</div>
              <div className="stat-number">{statistics.upcomingTasks || 0}</div>
              <div className="stat-label">Upcoming</div>
              <div className="stat-trend">Next 7 days</div>
            </div>
            <div className="stat-card featured">
              <div className="stat-icon">⚠️</div>
              <div className="stat-number">{statistics.overdueTasks || 0}</div>
              <div className="stat-label">Overdue</div>
              <div className="stat-trend">Needs attention</div>
            </div>
            <div className="stat-card featured">
              <div className="stat-icon">📅</div>
              <div className="stat-number">{statistics.todayTasks || 0}</div>
              <div className="stat-label">Today</div>
              <div className="stat-trend">Due today</div>
            </div>
          </div>

          {/* Advanced Analytics Section */}
          <div className="analytics-section">
            <div className="analytics-grid">
              {/* Progress by Category - Enhanced */}
              <div className="analytics-card">
                <div className="analytics-header">
                  <h3 className="analytics-title">📈 Progress by Category</h3>
                  <div className="analytics-subtitle">Track your productivity across different areas</div>
                </div>
                <div className="category-analytics">
                  {statistics.tasksByCategory?.map((category, index) => (
                    <div key={index} className="category-analytics-item">
                      <div className="category-header">
                        <div className="category-info">
                          <div 
                            className="category-dot"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="category-name">{category.category}</span>
                        </div>
                        <div className="category-stats">
                          <span className="category-completed">{category.completed}</span>
                          <span className="category-total">/{category.total}</span>
                        </div>
                      </div>
                      <div className="category-progress-container">
                        <div 
                          className="category-progress-bar"
                          style={{
                            width: `${category.total > 0 ? (category.completed / category.total) * 100 : 0}%`,
                            background: `linear-gradient(90deg, ${category.color} 0%, ${category.color}CC 100%)`
                          }}
                        />
                      </div>
                      <div className="category-percentage">
                        {category.total > 0 ? Math.round((category.completed / category.total) * 100) : 0}%
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Overall Progress - Enhanced */}
              <div className="analytics-card">
                <div className="analytics-header">
                  <h3 className="analytics-title">🎯 Overall Progress</h3>
                  <div className="analytics-subtitle">Your productivity overview</div>
                </div>
                <div className="progress-overview">
                  <div className="circular-progress-container">
                    <div className="circular-progress">
                      <svg viewBox="0 0 120 120">
                        <defs>
                          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#6366f1" />
                            <stop offset="100%" stopColor="#8b5cf6" />
                          </linearGradient>
                        </defs>
                        <circle
                          className="progress-bg"
                          cx="60"
                          cy="60"
                          r="50"
                        />
                        <circle
                          className="progress-fill"
                          cx="60"
                          cy="60"
                          r="50"
                          strokeDasharray={`${2 * Math.PI * 50}`}
                          strokeDashoffset={`${2 * Math.PI * 50 * (1 - (statistics.completionRate || 0) / 100)}`}
                        />
                      </svg>
                      <div className="progress-text">
                        <div className="progress-percentage">{statistics.completionRate || 0}%</div>
                        <div className="progress-label">Complete</div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="progress-breakdown">
                    <div className="breakdown-item">
                      <div className="breakdown-icon completed">✓</div>
                      <div className="breakdown-content">
                        <div className="breakdown-number">{statistics.completedTasks || 0}</div>
                        <div className="breakdown-label">Completed</div>
                      </div>
                    </div>
                    <div className="breakdown-item">
                      <div className="breakdown-icon pending">○</div>
                      <div className="breakdown-content">
                        <div className="breakdown-number">{(statistics.totalTasks || 0) - (statistics.completedTasks || 0)}</div>
                        <div className="breakdown-label">Pending</div>
                      </div>
                    </div>
                    <div className="breakdown-item">
                      <div className="breakdown-icon overdue">!</div>
                      <div className="breakdown-content">
                        <div className="breakdown-number">{statistics.overdueTasks || 0}</div>
                        <div className="breakdown-label">Overdue</div>
                      </div>
                    </div>
                    <div className="breakdown-item">
                      <div className="breakdown-icon today">📅</div>
                      <div className="breakdown-content">
                        <div className="breakdown-number">{statistics.todayTasks || 0}</div>
                        <div className="breakdown-label">Today</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Performance Insights */}
          <div className="insights-section">
            <div className="insights-card">
              <h3 className="insights-title">💡 Performance Insights</h3>
              <div className="insights-grid">
                <div className="insight-item">
                  <div className="insight-icon">🔥</div>
                  <div className="insight-content">
                    <div className="insight-title">Productivity Streak</div>
                    <div className="insight-value">7 days</div>
                    <div className="insight-description">Keep up the great work!</div>
                  </div>
                </div>
                <div className="insight-item">
                  <div className="insight-icon">⚡</div>
                  <div className="insight-content">
                    <div className="insight-title">Average Completion</div>
                    <div className="insight-value">{statistics.completionRate || 0}%</div>
                    <div className="insight-description">Your success rate</div>
                  </div>
                </div>
                <div className="insight-item">
                  <div className="insight-icon">📈</div>
                  <div className="insight-content">
                    <div className="insight-title">Most Productive</div>
                    <div className="insight-value">Monday</div>
                    <div className="insight-description">Your best day</div>
                  </div>
                </div>
                <div className="insight-item">
                  <div className="insight-icon">🎯</div>
                  <div className="insight-content">
                    <div className="insight-title">Focus Area</div>
                    <div className="insight-value">Work Tasks</div>
                    <div className="insight-description">Your main category</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingTask ? 'Edit Task' : 'Add New Task'}
              </h3>
              <button className="modal-close" onClick={() => setShowTaskModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleTaskSubmit}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  type="text"
                  className="form-input"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Category *</label>
                <select
                  className="form-select"
                  value={taskForm.category}
                  onChange={(e) => setTaskForm({...taskForm, category: e.target.value})}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-select"
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({...taskForm, priority: e.target.value})}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({...taskForm, dueDate: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Time (Optional)</label>
                <input
                  type="time"
                  className="form-input"
                  value={taskForm.time}
                  onChange={(e) => setTaskForm({...taskForm, time: e.target.value})}
                />
                <small style={{ color: '#6B7280', fontSize: '12px' }}>
                  Leave empty for 10 AM default notification
                </small>
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowTaskModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className={`btn btn-primary ${isLoading ? 'loading' : ''}`} disabled={isLoading}>
                  {isLoading ? 'Saving...' : (editingTask ? 'Update Task' : 'Add Task')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCategoryModal && (
        <div className="modal-overlay" onClick={() => setShowCategoryModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <button className="modal-close" onClick={() => setShowCategoryModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCategorySubmit}>
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input
                  type="text"
                  className="form-input"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({...categoryForm, name: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Color</label>
                <input
                  type="color"
                  className="form-input"
                  value={categoryForm.color}
                  onChange={(e) => setCategoryForm({...categoryForm, color: e.target.value})}
                  style={{ width: '60px', height: '40px' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowCategoryModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingCategory ? 'Update Category' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
