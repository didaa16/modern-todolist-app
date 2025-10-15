const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'public')));

// Data persistence
const DATA_FILE = path.join(__dirname, 'data', 'data.json');

// Initialize data storage
let data = {
  tasks: [],
  categories: []
};

// Load data from file
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const fileData = fs.readFileSync(DATA_FILE, 'utf8');
      data = JSON.parse(fileData);
      console.log('Data loaded from file');
    } else {
      // Initialize with default data
      data = {
        tasks: [
          {
            id: '1',
            title: 'Study Kubernetes networking',
            description: 'Learn about pods, services, and ingress',
            category: 'Cloud',
            priority: 'high',
            dueDate: moment().add(1, 'day').toISOString(),
            completed: false,
            createdAt: moment().toISOString()
          },
          {
            id: '2',
            title: 'Review Spring Boot security',
            description: 'Understand authentication and authorization',
            category: 'Backend',
            priority: 'medium',
            dueDate: moment().add(2, 'days').toISOString(),
            completed: false,
            createdAt: moment().toISOString()
          }
        ],
        categories: [
          { id: '1', name: 'Cloud', color: '#3B82F6' },
          { id: '2', name: 'DevOps', color: '#10B981' },
          { id: '3', name: 'AI', color: '#8B5CF6' },
          { id: '4', name: 'Backend', color: '#F59E0B' },
          { id: '5', name: 'Frontend', color: '#EF4444' }
        ]
      };
      saveData();
      console.log('Default data initialized');
    }
  } catch (error) {
    console.error('Error loading data:', error);
    // Initialize with empty data if file is corrupted
    data = { tasks: [], categories: [] };
  }
}

// Save data to file
function saveData() {
  try {
    // Ensure data directory exists
    const dataDir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
    console.log('Data saved to file');
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Load data on startup
loadData();

const { tasks, categories } = data;

// Routes

// Get all tasks
app.get('/api/tasks', (req, res) => {
  const { category, completed, upcoming } = req.query;
  let filteredTasks = [...data.tasks];

  if (category) {
    filteredTasks = filteredTasks.filter(task => task.category === category);
  }

  if (completed !== undefined) {
    filteredTasks = filteredTasks.filter(task => task.completed === (completed === 'true'));
  }

  if (upcoming === 'true') {
    const today = moment().startOf('day');
    const nextWeek = moment().add(7, 'days').endOf('day');
    filteredTasks = filteredTasks.filter(task => {
      const dueDate = moment(task.dueDate);
      return dueDate.isBetween(today, nextWeek, null, '[]');
    });
  }

  res.json(filteredTasks.sort((a, b) => moment(a.dueDate).diff(moment(b.dueDate))));
});

// Get task by ID
app.get('/api/tasks/:id', (req, res) => {
  const task = data.tasks.find(t => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }
  res.json(task);
});

// Create new task
app.post('/api/tasks', (req, res) => {
  const { title, description, category, priority, dueDate, time } = req.body;

  if (!title || !category) {
    return res.status(400).json({ message: 'Title and category are required' });
  }

  const newTask = {
    id: uuidv4(),
    title,
    description: description || '',
    category,
    priority: priority || 'medium',
    dueDate: dueDate || moment().add(1, 'day').toISOString(),
    time: time || '',
    completed: false,
    createdAt: moment().toISOString()
  };

  data.tasks.push(newTask);
  saveData();
  res.status(201).json(newTask);
});

// Update task
app.put('/api/tasks/:id', (req, res) => {
  const taskIndex = data.tasks.findIndex(t => t.id === req.params.id);
  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }

  const updatedTask = { ...data.tasks[taskIndex], ...req.body };
  data.tasks[taskIndex] = updatedTask;
  saveData();
  res.json(updatedTask);
});

// Delete task
app.delete('/api/tasks/:id', (req, res) => {
  const taskIndex = data.tasks.findIndex(t => t.id === req.params.id);
  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }

  data.tasks.splice(taskIndex, 1);
  saveData();
  res.status(204).send();
});

// Toggle task completion
app.patch('/api/tasks/:id/toggle', (req, res) => {
  const taskIndex = data.tasks.findIndex(t => t.id === req.params.id);
  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }

  data.tasks[taskIndex].completed = !data.tasks[taskIndex].completed;
  saveData();
  res.json(data.tasks[taskIndex]);
});

// Get all categories
app.get('/api/categories', (req, res) => {
  res.json(data.categories);
});

// Create new category
app.post('/api/categories', (req, res) => {
  const { name, color } = req.body;

  if (!name) {
    return res.status(400).json({ message: 'Category name is required' });
  }

  const newCategory = {
    id: uuidv4(),
    name,
    color: color || '#6B7280'
  };

  data.categories.push(newCategory);
  saveData();
  res.status(201).json(newCategory);
});

// Update category
app.put('/api/categories/:id', (req, res) => {
  const categoryIndex = data.categories.findIndex(c => c.id === req.params.id);
  if (categoryIndex === -1) {
    return res.status(404).json({ message: 'Category not found' });
  }

  const { name, color } = req.body;
  if (!name) {
    return res.status(400).json({ message: 'Category name is required' });
  }

  const updatedCategory = { ...data.categories[categoryIndex], name, color };
  data.categories[categoryIndex] = updatedCategory;
  saveData();
  res.json(updatedCategory);
});

// Delete category
app.delete('/api/categories/:id', (req, res) => {
  const categoryIndex = data.categories.findIndex(c => c.id === req.params.id);
  if (categoryIndex === -1) {
    return res.status(404).json({ message: 'Category not found' });
  }

  // Check if category is being used by any tasks
  const categoryInUse = data.tasks.some(task => task.category === data.categories[categoryIndex].name);
  if (categoryInUse) {
    return res.status(400).json({ 
      message: 'Cannot delete category that is being used by tasks. Please reassign or delete those tasks first.' 
    });
  }

  data.categories.splice(categoryIndex, 1);
  saveData();
  res.status(204).send();
});

// Get statistics
app.get('/api/statistics', (req, res) => {
  const totalTasks = data.tasks.length;
  const completedTasks = data.tasks.filter(task => task.completed).length;
  const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

  const tasksByCategory = data.categories.map(category => ({
    category: category.name,
    total: data.tasks.filter(task => task.category === category.name).length,
    completed: data.tasks.filter(task => task.category === category.name && task.completed).length,
    color: category.color
  }));

  const tasksThisWeek = data.tasks.filter(task => {
    const taskDate = moment(task.dueDate);
    const startOfWeek = moment().startOf('week');
    const endOfWeek = moment().endOf('week');
    return taskDate.isBetween(startOfWeek, endOfWeek, null, '[]');
  });

  const upcomingTasks = data.tasks.filter(task => {
    const taskDate = moment(task.dueDate);
    const today = moment().startOf('day');
    const nextWeek = moment().add(7, 'days').endOf('day');
    return !task.completed && taskDate.isBetween(today, nextWeek, null, '[]');
  });

  res.json({
    totalTasks,
    completedTasks,
    completionRate: Math.round(completionRate * 100) / 100,
    tasksByCategory,
    tasksThisWeek: tasksThisWeek.length,
    upcomingTasks: upcomingTasks.length
  });
});

// Catch all handler: send back React's index.html file for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
