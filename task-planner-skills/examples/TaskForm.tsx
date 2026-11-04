import { useState, useEffect } from 'react';
import { Task, TaskModel, TaskPriority } from './TaskModel';

interface TaskFormProps {
  task?: Task;
  onSubmit: (task: Task) => void;
  onCancel: () => void;
  availableTags?: string[];
  availableProjects?: { id: string; name: string }[];
  availableAssignees?: { id: string; name: string }[];
}

function TaskForm({ task, onSubmit, onCancel, availableTags = [], availableProjects = [], availableAssignees = [] }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [priority, setPriority] = useState<TaskPriority>(task?.priority || 'medium');
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.toISOString().split('T')[0] : '');
  const [estimatedHours, setEstimatedHours] = useState(task?.estimatedHours || '');
  const [selectedTags, setSelectedTags] = useState<string[]>(task?.tags || []);
  const [selectedProject, setSelectedProject] = useState(task?.projectId || '');
  const [selectedAssignee, setSelectedAssignee] = useState(task?.assigneeId || '');
  const [newTag, setNewTag] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setPriority(task.priority);
      setDueDate(task.dueDate ? task.dueDate.toISOString().split('T')[0] : '');
      setEstimatedHours(task.estimatedHours?.toString() || '');
      setSelectedTags(task.tags);
      setSelectedProject(task.projectId || '');
      setSelectedAssignee(task.assigneeId || '');
    }
  }, [task]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (dueDate && new Date(dueDate) < new Date(new Date().setHours(0, 0, 0, 0))) {
      newErrors.dueDate = 'Due date cannot be in the past';
    }

    if (estimatedHours && (parseFloat(estimatedHours) <= 0 || parseFloat(estimatedHours) > 1000)) {
      newErrors.estimatedHours = 'Estimated hours must be between 1 and 1000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    const taskData = TaskModel.create({
      id: task?.id,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
      tags: selectedTags,
      projectId: selectedProject || undefined,
      assigneeId: selectedAssignee || undefined,
      status: task?.status || 'todo',
      createdAt: task?.createdAt,
      updatedAt: new Date(),
      completedAt: task?.completedAt,
      subtasks: task?.subtasks || [],
      dependencies: task?.dependencies || [],
      reminders: task?.reminders || []
    });

    onSubmit(taskData);
  };

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      setSelectedTags([...selectedTags, trimmedTag]);
      setNewTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleToggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      handleRemoveTag(tag);
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="task-form space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={`w-full px-3 py-2 border rounded ${errors.title ? 'border-red-500' : ''}`}
          placeholder="Enter task title"
        />
        {errors.title && <p className="text-red-500 text-sm mt-1">{errors.title}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          rows={4}
          placeholder="Enter task description"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={`w-full px-3 py-2 border rounded ${errors.dueDate ? 'border-red-500' : ''}`}
          />
          {errors.dueDate && <p className="text-red-500 text-sm mt-1">{errors.dueDate}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Estimated Hours</label>
        <input
          type="number"
          value={estimatedHours}
          onChange={(e) => setEstimatedHours(e.target.value)}
          className={`w-full px-3 py-2 border rounded ${errors.estimatedHours ? 'border-red-500' : ''}`}
          placeholder="Enter estimated hours"
          min="0"
          step="0.5"
        />
        {errors.estimatedHours && <p className="text-red-500 text-sm mt-1">{errors.estimatedHours}</p>}
      </div>

      {availableProjects.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">Project</label>
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="">No Project</option>
            {availableProjects.map(project => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        </div>
      )}

      {availableAssignees.length > 0 && (
        <div>
          <label className="block text-sm font-medium mb-1">Assignee</label>
          <select
            value={selectedAssignee}
            onChange={(e) => setSelectedAssignee(e.target.value)}
            className="w-full px-3 py-2 border rounded"
          >
            <option value="">Unassigned</option>
            {availableAssignees.map(assignee => (
              <option key={assignee.id} value={assignee.id}>{assignee.name}</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">Tags</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            className="flex-1 px-3 py-2 border rounded"
            placeholder="Add new tag"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
          />
          <button
            type="button"
            onClick={handleAddTag}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add
          </button>
        </div>

        {availableTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {availableTags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => handleToggleTag(tag)}
                className={`px-3 py-1 rounded text-sm ${selectedTags.includes(tag) ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-sm flex items-center gap-1"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          {task ? 'Update Task' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}

export default TaskForm;
