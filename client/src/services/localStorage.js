import { v4 as uuidv4 } from 'uuid';
import moment from 'moment';

// Storage keys
const STORAGE_KEYS = {
  TASKS: 'taskPlanner_tasks',
  CATEGORIES: 'taskPlanner_categories'
};

// Default data
const DEFAULT_CATEGORIES = [
  { id: '1', name: 'Cloud', color: '#3B82F6' },
  { id: '2', name: 'DevOps', color: '#10B981' },
  { id: '3', name: 'AI', color: '#8B5CF6' },
  { id: '4', name: 'Backend', color: '#F59E0B' },
  { id: '5', name: 'Frontend', color: '#EF4444' },
  { id: '6', name: 'Mobile', color: '#EC4899' },
  { id: '7', name: 'Database', color: '#06B6D4' }
];

const DEFAULT_TASKS = [
  {
    id: '1',
    title: 'Study Kubernetes networking',
    description: 'Learn about pods, services, and ingress controllers',
    category: 'Cloud',
    priority: 'high',
    dueDate: moment().add(1, 'day').format('YYYY-MM-DD'),
    completed: false,
    createdAt: moment().format('YYYY-MM-DD')
  },
  {
    id: '2',
    title: 'Review Spring Boot security',
    description: 'Understand authentication and authorization mechanisms',
    category: 'Backend',
    priority: 'medium',
    dueDate: moment().add(2, 'days').format('YYYY-MM-DD'),
    completed: false,
    createdAt: moment().format('YYYY-MM-DD')
  },
  {
    id: '3',
    title: 'Learn Docker containerization',
    description: 'Practice with Dockerfile and docker-compose',
    category: 'DevOps',
    priority: 'high',
    dueDate: moment().format('YYYY-MM-DD'),
    completed: true,
    createdAt: moment().subtract(1, 'day').format('YYYY-MM-DD')
  }
];

// Utility functions
const saveToStorage = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    return false;
  }
};

const loadFromStorage = (key, defaultValue = []) => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return defaultValue;
  }
};

const initializeStorage = () => {
  // Initialize categories if not exists
  const existingCategories = loadFromStorage(STORAGE_KEYS.CATEGORIES);
  if (existingCategories.length === 0) {
    saveToStorage(STORAGE_KEYS.CATEGORIES, DEFAULT_CATEGORIES);
  }

  // Initialize tasks if not exists
  const existingTasks = loadFromStorage(STORAGE_KEYS.TASKS);
  if (existingTasks.length === 0) {
    saveToStorage(STORAGE_KEYS.TASKS, DEFAULT_TASKS);
  }
};

