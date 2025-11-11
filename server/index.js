const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const fs = require('fs');
const path = require('path');
const promClient = require('prom-client');

const app = express();
const PORT = process.env.PORT || 5000;

// Prometheus metrics setup
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });

const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register]
});

const tasksTotal = new promClient.Gauge({
  name: 'todolist_tasks_total',
  help: 'Total number of tasks',
  registers: [register]
});

const tasksCompleted = new promClient.Gauge({
  name: 'todolist_tasks_completed',
  help: 'Number of completed tasks',
  registers: [register]
});

// Data persistence
const DATA_FILE = path.join(__dirname, 'data', 'data.json');

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
    data = { tasks: [], categories: [] };
  }
}

function saveData() {
  try {
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

loadData();

// Middleware to track metrics
app.use((req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const route = req.route ? req.route.path : req.path;
    
    httpRequestDuration.labels(req.method, route, res.statusCode).observe(duration);
    httpRequestTotal.labels(req.method, route, res.statusCode).inc();
    
    if (data && data.tasks) {
      tasksTotal.set(data.tasks.length);
      tasksCompleted.set(data.tasks.filter(t => t.completed).length);
    }
  });
  
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
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

app.get('/api/tasks/:id', (req, res) => {
  const task = data.tasks.find(t => t.id === req.params.id);
  if (!task) {
    return res.status(404).json({ message: 'Task not found' });
  }
  res.json(task);
});

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

app.delete('/api/tasks/:id', (req, res) => {
  const taskIndex = data.tasks.findIndex(t => t.id === req.params.id);
  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }

  data.tasks.splice(taskIndex, 1);
  saveData();
  res.status(204).send();
});

app.patch('/api/tasks/:id/toggle', (req, res) => {
  const taskIndex = data.tasks.findIndex(t => t.id === req.params.id);
  if (taskIndex === -1) {
    return res.status(404).json({ message: 'Task not found' });
  }

  data.tasks[taskIndex].completed = !data.tasks[taskIndex].completed;
  saveData();
  res.json(data.tasks[taskIndex]);
});

app.get('/api/categories', (req, res) => {
  res.json(data.categories);
});

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

app.delete('/api/categories/:id', (req, res) => {
  const categoryIndex = data.categories.findIndex(c => c.id === req.params.id);
  if (categoryIndex === -1) {
    return res.status(404).json({ message: 'Category not found' });
  }

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

app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', register.contentType);
    const metrics = await register.metrics();
    res.end(metrics);
  } catch (err) {
    res.status(500).end(err);
  }
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/ready', (req, res) => {
  const isReady = data && data.tasks !== undefined && data.categories !== undefined;
  
  if (isReady) {
    res.status(200).json({
      status: 'ready',
      timestamp: new Date().toISOString(),
      dataLoaded: true,
      tasksCount: data.tasks.length,
      categoriesCount: data.categories.length
    });
  } else {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      dataLoaded: false
    });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});