# 📋 Modern ToDoList App

A feature-rich, full-stack task management application built with React and Express.js, fully containerized with Docker for easy deployment and persistent data storage.

![App Screenshot](https://ibb.co/C3mGxF7Y)

## ✨ Features

- 🎯 **Task Management**: Create, edit, delete, and organize tasks
- 🏷️ **Categories**: Organize tasks with custom categories and colors
- ⭐ **Priority Levels**: Set task priorities (High, Medium, Low)
- 📅 **Due Dates**: Track task deadlines with calendar integration
- 📊 **Analytics**: View completion rates and category statistics
- 🌙 **Dark/Light Mode**: Toggle between themes
- 💾 **Data Export/Import**: Backup and restore your data
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🐳 **Docker Ready**: Fully containerized with persistent storage
- 🔒 **Secure**: Non-root container execution with health checks

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/didaa16/modern-todolist-app.git
cd modern-todolist-app

# Run with Docker Compose
docker-compose up -d

# Access the app at http://localhost:5000
```

### Option 2: Docker Hub

```bash
# Pull and run from DockerHub
docker run -d -p 5000:5000 -v todolist_data:/app/data --name todolist-app dida1609/todolist-app:latest
```

### Option 3: Local Development

```bash
# Install dependencies
cd server && npm install
cd ../client && npm install

# Start backend (Terminal 1)
cd server && npm start

# Start frontend (Terminal 2)
cd client && npm start
```

## 🏗️ Architecture

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── App.js         # Main application component
│   │   ├── services/      # API service layer
│   │   └── index.css      # Styling
│   └── package.json
├── server/                # Express.js backend
│   ├── index.js          # Main server file
│   ├── data/             # Persistent data storage
│   └── package.json
├── Dockerfile            # Multi-stage Docker build
├── docker-compose.yml    # Container orchestration
└── README.md
```

## 🛠️ Tech Stack

### Frontend
- **React 18** - Modern UI library
- **Framer Motion** - Smooth animations
- **Lucide React** - Beautiful icons
- **Moment.js** - Date manipulation
- **Recharts** - Data visualization

### Backend
- **Express.js** - Web framework
- **CORS** - Cross-origin resource sharing
- **UUID** - Unique identifier generation
- **File-based persistence** - JSON storage

### DevOps
- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Multi-stage builds** - Optimized image size
- **Health checks** - Container monitoring

## 📦 Docker Configuration

### Multi-stage Build
- **Stage 1**: Build React frontend
- **Stage 2**: Setup Express backend
- **Production**: Serve React app from Express server

### Data Persistence
- **Volume**: `todolist_data`
- **Mount Point**: `/app/data`
- **File**: `data.json`

### Security Features
- Non-root user execution
- Proper signal handling
- Health check endpoints
- Minimal Alpine Linux base

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `5000` |

## 📊 API Endpoints

### Tasks
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PATCH /api/tasks/:id/toggle` - Toggle completion

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create new category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Statistics
- `GET /api/statistics` - Get app statistics

## 🐳 Docker Commands

```bash
# Build image
docker build -t dida1609/todolist-app:latest .

# Run container
docker run -d -p 5000:5000 -v todolist_data:/app/data --name todolist-app dida1609/todolist-app:latest

# View logs
docker logs todolist-app

# Stop container
docker stop todolist-app

# Remove container
docker rm todolist-app
```

## 📈 Data Management

### Backup Data
```bash
docker cp todolist-app:/app/data/data.json ./backup-data.json
```

### Restore Data
```bash
docker cp ./backup-data.json todolist-app:/app/data/data.json
```

### View Data
```bash
docker exec -it todolist-app cat /app/data/data.json
```

## 🧪 Development

### Prerequisites
- Node.js 18+
- Docker (optional)
- Git

### Setup
```bash
# Clone repository
git clone https://github.com/didaa16/modern-todolist-app.git
cd modern-todolist-app

# Install dependencies
npm install --prefix server
npm install --prefix client

# Start development servers
npm start --prefix server  # Backend on :5000
npm start --prefix client  # Frontend on :3000
```

### Scripts
```bash
# Server
npm start        # Start production server
npm run dev      # Start development server with nodemon

# Client
npm start        # Start development server
npm run build    # Build for production
npm test         # Run tests
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Didaa16**
- GitHub: [@didaa16](https://github.com/didaa16)

## 🙏 Acknowledgments

- React team for the amazing framework
- Express.js for the robust backend
- Docker for containerization
- All open-source contributors

## 📞 Support

If you have any questions or need help, please:
- Open an issue on GitHub
- Contact the author

---

⭐ **Star this repository if you found it helpful!**
