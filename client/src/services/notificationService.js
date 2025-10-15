import moment from 'moment';

class NotificationService {
  constructor() {
    this.notificationInterval = null;
    this.checkInterval = 60000; // Check every minute
    this.notificationTimeouts = new Map(); // Store notification timeouts
    this.requestPermission();
  }

  // Request notification permission
  async requestPermission() {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }

  // Check if notifications are supported and permitted
  isNotificationSupported() {
    return 'Notification' in window && Notification.permission === 'granted';
  }

  // Show notification
  showNotification(title, options = {}) {
    if (!this.isNotificationSupported()) {
      console.warn('Notifications not supported or permission not granted');
      return;
    }

    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      requireInteraction: true,
      silent: false, // Make sure it makes sound
      vibrate: [200, 100, 200], // Vibration pattern for mobile
      tag: 'todo-alert', // Same tag for all notifications
      renotify: true, // Replace previous notifications
      ...options
    });

    // Make it more alert-like with multiple notifications
    this.showAlertSequence(notification);

    return notification;
  }

  // Show a sequence of alert-like notifications
  showAlertSequence(notification) {
    // First notification - immediate
    setTimeout(() => {
      this.playAlertSound();
    }, 100);

    // Second notification after 2 seconds
    setTimeout(() => {
      if (this.isNotificationSupported()) {
        new Notification('🔔 TASK REMINDER', {
          body: 'You have a task due now!',
          icon: '/favicon.ico',
          requireInteraction: true,
          silent: false,
          vibrate: [300, 100, 300],
          tag: 'todo-alert-urgent'
        });
        this.playAlertSound();
      }
    }, 2000);

    // Third notification after 5 seconds if user hasn't interacted
    setTimeout(() => {
      if (this.isNotificationSupported()) {
        new Notification('⚠️ URGENT: Task Due!', {
          body: 'Please check your tasks immediately!',
          icon: '/favicon.ico',
          requireInteraction: true,
          silent: false,
          vibrate: [500, 200, 500],
          tag: 'todo-alert-critical'
        });
        this.playAlertSound();
      }
    }, 5000);

    // Auto-close after 15 seconds
    setTimeout(() => {
      notification.close();
    }, 15000);
  }

  // Play alert sound (using Web Audio API)
  playAlertSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create a beep sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configure the beep
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    } catch (error) {
      console.log('Audio not supported:', error);
    }
  }

  // Schedule notification for a specific task
  scheduleTaskNotification(task) {
    if (task.completed) return;

    const now = moment();
    const taskDate = moment(task.dueDate);
    const taskTime = task.time || '10:00'; // Default to 10 AM if no time specified
    
    // Combine date and time
    const notificationDateTime = taskDate.clone().set({
      hour: parseInt(taskTime.split(':')[0]),
      minute: parseInt(taskTime.split(':')[1]),
      second: 0,
      millisecond: 0
    });

    // If the time has already passed today, schedule for tomorrow
    if (notificationDateTime.isBefore(now)) {
      notificationDateTime.add(1, 'day');
    }

    // Clear any existing notification for this task
    this.clearTaskNotification(task.id);

    // Calculate delay in milliseconds
    const delay = notificationDateTime.diff(now);
    
    if (delay > 0) {
      const timeoutId = setTimeout(() => {
        this.showTaskNotification(task);
        this.notificationTimeouts.delete(task.id);
      }, delay);

      this.notificationTimeouts.set(task.id, timeoutId);
      console.log(`Scheduled notification for task "${task.title}" at ${notificationDateTime.format('YYYY-MM-DD HH:mm')}`);
    }
  }

  // Show notification for a specific task
  showTaskNotification(task) {
    const title = `🚨 TASK ALERT: ${task.title}`;
    const body = `⏰ Your task "${task.title}" is due ${task.time ? `at ${task.time}` : 'today'}! ${task.description ? `\n\n📝 Description: ${task.description}` : ''}\n\n🎯 Click to view your tasks!`;
    
    this.showNotification(title, {
      body,
      tag: `task-alert-${task.id}`,
      data: { taskId: task.id }
    });
  }

  // Clear notification for a specific task
  clearTaskNotification(taskId) {
    const timeoutId = this.notificationTimeouts.get(taskId);
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.notificationTimeouts.delete(taskId);
    }
  }

  // Schedule notifications for all tasks
  scheduleAllTaskNotifications(tasks) {
    // Clear all existing notifications
    this.clearAllNotifications();

    // Schedule notifications for incomplete tasks
    tasks
      .filter(task => !task.completed)
      .forEach(task => {
        this.scheduleTaskNotification(task);
      });
  }

  // Clear all scheduled notifications
  clearAllNotifications() {
    this.notificationTimeouts.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    this.notificationTimeouts.clear();
  }

  // Start the notification service
  start(tasks) {
    this.scheduleAllTaskNotifications(tasks);
    
    // Set up periodic check for new tasks
    this.notificationInterval = setInterval(() => {
      // This will be called by the main app when tasks are updated
    }, this.checkInterval);
  }

  // Stop the notification service
  stop() {
    this.clearAllNotifications();
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
      this.notificationInterval = null;
    }
  }

  // Update notifications when tasks change
  updateNotifications(tasks) {
    this.scheduleAllTaskNotifications(tasks);
  }

  // Show immediate notification for overdue tasks
  checkOverdueTasks(tasks) {
    const now = moment();
    const overdueTasks = tasks.filter(task => {
      if (task.completed) return false;
      
      const taskDate = moment(task.dueDate);
      const taskTime = task.time || '10:00';
      const taskDateTime = taskDate.clone().set({
        hour: parseInt(taskTime.split(':')[0]),
        minute: parseInt(taskTime.split(':')[1]),
        second: 0,
        millisecond: 0
      });

      return taskDateTime.isBefore(now);
    });

    overdueTasks.forEach(task => {
      this.showOverdueAlert(task);
    });
  }

  // Show aggressive alert for overdue tasks
  showOverdueAlert(task) {
    const title = `🔥 OVERDUE TASK: ${task.title}`;
    const body = `⚠️ URGENT: Your task "${task.title}" is OVERDUE! ${task.time ? `Was due at ${task.time}` : 'Was due today'}. ${task.description ? `\n\n📝 Description: ${task.description}` : ''}\n\n🚨 Please complete this task immediately!`;
    
    // Show multiple urgent notifications
    this.showNotification(title, {
      body,
      tag: `overdue-alert-${task.id}`,
      data: { taskId: task.id }
    });

    // Show additional urgent notification after 3 seconds
    setTimeout(() => {
      if (this.isNotificationSupported()) {
        new Notification(`🚨 OVERDUE ALERT!`, {
          body: `Task "${task.title}" needs immediate attention!`,
          icon: '/favicon.ico',
          requireInteraction: true,
          silent: false,
          vibrate: [1000, 500, 1000, 500, 1000],
          tag: `overdue-critical-${task.id}`
        });
        this.playAlertSound();
      }
    }, 3000);
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;