// Task operations
export const taskService = {
  // Get all tasks
  getAll: () => {
    return loadFromStorage(STORAGE_KEYS.TASKS, []);
  },

  // Get task by ID
  getById: (id) => {
    const tasks = loadFromStorage(STORAGE_KEYS.TASKS, []);
    return tasks.find(task => task.id === id);
  },

  // Create new task
  create: (taskData) => {
    const tasks = loadFromStorage(STORAGE_KEYS.TASKS, []);
    const newTask = {
      id: uuidv4(),
      title: taskData.title,
      description: taskData.description || '',
      category: taskData.category,
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate || moment().add(1, 'day').format('YYYY-MM-DD'),
      completed: false,
      createdAt: moment().format('YYYY-MM-DD')
    };
    
    tasks.push(newTask);
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
    return newTask;
  },

  // Update task
  update: (id, taskData) => {
    const tasks = loadFromStorage(STORAGE_KEYS.TASKS, []);
    const taskIndex = tasks.findIndex(task => task.id === id);
    
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }

    const updatedTask = { ...tasks[taskIndex], ...taskData };
    tasks[taskIndex] = updatedTask;
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
    return updatedTask;
  },

  // Delete task
  delete: (id) => {
    const tasks = loadFromStorage(STORAGE_KEYS.TASKS, []);
    const filteredTasks = tasks.filter(task => task.id !== id);
    saveToStorage(STORAGE_KEYS.TASKS, filteredTasks);
    return true;
  },

  // Toggle task completion
  toggleCompletion: (id) => {
    const tasks = loadFromStorage(STORAGE_KEYS.TASKS, []);
    const taskIndex = tasks.findIndex(task => task.id === id);
    
    if (taskIndex === -1) {
      throw new Error('Task not found');
    }

    tasks[taskIndex].completed = !tasks[taskIndex].completed;
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
    return tasks[taskIndex];
  },

  // Filter tasks
  filter: (filters = {}) => {
    let tasks = loadFromStorage(STORAGE_KEYS.TASKS, []);
    
    if (filters.category) {
      tasks = tasks.filter(task => task.category === filters.category);
    }
    
    if (filters.completed !== undefined) {
      tasks = tasks.filter(task => task.completed === filters.completed);
    }
    
    if (filters.priority) {
      tasks = tasks.filter(task => task.priority === filters.priority);
    }
    
    if (filters.dueDate) {
      const filterDate = moment(filters.dueDate);
      tasks = tasks.filter(task => moment(task.dueDate).isSame(filterDate, 'day'));
    }
    
    if (filters.dueDateRange) {
      const { start, end } = filters.dueDateRange;
      const startDate = moment(start);
      const endDate = moment(end);
      tasks = tasks.filter(task => {
        const taskDate = moment(task.dueDate);
        return taskDate.isBetween(startDate, endDate, null, '[]');
      });
    }
    
    // Sort by due date
    return tasks.sort((a, b) => moment(a.dueDate).diff(moment(b.dueDate)));
  }
};

// Category operations
export const categoryService = {
  // Get all categories
  getAll: () => {
    return loadFromStorage(STORAGE_KEYS.CATEGORIES, []);
  },

  // Get category by ID
  getById: (id) => {
    const categories = loadFromStorage(STORAGE_KEYS.CATEGORIES, []);
    return categories.find(category => category.id === id);
  },

  // Create new category
  create: (categoryData) => {
    const categories = loadFromStorage(STORAGE_KEYS.CATEGORIES, []);
    const newCategory = {
      id: uuidv4(),
      name: categoryData.name,
      color: categoryData.color || '#6B7280'
    };
    
    categories.push(newCategory);
    saveToStorage(STORAGE_KEYS.CATEGORIES, categories);
    return newCategory;
  },

  // Update category
  update: (id, categoryData) => {
    const categories = loadFromStorage(STORAGE_KEYS.CATEGORIES, []);
    const categoryIndex = categories.findIndex(category => category.id === id);
    
    if (categoryIndex === -1) {
      throw new Error('Category not found');
    }

    const updatedCategory = { ...categories[categoryIndex], ...categoryData };
    categories[categoryIndex] = updatedCategory;
    saveToStorage(STORAGE_KEYS.CATEGORIES, categories);
    return updatedCategory;
  },

  // Delete category
  delete: (id) => {
    const categories = loadFromStorage(STORAGE_KEYS.CATEGORIES, []);
    const tasks = loadFromStorage(STORAGE_KEYS.TASKS, []);
    
    const category = categories.find(cat => cat.id === id);
    if (!category) {
      throw new Error('Category not found');
    }

    // Check if category is being used by any tasks
    const tasksUsingCategory = tasks.filter(task => task.category === category.name);
    if (tasksUsingCategory.length > 0) {
      throw new Error(`Cannot delete category "${category.name}" because it is being used by ${tasksUsingCategory.length} task(s). Please reassign or delete those tasks first.`);
    }

    const filteredCategories = categories.filter(category => category.id !== id);
    saveToStorage(STORAGE_KEYS.CATEGORIES, filteredCategories);
    return true;
  }
};

