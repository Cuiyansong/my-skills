import { useState, useMemo } from 'react';
import { Task } from './TaskModel';

interface AnalyticsDashboardProps {
  tasks: Task[];
}

function AnalyticsDashboard({ tasks }: AnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedMetric, setSelectedMetric] = useState<'completion' | 'productivity' | 'workload' | 'trends'>('completion');

  const stats = useMemo(() => {
    const now = new Date();
    const startDate = new Date();

    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const tasksInRange = tasks.filter(task => task.createdAt >= startDate);

    const completedTasks = tasksInRange.filter(t => t.status === 'completed');
    const inProgressTasks = tasksInRange.filter(t => t.status === 'in_progress');
    const overdueTasks = tasksInRange.filter(t => t.dueDate && t.dueDate < now && t.status !== 'completed');

    const totalEstimatedHours = tasksInRange.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);
    const totalActualHours = tasksInRange.reduce((sum, t) => sum + (t.actualHours || 0), 0);

    const completionRate = tasksInRange.length > 0
      ? (completedTasks.length / tasksInRange.length) * 100
      : 0;

    const avgCompletionTime = completedTasks.length > 0
      ? completedTasks.reduce((sum, t) => {
          if (t.completedAt && t.createdAt) {
            return sum + (t.completedAt.getTime() - t.createdAt.getTime());
          }
          return sum;
        }, 0) / completedTasks.length
      : 0;

    const tasksByPriority = {
      low: tasksInRange.filter(t => t.priority === 'low').length,
      medium: tasksInRange.filter(t => t.priority === 'medium').length,
      high: tasksInRange.filter(t => t.priority === 'high').length,
      urgent: tasksInRange.filter(t => t.priority === 'urgent').length
    };

    const tasksByStatus = {
      todo: tasksInRange.filter(t => t.status === 'todo').length,
      in_progress: inProgressTasks.length,
      completed: completedTasks.length,
      archived: tasksInRange.filter(t => t.status === 'archived').length
    };

    const dailyCompletion = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayTasks = completedTasks.filter(t =>
        t.completedAt && t.completedAt.toDateString() === date.toDateString()
      );
      return {
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        count: dayTasks.length
      };
    }).reverse();

    const topTags = useMemo(() => {
      const tagCounts = new Map<string, number>();
      tasksInRange.forEach(task => {
        task.tags.forEach(tag => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      });
      return Array.from(tagCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    }, [tasksInRange]);

    return {
      total: tasksInRange.length,
      completed: completedTasks.length,
      inProgress: inProgressTasks.length,
      overdue: overdueTasks.length,
      completionRate,
      avgCompletionTime,
      totalEstimatedHours,
      totalActualHours,
      tasksByPriority,
      tasksByStatus,
      dailyCompletion,
      topTags
    };
  }, [tasks, timeRange]);

  const formatHours = (hours: number): string => {
    return `${hours.toFixed(1)}h`;
  };

  const formatDuration = (ms: number): string => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const getPriorityColor = (priority: string): string => {
    const colors = {
      low: 'bg-gray-400',
      medium: 'bg-blue-400',
      high: 'bg-orange-400',
      urgent: 'bg-red-400'
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-400';
  };

  const getStatusColor = (status: string): string => {
    const colors = {
      todo: 'bg-gray-400',
      in_progress: 'bg-blue-400',
      completed: 'bg-green-400',
      archived: 'bg-purple-400'
    };
    return colors[status as keyof typeof colors] || 'bg-gray-400';
  };

  return (
    <div className="analytics-dashboard">
      <div className="dashboard-header mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Analytics Dashboard</h2>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="px-3 py-2 border rounded"
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
          </select>
        </div>

        <div className="flex gap-2">
          {(['completion', 'productivity', 'workload', 'trends'] as const).map(metric => (
            <button
              key={metric}
              onClick={() => setSelectedMetric(metric)}
              className={`px-4 py-2 rounded capitalize ${
                selectedMetric === metric ? 'bg-blue-500 text-white' : 'bg-gray-200'
              }`}
            >
              {metric}
            </button>
          ))}
        </div>
      </div>

      <div className="stats-grid grid grid-cols-4 gap-4 mb-6">
        <div className="stat-card p-4 bg-white rounded border">
          <div className="text-sm text-gray-600">Total Tasks</div>
          <div className="text-3xl font-bold">{stats.total}</div>
          <div className="text-xs text-gray-500 mt-1">In selected period</div>
        </div>

        <div className="stat-card p-4 bg-white rounded border">
          <div className="text-sm text-gray-600">Completed</div>
          <div className="text-3xl font-bold text-green-600">{stats.completed}</div>
          <div className="text-xs text-gray-500 mt-1">
            {stats.completionRate.toFixed(1)}% completion rate
          </div>
        </div>

        <div className="stat-card p-4 bg-white rounded border">
          <div className="text-sm text-gray-600">In Progress</div>
          <div className="text-3xl font-bold text-blue-600">{stats.inProgress}</div>
          <div className="text-xs text-gray-500 mt-1">Active tasks</div>
        </div>

        <div className="stat-card p-4 bg-white rounded border">
          <div className="text-sm text-gray-600">Overdue</div>
          <div className="text-3xl font-bold text-red-600">{stats.overdue}</div>
          <div className="text-xs text-gray-500 mt-1">Need attention</div>
        </div>
      </div>

      <div className="charts-grid grid grid-cols-2 gap-6 mb-6">
        <div className="chart-card p-4 bg-white rounded border">
          <h3 className="font-semibold mb-4">Tasks by Priority</h3>
          <div className="space-y-3">
            {Object.entries(stats.tasksByPriority).map(([priority, count]) => (
              <div key={priority}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize">{priority}</span>
                  <span>{count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getPriorityColor(priority)}`}
                    style={{ width: `${(count / stats.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card p-4 bg-white rounded border">
          <h3 className="font-semibold mb-4">Tasks by Status</h3>
          <div className="space-y-3">
            {Object.entries(stats.tasksByStatus).map(([status, count]) => (
              <div key={status}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="capitalize">{status.replace('_', ' ')}</span>
                  <span>{count}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${getStatusColor(status)}`}
                    style={{ width: `${(count / stats.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="charts-grid grid grid-cols-2 gap-6 mb-6">
        <div className="chart-card p-4 bg-white rounded border">
          <h3 className="font-semibold mb-4">Daily Completion</h3>
          <div className="flex items-end justify-between h-40">
            {stats.dailyCompletion.map(day => (
              <div key={day.date} className="flex flex-col items-center">
                <div
                  className="w-8 bg-blue-500 rounded-t"
                  style={{
                    height: `${Math.max((day.count / Math.max(...stats.dailyCompletion.map(d => d.count))) * 100, 5)}%`
                  }}
                />
                <div className="text-xs mt-2">{day.date}</div>
                <div className="text-xs text-gray-500">{day.count}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="chart-card p-4 bg-white rounded border">
          <h3 className="font-semibold mb-4">Time Analysis</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Estimated Hours</span>
                <span>{formatHours(stats.totalEstimatedHours)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-blue-500"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Actual Hours</span>
                <span>{formatHours(stats.totalActualHours)}</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 rounded-full bg-green-500"
                  style={{
                    width: `${stats.totalEstimatedHours > 0 ? (stats.totalActualHours / stats.totalEstimatedHours) * 100 : 0}%`
                  }}
                />
              </div>
            </div>

            {stats.avgCompletionTime > 0 && (
              <div className="pt-2 border-t">
                <div className="text-sm text-gray-600">
                  Avg. Completion Time: {formatDuration(stats.avgCompletionTime)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {stats.topTags.length > 0 && (
        <div className="chart-card p-4 bg-white rounded border">
          <h3 className="font-semibold mb-4">Top Tags</h3>
          <div className="flex flex-wrap gap-2">
            {stats.topTags.map(([tag, count]) => (
              <div
                key={tag}
                className="px-3 py-2 bg-gray-100 rounded flex items-center gap-2"
              >
                <span className="font-medium">{tag}</span>
                <span className="bg-gray-300 px-2 py-0.5 rounded text-xs">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="export-section mt-6 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Export Reports</h3>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Export as PDF
          </button>
          <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
            Export as CSV
          </button>
          <button className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600">
            Export as Excel
          </button>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
