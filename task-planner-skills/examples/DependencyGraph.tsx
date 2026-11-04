import { useState, useMemo, useCallback } from 'react';
import { Task } from './TaskModel';

interface DependencyNode {
  task: Task;
  dependencies: DependencyNode[];
  dependents: DependencyNode[];
  level: number;
}

interface DependencyGraphProps {
  tasks: Task[];
  onDependencyAdd?: (taskId: string, dependsOnId: string) => void;
  onDependencyRemove?: (taskId: string, dependsOnId: string) => void;
}

function DependencyGraph({ tasks, onDependencyAdd, onDependencyRemove }: DependencyGraphProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [viewMode, setViewMode] = useState<'graph' | 'list'>('graph');

  const buildDependencyTree = useCallback((): DependencyNode[] => {
    const taskMap = new Map<string, DependencyNode>();
    
    tasks.forEach(task => {
      taskMap.set(task.id, {
        task,
        dependencies: [],
        dependents: [],
        level: 0
      });
    });

    tasks.forEach(task => {
      const node = taskMap.get(task.id);
      if (!node) return;

      task.dependencies.forEach(depId => {
        const depNode = taskMap.get(depId);
        if (depNode) {
          node.dependencies.push(depNode);
          depNode.dependents.push(node);
        }
      });
    });

    const calculateLevels = (node: DependencyNode, visited = new Set<string>()): number => {
      if (visited.has(node.task.id)) {
        return 0;
      }
      visited.add(node.task.id);

      let maxDepLevel = 0;
      node.dependencies.forEach(dep => {
        maxDepLevel = Math.max(maxDepLevel, calculateLevels(dep, visited));
      });

      node.level = maxDepLevel + 1;
      return node.level;
    };

    taskMap.forEach(node => {
      if (node.level === 0) {
        calculateLevels(node);
      }
    });

    return Array.from(taskMap.values()).filter(node => node.dependents.length === 0);
  }, [tasks]);

  const detectCircularDependencies = useCallback((): string[][] => {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (taskId: string, path: string[]): void => {
      visited.add(taskId);
      recursionStack.add(taskId);

      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      task.dependencies.forEach(depId => {
        if (!visited.has(depId)) {
          dfs(depId, [...path, depId]);
        } else if (recursionStack.has(depId)) {
          const cycleStart = path.indexOf(depId);
          const cycle = [...path.slice(cycleStart), depId];
          cycles.push(cycle);
        }
      });

      recursionStack.delete(taskId);
    };

    tasks.forEach(task => {
      if (!visited.has(task.id)) {
        dfs(task.id, [task.id]);
      }
    });

    return cycles;
  }, [tasks]);

  const getCriticalPath = useCallback((): Task[] => {
    const taskMap = new Map<string, Task>();
    tasks.forEach(task => taskMap.set(task.id, task));

    const getLongestPath = (taskId: string, visited = new Set<string>()): Task[] => {
      if (visited.has(taskId)) return [];
      visited.add(taskId);

      const task = taskMap.get(taskId);
      if (!task) return [];

      let longestPath: Task[] = [task];
      task.dependencies.forEach(depId => {
        const path = getLongestPath(depId, visited);
        if (path.length > longestPath.length - 1) {
          longestPath = [...path, task];
        }
      });

      return longestPath;
    };

    let criticalPath: Task[] = [];
    tasks.forEach(task => {
      const path = getLongestPath(task.id);
      if (path.length > criticalPath.length) {
        criticalPath = path;
      }
    });

    return criticalPath;
  }, [tasks]);

  const dependencyTree = useMemo(() => buildDependencyTree(), [buildDependencyTree]);
  const circularDependencies = useMemo(() => detectCircularDependencies(), [detectCircularDependencies]);
  const criticalPath = useMemo(() => getCriticalPath(), [getCriticalPath]);

  const renderDependencyNode = (node: DependencyNode, depth = 0): JSX.Element => {
    const isSelected = selectedTask?.id === node.task.id;
    const isOnCriticalPath = criticalPath.some(t => t.id === node.task.id);

    return (
      <div key={node.task.id} className="dependency-node">
        <div
          className={`
            p-3 rounded border-2 cursor-pointer transition-all
            ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}
            ${isOnCriticalPath ? 'border-orange-400' : ''}
            hover:shadow-md
          `}
          style={{ marginLeft: `${depth * 20}px` }}
          onClick={() => setSelectedTask(node.task)}
        >
          <div className="flex justify-between items-center">
            <div>
              <h4 className="font-semibold">{node.task.title}</h4>
              <div className="text-xs text-gray-500">
                Level: {node.level} | Dependencies: {node.dependencies.length}
              </div>
            </div>
            {isOnCriticalPath && (
              <span className="text-orange-500 text-xs font-medium">Critical</span>
            )}
          </div>
        </div>
        {node.dependencies.map(dep => renderDependencyNode(dep, depth + 1))}
      </div>
    );
  };

  const handleAddDependency = (taskId: string, dependsOnId: string) => {
    if (taskId === dependsOnId) {
      alert('A task cannot depend on itself');
      return;
    }

    const task = tasks.find(t => t.id === taskId);
    if (task?.dependencies.includes(dependsOnId)) {
      alert('Dependency already exists');
      return;
    }

    onDependencyAdd?.(taskId, dependsOnId);
  };

  const handleRemoveDependency = (taskId: string, dependsOnId: string) => {
    onDependencyRemove?.(taskId, dependsOnId);
  };

  return (
    <div className="dependency-graph">
      <div className="graph-header mb-6">
        <h2 className="text-xl font-bold mb-4">Dependency Graph</h2>
        
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setViewMode('graph')}
            className={`px-4 py-2 rounded ${viewMode === 'graph' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            Graph View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded ${viewMode === 'list' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            List View
          </button>
        </div>

        {circularDependencies.length > 0 && (
          <div className="bg-red-50 border border-red-200 p-4 rounded mb-4">
            <h3 className="font-semibold text-red-700 mb-2">⚠️ Circular Dependencies Detected</h3>
            {circularDependencies.map((cycle, index) => (
              <div key={index} className="text-sm text-red-600 mb-1">
                {cycle.map((taskId, i) => {
                  const task = tasks.find(t => t.id === taskId);
                  return (
                    <span key={taskId}>
                      {task?.title || taskId}
                      {i < cycle.length - 1 ? ' → ' : ''}
                    </span>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {criticalPath.length > 0 && (
          <div className="bg-orange-50 border border-orange-200 p-4 rounded mb-4">
            <h3 className="font-semibold text-orange-700 mb-2">🎯 Critical Path</h3>
            <div className="text-sm text-orange-600">
              {criticalPath.map((task, index) => (
                <span key={task.id}>
                  {task.title}
                  {index < criticalPath.length - 1 ? ' → ' : ''}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {viewMode === 'graph' ? (
        <div className="graph-view">
          {dependencyTree.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tasks with dependencies
            </div>
          ) : (
            <div className="space-y-2">
              {dependencyTree.map(node => renderDependencyNode(node))}
            </div>
          )}
        </div>
      ) : (
        <div className="list-view">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Task</th>
                <th className="text-left p-2">Dependencies</th>
                <th className="text-left p-2">Dependents</th>
                <th className="text-left p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => (
                <tr key={task.id} className="border-b">
                  <td className="p-2">
                    <div className="font-medium">{task.title}</div>
                    <div className="text-xs text-gray-500">{task.id}</div>
                  </td>
                  <td className="p-2">
                    {task.dependencies.length === 0 ? (
                      <span className="text-gray-400">None</span>
                    ) : (
                      <div className="flex flex-wrap gap-1">
                        {task.dependencies.map(depId => {
                          const depTask = tasks.find(t => t.id === depId);
                          return (
                            <span key={depId} className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {depTask?.title || depId}
                              <button
                                onClick={() => handleRemoveDependency(task.id, depId)}
                                className="ml-1 text-red-500 hover:text-red-700"
                              >
                                ×
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </td>
                  <td className="p-2">
                    {tasks.filter(t => t.dependencies.includes(task.id)).length}
                  </td>
                  <td className="p-2">
                    <select
                      className="px-2 py-1 border rounded text-sm"
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAddDependency(task.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      value=""
                    >
                      <option value="">Add dependency...</option>
                      {tasks
                        .filter(t => t.id !== task.id && !task.dependencies.includes(t.id))
                        .map(t => (
                          <option key={t.id} value={t.id}>
                            {t.title}
                          </option>
                        ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedTask && (
        <div className="task-details mt-6 p-4 bg-gray-50 rounded">
          <h3 className="font-semibold mb-2">Task Details</h3>
          <div className="space-y-2">
            <div><strong>Title:</strong> {selectedTask.title}</div>
            <div><strong>Status:</strong> {selectedTask.status}</div>
            <div><strong>Priority:</strong> {selectedTask.priority}</div>
            {selectedTask.dueDate && (
              <div><strong>Due Date:</strong> {selectedTask.dueDate.toLocaleDateString()}</div>
            )}
            <div>
              <strong>Dependencies:</strong> {selectedTask.dependencies.length} task(s)
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DependencyGraph;
