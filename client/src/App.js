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
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Form states
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    dueDate: moment().add(1, 'day').format('YYYY-MM-DD')
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

  // Theme toggle
  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.body.classList.toggle('dark-mode');
  };

  const loadTasks = () => {
    try {
      const tasks = taskService.getAll();
      setTasks(tasks);
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

  const handleTaskSubmit = (e) => {
    e.preventDefault();
    try {
      if (editingTask) {
        taskService.update(editingTask.id, taskForm);
      } else {
        taskService.create(taskForm);
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
        dueDate: moment().add(1, 'day').format('YYYY-MM-DD')
      });
    } catch (error) {
      console.error('Error saving task:', error);
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
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const deleteTask = (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        taskService.delete(taskId);
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
      dueDate: moment(task.dueDate).format('YYYY-MM-DD')
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

    switch (activeTab) {
      case 'today':
        return tasks.filter(task => moment(task.dueDate).isSame(today, 'day'));
      case 'tomorrow':
        return tasks.filter(task => moment(task.dueDate).isSame(tomorrow, 'day'));
      case 'week':
        return tasks.filter(task => moment(task.dueDate).isBetween(today, endOfWeek, null, '[]'));
      case 'completed':
        return tasks.filter(task => task.completed);
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
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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
      </div>

      {/* Categories Management */}
      {activeTab === 'categories' && (
        <div className="card">
          <h2 style={{ marginBottom: '20px', color: '#111827' }}>Category Management</h2>
          
          {categories.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🏷️</div>
              <h3>No categories found</h3>
              <p>Create your first category to organize your tasks!</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {categories.map(category => (
                <div key={category.id} className="category-card">
                  <div className="category-header">
                    <div 
                      className="category-color"
                      style={{ backgroundColor: category.color }}
                    />
                    <div className="category-info">
                      <h3 className="category-name">{category.name}</h3>
                      <p className="category-tasks-count">
                        {tasks.filter(task => task.category === category.name).length} task(s)
                      </p>
                      {tasks.filter(task => task.category === category.name).length > 0 && (
                        <div className="category-tasks-preview">
                          {tasks
                            .filter(task => task.category === category.name)
                            .slice(0, 3)
                            .map(task => (
                              <div key={task.id} className="task-preview">
                                <span className={`task-preview-status ${task.completed ? 'completed' : ''}`}>
                                  {task.completed ? '✓' : '○'}
                                </span>
                                <span className="task-preview-title">{task.title}</span>
                              </div>
                            ))}
                          {tasks.filter(task => task.category === category.name).length > 3 && (
                            <div className="task-preview-more">
                              +{tasks.filter(task => task.category === category.name).length - 3} more
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="category-actions">
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => editCategory(category)}
                    >
                      <Edit3 size={14} />
                      Edit
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => deleteCategory(category.id)}
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </div>
                </div>
              ))}
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
          </h2>

          {getFilteredTasks().length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📝</div>
              <h3>No tasks found</h3>
              <p>Create your first task to get started!</p>
            </div>
          ) : (
            getFilteredTasks().map(task => (
              <div key={task.id} className={`task-item ${task.completed ? 'completed' : ''}`}>
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
            ))
          )}
        </div>
      )}

      {/* Statistics View */}
      {activeTab === 'statistics' && (
        <div>
          {/* Overview Statistics */}
          <div className="stats-grid" style={{ marginBottom: '24px' }}>
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
            </div>
            <div className="stat-card">
              <div className="stat-number">{statistics.upcomingTasks || 0}</div>
              <div className="stat-label">Upcoming</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{statistics.overdueTasks || 0}</div>
              <div className="stat-label">Overdue</div>
            </div>
            <div className="stat-card">
              <div className="stat-number">{statistics.todayTasks || 0}</div>
              <div className="stat-label">Today</div>
            </div>
          </div>

          {/* Progress by Category */}
          <div className="chart-container">
            <h2 className="chart-title">Progress by Category</h2>
            <div className="chart-grid">
              {statistics.tasksByCategory?.map((category, index) => (
                <div key={index} className="category-progress-card">
                  <div className="category-progress-header">
                    <div className="category-progress-info">
                      <div 
                        className="category-progress-color"
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <h3 className="category-progress-name">{category.category}</h3>
                        <p className="category-progress-stats">{category.completed}/{category.total} tasks</p>
                      </div>
                    </div>
                    <div className="category-progress-percentage">
                      {category.total > 0 ? Math.round((category.completed / category.total) * 100) : 0}%
                    </div>
                  </div>
                  
                  <div className="progress-chart">
                    <div 
                      className="progress-bar"
                      style={{
                        width: `${category.total > 0 ? (category.completed / category.total) * 100 : 0}%`,
                        background: `linear-gradient(90deg, ${category.color} 0%, ${category.color}CC 100%)`
                      }}
                    />
                  </div>
                  
                  <div className="category-progress-details">
                    <div className="progress-detail-item">
                      <span className="progress-detail-label">Completed</span>
                      <span className="progress-detail-value" style={{ color: category.color }}>
                        {category.completed}
                      </span>
                    </div>
                    <div className="progress-detail-item">
                      <span className="progress-detail-label">Remaining</span>
                      <span className="progress-detail-value">
                        {category.total - category.completed}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Overall Progress Chart */}
          <div className="chart-container">
            <h2 className="chart-title">Overall Progress</h2>
            <div className="chart-grid">
              <div className="circular-progress-card">
                <div className="circular-progress">
                  <svg viewBox="0 0 120 120">
                    <defs>
                      <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#667eea" />
                        <stop offset="100%" stopColor="#764ba2" />
                      </linearGradient>
                    </defs>
                    <circle
                      className="circular-progress-bg"
                      cx="60"
                      cy="60"
                      r="52"
                    />
                    <circle
                      className="circular-progress-bar"
                      cx="60"
                      cy="60"
                      r="52"
                      strokeDasharray={`${2 * Math.PI * 52}`}
                      strokeDashoffset={`${2 * Math.PI * 52 * (1 - (statistics.completionRate || 0) / 100)}`}
                    />
                  </svg>
                  <div className="circular-progress-text">
                    {statistics.completionRate || 0}%
                  </div>
                </div>
                <div className="circular-progress-label">Completion Rate</div>
              </div>
              
              <div className="progress-summary-card">
                <h3 className="progress-summary-title">Task Distribution</h3>
                <div className="progress-summary-grid">
                  <div className="summary-item">
                    <div className="summary-icon completed">✓</div>
                    <div className="summary-info">
                      <div className="summary-number">{statistics.completedTasks || 0}</div>
                      <div className="summary-label">Completed</div>
                    </div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-icon pending">○</div>
                    <div className="summary-info">
                      <div className="summary-number">{(statistics.totalTasks || 0) - (statistics.completedTasks || 0)}</div>
                      <div className="summary-label">Pending</div>
                    </div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-icon overdue">!</div>
                    <div className="summary-info">
                      <div className="summary-number">{statistics.overdueTasks || 0}</div>
                      <div className="summary-label">Overdue</div>
                    </div>
                  </div>
                  <div className="summary-item">
                    <div className="summary-icon today">📅</div>
                    <div className="summary-info">
                      <div className="summary-number">{statistics.todayTasks || 0}</div>
                      <div className="summary-label">Today</div>
                    </div>
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

              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => setShowTaskModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTask ? 'Update Task' : 'Add Task'}
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