// Statistics operations
export const statisticsService = {
  // Get all statistics
  getAll: () => {
    const tasks = loadFromStorage(STORAGE_KEYS.TASKS, []);
    const categories = loadFromStorage(STORAGE_KEYS.CATEGORIES, []);
    
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.completed).length;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    const tasksByCategory = categories.map(category => ({
      category: category.name,
      total: tasks.filter(task => task.category === category.name).length,
      completed: tasks.filter(task => task.category === category.name && task.completed).length,
      color: category.color
    }));

    const tasksThisWeek = tasks.filter(task => {
      const taskDate = moment(task.dueDate);
      const startOfWeek = moment().startOf('week');
      const endOfWeek = moment().endOf('week');
      return taskDate.isBetween(startOfWeek, endOfWeek, null, '[]');
    });

    const upcomingTasks = tasks.filter(task => {
      const taskDate = moment(task.dueDate);
      const today = moment().startOf('day');
      const nextWeek = moment().add(7, 'days').endOf('day');
      return !task.completed && taskDate.isBetween(today, nextWeek, null, '[]');
    });

    const overdueTasks = tasks.filter(task => {
      return !task.completed && moment(task.dueDate).isBefore(moment(), 'day');
    });

    const todayTasks = tasks.filter(task => {
      return moment(task.dueDate).isSame(moment(), 'day');
    });

    const tomorrowTasks = tasks.filter(task => {
      return moment(task.dueDate).isSame(moment().add(1, 'day'), 'day');
    });

    return {
      totalTasks,
      completedTasks,
      completionRate: Math.round(completionRate * 100) / 100,
      tasksByCategory,
      tasksThisWeek: tasksThisWeek.length,
      upcomingTasks: upcomingTasks.length,
      overdueTasks: overdueTasks.length,
      todayTasks: todayTasks.length,
      tomorrowTasks: tomorrowTasks.length
    };
  },

  // Get progress over time (last 30 days)
  getProgressOverTime: () => {
    const tasks = loadFromStorage(STORAGE_KEYS.TASKS, []);
    const last30Days = [];
    
    for (let i = 29; i >= 0; i--) {
      const date = moment().subtract(i, 'days').format('YYYY-MM-DD');
      const dayTasks = tasks.filter(task => moment(task.createdAt).isSame(date, 'day'));
      const completedDayTasks = dayTasks.filter(task => task.completed);
      
      last30Days.push({
        date,
        total: dayTasks.length,
        completed: completedDayTasks.length,
        completionRate: dayTasks.length > 0 ? (completedDayTasks.length / dayTasks.length) * 100 : 0
      });
    }
    
    return last30Days;
  }
};

// Data export/import functions
export const dataService = {
  // Export all data as JSON
  exportData: () => {
    const tasks = loadFromStorage(STORAGE_KEYS.TASKS, []);
    const categories = loadFromStorage(STORAGE_KEYS.CATEGORIES, []);
    
    return {
      tasks,
      categories,
      exportDate: moment().toISOString(),
      version: '1.0'
    };
  },

  // Import data from JSON
  importData: (data) => {
    try {
      if (data.tasks && Array.isArray(data.tasks)) {
        saveToStorage(STORAGE_KEYS.TASKS, data.tasks);
      }
      
      if (data.categories && Array.isArray(data.categories)) {
        saveToStorage(STORAGE_KEYS.CATEGORIES, data.categories);
      }
      
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  },

  // Clear all data
  clearAllData: () => {
    localStorage.removeItem(STORAGE_KEYS.TASKS);
    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    initializeStorage();
    return true;
  },

  // Download data as JSON file
  downloadData: () => {
    const data = dataService.exportData();
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `task-planner-backup-${moment().format('YYYY-MM-DD')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Upload and import data from file
  uploadData: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          const success = dataService.importData(data);
          resolve(success);
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }
};

// Initialize storage on first load
initializeStorage();

export default {
  taskService,
  categoryService,
  statisticsService,
  dataService
};
