# ToDoList App - Docker Setup

This is a full-stack ToDoList application with React frontend and Express.js backend, containerized with Docker and configured for persistent data storage.

## Features

- ✅ Task management with categories
- ✅ Priority levels and due dates
- ✅ Statistics and analytics
- ✅ Dark/Light theme toggle
- ✅ Data export/import
- ✅ Persistent data storage
- ✅ Docker containerized
- ✅ Health checks

## Quick Start with Docker

### Option 1: Using Docker Compose (Recommended)

1. Clone or download this repository
2. Run the application:
   ```bash
   docker-compose up -d
   ```
3. Access the application at: http://localhost:5000

### Option 2: Using Docker Image from DockerHub

1. Pull the image:
   ```bash
   docker pull dida1609/todolist-app:latest
   ```
2. Run the container:
   ```bash
   docker run -d -p 5000:5000 -v todolist_data:/app/data --name todolist-app dida1609/todolist-app:latest
   ```
3. Access the application at: http://localhost:5000

## Data Persistence

The application uses Docker volumes to ensure your data persists across container restarts:

- **Volume name**: `todolist_data`
- **Mount point**: `/app/data`
- **Data file**: `data.json`

Your tasks, categories, and all app data will be saved and restored when you restart the container.

## Building from Source

If you want to build the image yourself:

```bash
# Build the image
docker build -t todolist-app .

# Run the container
docker run -d -p 5000:5000 -v todolist_data:/app/data --name todolist-app todolist-app
```

## Stopping the Application

```bash
# Using docker-compose
docker-compose down

# Using docker run
docker stop todolist-app
docker rm todolist-app
```

## Data Backup

To backup your data:

```bash
# Copy data from volume
docker cp todolist-app:/app/data/data.json ./backup-data.json
```

To restore data:

```bash
# Copy data back to volume
docker cp ./backup-data.json todolist-app:/app/data/data.json
```

## Troubleshooting

### Container won't start
- Check if port 5000 is already in use
- Ensure Docker has enough resources allocated

### Data not persisting
- Verify the volume is properly mounted
- Check container logs: `docker logs todolist-app`

### Health check failing
- The app includes a health check endpoint
- Check status: `docker ps` (should show "healthy")

## Environment Variables

- `NODE_ENV`: Set to `production` (default)
- `PORT`: Server port (default: 5000)

## Architecture

- **Frontend**: React 18 with modern UI components
- **Backend**: Express.js with REST API
- **Storage**: JSON file-based persistence
- **Container**: Multi-stage Docker build
- **Security**: Non-root user, proper signal handling
