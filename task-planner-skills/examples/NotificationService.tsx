import { useState, useEffect, useCallback } from 'react';
import { Task } from './TaskModel';

type NotificationType = 'push' | 'email' | 'sms' | 'inApp';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  taskId?: string;
  read: boolean;
  createdAt: Date;
}

interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  inAppEnabled: boolean;
  quietHours: { start: string; end: string };
  soundEnabled: boolean;
}

interface NotificationServiceProps {
  tasks: Task[];
  onNotificationClick?: (notification: Notification) => void;
}

function NotificationService({ tasks, onNotificationClick }: NotificationServiceProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    pushEnabled: false,
    emailEnabled: false,
    smsEnabled: false,
    inAppEnabled: true,
    quietHours: { start: '22:00', end: '08:00' },
    soundEnabled: true
  });
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return false;
    }

    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      setSettings(prev => ({ ...prev, pushEnabled: true }));
      return true;
    }

    return false;
  }, []);

  const sendNotification = useCallback(async (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif_${Date.now()}`,
      read: false,
      createdAt: new Date()
    };

    if (settings.inAppEnabled) {
      setNotifications(prev => [newNotification, ...prev]);
    }

    if (settings.pushEnabled && permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/notification-icon.png',
        badge: '/notification-badge.png'
      });
    }

    if (settings.emailEnabled) {
      console.log('Sending email notification:', notification);
    }

    if (settings.smsEnabled) {
      console.log('Sending SMS notification:', notification);
    }

    if (settings.soundEnabled) {
      playNotificationSound();
    }
  }, [settings, permission]);

  const playNotificationSound = useCallback(() => {
    const audio = new Audio('/notification-sound.mp3');
    audio.play().catch(console.error);
  }, []);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const deleteNotification = useCallback((notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const sendTaskReminder = useCallback((task: Task, minutesBefore: number) => {
    if (!task.dueDate) return;

    const reminderTime = new Date(task.dueDate.getTime() - minutesBefore * 60 * 1000);
    const now = new Date();

    if (reminderTime <= now && reminderTime > new Date(now.getTime() - 60000)) {
      sendNotification({
        type: 'push',
        title: 'Task Reminder',
        message: `"${task.title}" is due ${minutesBefore === 0 ? 'now' : `in ${minutesBefore} minutes`}`,
        taskId: task.id
      });
    }
  }, [sendNotification]);

  const sendTaskOverdue = useCallback((task: Task) => {
    if (!task.dueDate || task.status === 'completed') return;

    const now = new Date();
    const dueDate = new Date(task.dueDate);
    const hoursOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60));

    if (hoursOverdue > 0 && hoursOverdue <= 24) {
      sendNotification({
        type: 'push',
        title: 'Task Overdue',
        message: `"${task.title}" is overdue by ${hoursOverdue} hour${hoursOverdue > 1 ? 's' : ''}`,
        taskId: task.id
      });
    }
  }, [sendNotification]);

  const sendTaskAssigned = useCallback((task: Task, assigneeName: string) => {
    sendNotification({
      type: 'inApp',
      title: 'Task Assigned',
      message: `You have been assigned to "${task.title}"`,
      taskId: task.id
    });
  }, [sendNotification]);

  const sendTaskCompleted = useCallback((task: Task) => {
    sendNotification({
      type: 'inApp',
      title: 'Task Completed',
      message: `"${task.title}" has been completed`,
      taskId: task.id
    });
  }, [sendNotification]);

  useEffect(() => {
    const interval = setInterval(() => {
      tasks.forEach(task => {
        if (task.reminders.length > 0) {
          task.reminders.forEach(reminder => {
            if (!reminder.sent) {
              sendTaskReminder(task, reminder.minutesBefore);
            }
          });
        }
        sendTaskOverdue(task);
      });
    }, 60000);

    return () => clearInterval(interval);
  }, [tasks, sendTaskReminder, sendTaskOverdue]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: NotificationType): string => {
    const icons = {
      push: '🔔',
      email: '📧',
      sms: '📱',
      inApp: '💬'
    };
    return icons[type];
  };

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="notification-service">
      <div className="notification-header mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            Notifications
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-red-500 text-white rounded-full text-sm">
                {unreadCount}
              </span>
            )}
          </h2>
          <div className="flex gap-2">
            <button
              onClick={markAllAsRead}
              className="px-3 py-1 border rounded hover:bg-gray-100 text-sm"
            >
              Mark All Read
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="px-3 py-1 border rounded hover:bg-gray-100 text-sm"
            >
              ⚙️
            </button>
          </div>
        </div>

        {permission === 'default' && (
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded mb-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-600">🔔</span>
              <span className="font-medium text-yellow-800">Enable Notifications</span>
            </div>
            <p className="text-sm text-yellow-700 mb-2">
              Get notified about task reminders, due dates, and updates
            </p>
            <button
              onClick={requestPermission}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 text-sm"
            >
              Enable Notifications
            </button>
          </div>
        )}
      </div>

      {showSettings && (
        <div className="notification-settings bg-gray-50 p-4 rounded mb-4">
          <h3 className="font-semibold mb-3">Notification Settings</h3>
          
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.pushEnabled}
                onChange={(e) => setSettings(prev => ({ ...prev, pushEnabled: e.target.checked }))}
              />
              <span>Push Notifications</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.emailEnabled}
                onChange={(e) => setSettings(prev => ({ ...prev, emailEnabled: e.target.checked }))}
              />
              <span>Email Notifications</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.smsEnabled}
                onChange={(e) => setSettings(prev => ({ ...prev, smsEnabled: e.target.checked }))}
              />
              <span>SMS Notifications</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.inAppEnabled}
                onChange={(e) => setSettings(prev => ({ ...prev, inAppEnabled: e.target.checked }))}
              />
              <span>In-App Notifications</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={settings.soundEnabled}
                onChange={(e) => setSettings(prev => ({ ...prev, soundEnabled: e.target.checked }))}
              />
              <span>Sound</span>
            </label>

            <div>
              <label className="block text-sm mb-1">Quiet Hours</label>
              <div className="flex gap-2">
                <input
                  type="time"
                  value={settings.quietHours.start}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    quietHours: { ...prev.quietHours, start: e.target.value }
                  }))}
                  className="px-2 py-1 border rounded"
                />
                <span>to</span>
                <input
                  type="time"
                  value={settings.quietHours.end}
                  onChange={(e) => setSettings(prev => ({
                    ...prev,
                    quietHours: { ...prev.quietHours, end: e.target.value }
                  }))}
                  className="px-2 py-1 border rounded"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No notifications
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(notification => (
              <div
                key={notification.id}
                onClick={() => {
                  markAsRead(notification.id);
                  onNotificationClick?.(notification);
                }}
                className={`
                  notification-item p-4 rounded border cursor-pointer transition-all
                  ${notification.read ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-200'}
                  hover:shadow-md
                `}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <h4 className="font-medium">{notification.title}</h4>
                      <span className="text-xs text-gray-500">{formatTime(notification.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                    className="text-gray-400 hover:text-red-500"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {notifications.length > 0 && (
        <button
          onClick={clearAllNotifications}
          className="w-full mt-4 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Clear All
        </button>
      )}
    </div>
  );
}

export default NotificationService;
