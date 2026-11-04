import { TaskPriority } from './TaskModel';

interface PrioritySelectorProps {
  value: TaskPriority;
  onChange: (priority: TaskPriority) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

function PrioritySelector({ value, onChange, disabled = false, size = 'medium', showLabel = false }: PrioritySelectorProps) {
  const priorities: { value: TaskPriority; label: string; color: string; icon: string }[] = [
    { value: 'low', label: 'Low', color: 'bg-gray-100 text-gray-600 hover:bg-gray-200', icon: '↓' },
    { value: 'medium', label: 'Medium', color: 'bg-blue-100 text-blue-600 hover:bg-blue-200', icon: '→' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-600 hover:bg-orange-200', icon: '↑' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-600 hover:bg-red-200', icon: '↑↑' }
  ];

  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    medium: 'px-3 py-2 text-sm',
    large: 'px-4 py-3 text-base'
  };

  const handlePriorityChange = (newPriority: TaskPriority) => {
    if (!disabled) {
      onChange(newPriority);
    }
  };

  if (showLabel) {
    return (
      <div className="priority-selector">
        <label className="block text-sm font-medium mb-2">Priority</label>
        <div className="flex gap-2">
          {priorities.map(priority => (
            <button
              key={priority.value}
              onClick={() => handlePriorityChange(priority.value)}
              disabled={disabled}
              className={`
                ${sizeClasses[size]}
                ${priority.color}
                ${value === priority.value ? 'ring-2 ring-offset-1 ring-blue-500' : ''}
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                rounded transition-all duration-200
                flex items-center gap-1
              `}
            >
              <span>{priority.icon}</span>
              <span>{priority.label}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="priority-selector">
      <select
        value={value}
        onChange={(e) => handlePriorityChange(e.target.value as TaskPriority)}
        disabled={disabled}
        className={`
          ${sizeClasses[size]}
          border rounded
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
          ${getPriorityColor(value)}
        `}
      >
        {priorities.map(priority => (
          <option key={priority.value} value={priority.value}>
            {priority.icon} {priority.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function getPriorityColor(priority: TaskPriority): string {
  const colors = {
    low: 'bg-gray-50 text-gray-700',
    medium: 'bg-blue-50 text-blue-700',
    high: 'bg-orange-50 text-orange-700',
    urgent: 'bg-red-50 text-red-700'
  };
  return colors[priority];
}

interface PriorityBadgeProps {
  priority: TaskPriority;
  showIcon?: boolean;
  size?: 'small' | 'medium' | 'large';
}

function PriorityBadge({ priority, showIcon = true, size = 'medium' }: PriorityBadgeProps) {
  const priorityConfig = {
    low: { label: 'Low', icon: '↓', color: 'bg-gray-100 text-gray-700' },
    medium: { label: 'Medium', icon: '→', color: 'bg-blue-100 text-blue-700' },
    high: { label: 'High', icon: '↑', color: 'bg-orange-100 text-orange-700' },
    urgent: { label: 'Urgent', icon: '↑↑', color: 'bg-red-100 text-red-700' }
  };

  const config = priorityConfig[priority];
  const sizeClasses = {
    small: 'px-2 py-0.5 text-xs',
    medium: 'px-2.5 py-1 text-sm',
    large: 'px-3 py-1.5 text-base'
  };

  return (
    <span className={`inline-flex items-center gap-1 rounded ${config.color} ${sizeClasses[size]}`}>
      {showIcon && <span>{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  );
}

interface PriorityMatrixProps {
  value: TaskPriority;
  onChange: (priority: TaskPriority) => void;
  disabled?: boolean;
}

function PriorityMatrix({ value, onChange, disabled = false }: PriorityMatrixProps) {
  const matrix = [
    { priority: 'low' as TaskPriority, label: 'Low', description: 'Can be done anytime' },
    { priority: 'medium' as TaskPriority, label: 'Medium', description: 'Should be done soon' },
    { priority: 'high' as TaskPriority, label: 'High', description: 'Important and urgent' },
    { priority: 'urgent' as TaskPriority, label: 'Urgent', description: 'Critical - do immediately' }
  ];

  const getMatrixColor = (priority: TaskPriority) => {
    const colors = {
      low: 'border-gray-300 hover:border-gray-400',
      medium: 'border-blue-300 hover:border-blue-400',
      high: 'border-orange-300 hover:border-orange-400',
      urgent: 'border-red-300 hover:border-red-400'
    };
    return colors[priority];
  };

  const getMatrixBgColor = (priority: TaskPriority) => {
    const colors = {
      low: 'bg-gray-50',
      medium: 'bg-blue-50',
      high: 'bg-orange-50',
      urgent: 'bg-red-50'
    };
    return colors[priority];
  };

  return (
    <div className="priority-matrix">
      <label className="block text-sm font-medium mb-2">Select Priority</label>
      <div className="grid grid-cols-2 gap-2">
        {matrix.map(item => (
          <button
            key={item.priority}
            onClick={() => !disabled && onChange(item.priority)}
            disabled={disabled}
            className={`
              p-3 border-2 rounded-lg text-left transition-all duration-200
              ${getMatrixColor(item.priority)}
              ${getMatrixBgColor(item.priority)}
              ${value === item.priority ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-md'}
            `}
          >
            <div className="font-semibold">{item.label}</div>
            <div className="text-sm text-gray-600">{item.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

export { PrioritySelector, PriorityBadge, PriorityMatrix };
export default PrioritySelector;
