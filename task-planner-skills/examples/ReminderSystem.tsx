import { useState, useEffect, useCallback } from 'react';
import { Task, Reminder } from './TaskModel';

interface ReminderConfig {
  type: 'email' | 'push' | 'sms';
  minutesBefore: number;
  enabled: boolean;
}

interface ReminderSystemProps {
  tasks: Task[];
  onReminderAdd?: (taskId: string, reminder: Omit<Reminder, 'id' | 'sent'>) => void;
  onReminderRemove?: (taskId: string, reminderId: string) => void;
}

function ReminderSystem({ tasks, onReminderAdd, onReminderRemove }: ReminderSystemProps) {
  const [activeReminders, setActiveReminders] = useState<Reminder[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [defaultReminderConfig, setDefaultReminderConfig] = useState<ReminderConfig>({
    type: 'push',
    minutesBefore: 15,
    enabled: true
  });

  useEffect(() => {
    const checkReminders = setInterval(() => {
      const now = new Date();
      const upcomingReminders: Reminder[] = [];

      tasks.forEach(task => {
        if (!task.dueDate || task.status === 'completed') return;

        const dueTime = task.dueDate.getTime();
        task.reminders.forEach(reminder => {
          if (reminder.sent) return;

          const reminderTime = dueTime - reminder.minutesBefore * 60 * 1000;
          const timeDiff = reminderTime - now.getTime();

          if (timeDiff <= 0 && timeDiff > -60000) {
            upcomingReminders.push(reminder);
          }
        });
      });

      if (upcomingReminders.length > 0) {
        setActiveReminders(upcomingReminders);
        sendNotifications(upcomingReminders);
      }
    }, 60000);

    return () => clearInterval(checkReminders);
  }, [tasks]);

  const sendNotifications = useCallback((reminders: Reminder[]) => {
    reminders.forEach(reminder => {
      switch (reminder.type) {
        case 'push':
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Task Reminder', {
              body: 'Your task is due soon!',
              icon: '/notification-icon.png'
            });
          }
          break;
        case 'email':
          console.log('Sending email reminder:', reminder);
          break;
        case 'sms':
          console.log('Sending SMS reminder:', reminder);
          break;
      }
    });
  }, []);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return false;
  }, []);

  const handleAddReminder = useCallback((taskId: string) => {
    if (!defaultReminderConfig.enabled) return;

    const reminder: Omit<Reminder, 'id' | 'sent'> = {
      type: defaultReminderConfig.type,
      minutesBefore: defaultReminderConfig.minutesBefore
    };

    onReminderAdd?.(taskId, reminder);
  }, [defaultReminderConfig, onReminderAdd]);

  const handleRemoveReminder = useCallback((taskId: string, reminderId: string) => {
    onReminderRemove?.(taskId, reminderId);
  }, [onReminderRemove]);

  const handleMarkAsSent = useCallback((taskId: string, reminderId: string) => {
    setActiveReminders(prev => prev.filter(r => r.id !== reminderId));
  }, []);

  const getReminderIcon = (type: Reminder['type']): string => {
    const icons = {
      email: '📧',
      push: '🔔',
      sms: '📱'
    };
    return icons[type];
  };

  const formatTimeBefore = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min before`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m before` : `${hours}h before`;
  };

  const presetReminders = [
    { label: '5 minutes before', minutes: 5 },
    { label: '15 minutes before', minutes: 15 },
    { label: '30 minutes before', minutes: 30 },
    { label: '1 hour before', minutes: 60 },
    { label: '1 day before', minutes: 1440 }
  ];

  return (
    <div className="reminder-system">
      <div className="reminder-header mb-6">
        <h2 className="text-xl font-bold mb-4">Reminder System</h2>
        
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            ⚙️ Settings
          </button>
          <button
            onClick={requestNotificationPermission}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Enable Notifications
          </button>
        </div>

        {showSettings && (
          <div className="bg-gray-50 p-4 rounded mb-4">
            <h3 className="font-semibold mb-3">Default Reminder Settings</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm mb-1">Reminder Type</label>
                <select
                  value={defaultReminderConfig.type}
                  onChange={(e) => setDefaultReminderConfig(prev => ({
                    ...prev,
                    type: e.target.value as Reminder['type']
                  }))}
                  className="w-full px-3 py-2 border rounded"
                >
                  <option value="push">Push Notification</option>
                  <option value="email">Email</option>
                  <option value="sms">SMS</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm mb-1">Time Before Due</label>
                <select
                  value={defaultReminderConfig.minutesBefore}
                  onChange={(e) => setDefaultReminderConfig(prev => ({
                    ...prev,
                    minutesBefore: parseInt(e.target.value)
                  }))}
                  className="w-full px-3 py-2 border rounded"
                >
                  {presetReminders.map(preset => (
                    <option key={preset.minutes} value={preset.minutes}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={defaultReminderConfig.enabled}
                onChange={(e) => setDefaultReminderConfig(prev => ({
                  ...prev,
                  enabled: e.target.checked
                }))}
              />
              <span>Enable reminders for new tasks</span>
            </label>
          </div>
        )}
      </div>

      {activeReminders.length > 0 && (
        <div className="active-reminders bg-blue-50 border border-blue-200 p-4 rounded mb-4">
          <h3 className="font-semibold text-blue-700 mb-2">🔔 Active Reminders</h3>
          {activeReminders.map(reminder => (
            <div key={reminder.id} className="text-sm text-blue-600">
              {getReminderIcon(reminder.type)} Reminder sent
            </div>
          ))}
        </div>
      )}

      <div className="task-reminders">
        <h3 className="font-semibold mb-3">Task Reminders</h3>
        
        {tasks.filter(task => task.dueDate && task.status !== 'completed').length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No tasks with due dates
          </div>
        ) : (
          <div className="space-y-3">
            {tasks
              .filter(task => task.dueDate && task.status !== 'completed')
              .map(task => (
                <div key={task.id} className="task-reminder p-4 bg-white rounded border">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{task.title}</h4>
                      <div className="text-sm text-gray-500">
                        Due: {task.dueDate.toLocaleString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleAddReminder(task.id)}
                      className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                    >
                      + Add Reminder
                    </button>
                  </div>

                  {task.reminders.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="text-sm text-gray-600 mb-2">Reminders:</div>
                      <div className="flex flex-wrap gap-2">
                        {task.reminders.map(reminder => (
                          <div
                            key={reminder.id}
                            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded text-sm"
                          >
                            <span>{getReminderIcon(reminder.type)}</span>
                            <span>{formatTimeBefore(reminder.minutesBefore)}</span>
                            {reminder.sent && (
                              <span className="text-green-600">✓</span>
                            )}
                            <button
                              onClick={() => handleRemoveReminder(task.id, reminder.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ReminderSystem;
