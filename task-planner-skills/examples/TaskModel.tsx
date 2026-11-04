export type TaskStatus = 'todo' | 'in_progress' | 'completed' | 'archived';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  tags: string[];
  subtasks: SubTask[];
  dependencies: string[];
  assigneeId?: string;
  estimatedHours?: number;
  actualHours?: number;
  projectId?: string;
  reminders: Reminder[];
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: Date;
}

export interface Reminder {
  id: string;
  type: 'email' | 'push' | 'sms';
  minutesBefore: number;
  sent: boolean;
}

export interface TaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  tags?: string[];
  assigneeId?: string;
  projectId?: string;
  dueDateFrom?: Date;
  dueDateTo?: Date;
  searchQuery?: string;
}

export class TaskModel {
  static create(data: Partial<Task>): Task {
    return {
      id: data.id || this.generateId(),
      title: data.title || '',
      description: data.description,
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      dueDate: data.dueDate,
      createdAt: data.createdAt || new Date(),
      updatedAt: data.updatedAt || new Date(),
      completedAt: data.completedAt,
      tags: data.tags || [],
      subtasks: data.subtasks || [],
      dependencies: data.dependencies || [],
      assigneeId: data.assigneeId,
      estimatedHours: data.estimatedHours,
      actualHours: data.actualHours,
      projectId: data.projectId,
      reminders: data.reminders || []
    };
  }

  static generateId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  static update(task: Task, updates: Partial<Task>): Task {
    return {
      ...task,
      ...updates,
      id: task.id,
      updatedAt: new Date(),
      completedAt: updates.status === 'completed' && task.status !== 'completed' 
        ? new Date() 
        : task.completedAt
    };
  }

  static isOverdue(task: Task): boolean {
    if (!task.dueDate || task.status === 'completed') {
      return false;
    }
    return new Date() > task.dueDate;
  }

  static getPriorityValue(priority: TaskPriority): number {
    const values = { low: 1, medium: 2, high: 3, urgent: 4 };
    return values[priority];
  }

  static compareByPriority(a: Task, b: Task): number {
    return this.getPriorityValue(b.priority) - this.getPriorityValue(a.priority);
  }

  static compareByDueDate(a: Task, b: Task): number {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return a.dueDate.getTime() - b.dueDate.getTime();
  }
}
