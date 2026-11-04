import { useState, useEffect, useCallback } from 'react';
import { Task, TaskStatus } from './TaskModel';

interface KeyboardShortcutsProps {
  tasks: Task[];
  onTaskCreate?: () => void;
  onTaskUpdate?: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete?: (taskId: string) => void;
  onNavigate?: (view: string) => void;
}

interface Shortcut {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

function KeyboardShortcuts({
  tasks,
  onTaskCreate,
  onTaskUpdate,
  onTaskDelete,
  onNavigate
}: KeyboardShortcutsProps) {
  const [showHelp, setShowHelp] = useState(false);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const visibleTasks = tasks.filter(task => task.status !== 'archived');

  const handleCreateTask = useCallback(() => {
    onTaskCreate?.();
  }, [onTaskCreate]);

  const handleDeleteTask = useCallback(() => {
    const selectedTask = visibleTasks[selectedTaskIndex];
    if (selectedTask && confirm(`Delete task "${selectedTask.title}"?`)) {
      onTaskDelete?.(selectedTask.id);
      setSelectedTaskIndex(Math.max(0, selectedTaskIndex - 1));
    }
  }, [selectedTaskIndex, visibleTasks, onTaskDelete]);

  const handleMoveTask = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    const selectedTask = visibleTasks[selectedTaskIndex];
    if (!selectedTask) return;

    const statusOrder: TaskStatus[] = ['todo', 'in_progress', 'completed', 'archived'];
    const currentIndex = statusOrder.indexOf(selectedTask.status);

    let newStatus: TaskStatus;

    switch (direction) {
      case 'left':
        newStatus = statusOrder[Math.max(0, currentIndex - 1)];
        break;
      case 'right':
        newStatus = statusOrder[Math.min(statusOrder.length - 1, currentIndex + 1)];
        break;
      case 'up':
        setSelectedTaskIndex(Math.max(0, selectedTaskIndex - 1));
        return;
      case 'down':
        setSelectedTaskIndex(Math.min(visibleTasks.length - 1, selectedTaskIndex + 1));
        return;
      default:
        return;
    }

    if (newStatus !== selectedTask.status) {
      onTaskUpdate?.(selectedTask.id, { status: newStatus });
    }
  }, [selectedTaskIndex, visibleTasks, onTaskUpdate]);

  const handleSearch = useCallback(() => {
    setIsSearching(true);
    setTimeout(() => {
      const searchInput = document.getElementById('task-search-input') as HTMLInputElement;
      searchInput?.focus();
    }, 100);
  }, []);

  const handleToggleComplete = useCallback(() => {
    const selectedTask = visibleTasks[selectedTaskIndex];
    if (selectedTask) {
      const newStatus: TaskStatus = selectedTask.status === 'completed' ? 'todo' : 'completed';
      onTaskUpdate?.(selectedTask.id, { status: newStatus });
    }
  }, [selectedTaskIndex, visibleTasks, onTaskUpdate]);

  const handleNavigate = useCallback((view: string) => {
    onNavigate?.(view);
  }, [onNavigate]);

  const shortcuts: Shortcut[] = [
    {
      key: 'n',
      ctrl: true,
      description: 'Create new task',
      action: handleCreateTask
    },
    {
      key: '/',
      description: 'Search tasks',
      action: handleSearch
    },
    {
      key: '?',
      description: 'Show keyboard shortcuts',
      action: () => setShowHelp(!showHelp)
    },
    {
      key: 'Escape',
      description: 'Close modal / Clear search',
      action: () => {
        setShowHelp(false);
        setIsSearching(false);
        setSearchQuery('');
      }
    },
    {
      key: 'ArrowUp',
      description: 'Navigate up',
      action: () => handleMoveTask('up')
    },
    {
      key: 'ArrowDown',
      description: 'Navigate down',
      action: () => handleMoveTask('down')
    },
    {
      key: 'ArrowLeft',
      description: 'Move task to previous status',
      action: () => handleMoveTask('left')
    },
    {
      key: 'ArrowRight',
      description: 'Move task to next status',
      action: () => handleMoveTask('right')
    },
    {
      key: 'Enter',
      description: 'Edit selected task',
      action: () => {
        const selectedTask = visibleTasks[selectedTaskIndex];
        if (selectedTask) {
          console.log('Edit task:', selectedTask.id);
        }
      }
    },
    {
      key: 'Delete',
      description: 'Delete selected task',
      action: handleDeleteTask
    },
    {
      key: 'c',
      description: 'Toggle complete status',
      action: handleToggleComplete
    },
    {
      key: '1',
      description: 'Navigate to List view',
      action: () => handleNavigate('list')
    },
    {
      key: '2',
      description: 'Navigate to Board view',
      action: () => handleNavigate('board')
    },
    {
      key: '3',
      description: 'Navigate to Calendar view',
      action: () => handleNavigate('calendar')
    },
    {
      key: '4',
      description: 'Navigate to Timeline view',
      action: () => handleNavigate('timeline')
    }
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSearching && e.key !== 'Escape') {
        return;
      }

      const matchingShortcut = shortcuts.find(shortcut => {
        const keyMatch = shortcut.key.toLowerCase() === e.key.toLowerCase();
        const ctrlMatch = !!shortcut.ctrl === e.ctrlKey;
        const shiftMatch = !!shortcut.shift === e.shiftKey;
        const altMatch = !!shortcut.alt === e.altKey;

        return keyMatch && ctrlMatch && shiftMatch && altMatch;
      });

      if (matchingShortcut) {
        e.preventDefault();
        matchingShortcut.action();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts, isSearching]);

  const formatShortcut = (shortcut: Shortcut): string => {
    const parts = [];
    if (shortcut.ctrl) parts.push('Ctrl');
    if (shortcut.shift) parts.push('Shift');
    if (shortcut.alt) parts.push('Alt');
    parts.push(shortcut.key);
    return parts.join(' + ');
  };

  const groupedShortcuts = {
    Navigation: shortcuts.filter(s => ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', '1', '2', '3', '4'].includes(s.key)),
    Actions: shortcuts.filter(s => ['n', 'Enter', 'Delete', 'c'].includes(s.key)),
    Search: shortcuts.filter(s => ['/', '?'].includes(s.key)),
    General: shortcuts.filter(s => ['Escape'].includes(s.key))
  };

  return (
    <div className="keyboard-shortcuts">
      <div className="shortcuts-header mb-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold">Keyboard Shortcuts</h2>
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            {showHelp ? 'Hide' : 'Show'} Help
          </button>
        </div>
        <p className="text-gray-600 text-sm mt-2">
          Press <kbd className="px-2 py-1 bg-gray-100 rounded">?</kbd> to toggle this help
        </p>
      </div>

      {showHelp && (
        <div className="shortcuts-help bg-white rounded-lg border p-6 mb-6">
          <h3 className="font-semibold mb-4">Keyboard Shortcuts</h3>

          <div className="grid grid-cols-2 gap-6">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <div key={category}>
                <h4 className="font-medium text-sm text-gray-600 mb-2">{category}</h4>
                <div className="space-y-2">
                  {categoryShortcuts.map(shortcut => (
                    <div key={shortcut.key} className="flex justify-between items-center">
                      <span className="text-sm">{shortcut.description}</span>
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                        {formatShortcut(shortcut)}
                      </kbd>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isSearching && (
        <div className="search-bar mb-6">
          <input
            id="task-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks... (Press Escape to close)"
            className="w-full px-4 py-2 border rounded-lg"
            autoFocus
          />
        </div>
      )}

      <div className="task-list">
        <h3 className="font-semibold mb-3">Tasks</h3>
        
        {visibleTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No tasks
          </div>
        ) : (
          <div className="space-y-2">
            {visibleTasks.map((task, index) => {
              const isSelected = index === selectedTaskIndex;
              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskIndex(index)}
                  className={`
                    task-item p-3 rounded border-2 cursor-pointer transition-all
                    ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
                    hover:border-blue-300
                  `}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium">{task.title}</h4>
                      <div className="text-sm text-gray-500 mt-1">
                        {task.status} | {task.priority}
                      </div>
                    </div>
                    {isSelected && (
                      <div className="text-blue-500 text-xs">
                        Selected
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="quick-actions mt-6 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-3">Quick Actions</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleCreateTask}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
          >
            <kbd className="mr-1 px-1 bg-white/20 rounded">Ctrl+N</kbd>
            New Task
          </button>
          <button
            onClick={handleToggleComplete}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
          >
            <kbd className="mr-1 px-1 bg-white/20 rounded">C</kbd>
            Toggle Complete
          </button>
          <button
            onClick={handleDeleteTask}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
          >
            <kbd className="mr-1 px-1 bg-white/20 rounded">Del</kbd>
            Delete Task
          </button>
          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
          >
            <kbd className="mr-1 px-1 bg-white/20 rounded">/</kbd>
            Search
          </button>
        </div>
      </div>
    </div>
  );
}

export default KeyboardShortcuts;
