import { useState, useCallback, useMemo } from 'react';
import { Task } from './TaskModel';

interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'admin' | 'member' | 'viewer';
  online: boolean;
}

interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

interface Activity {
  id: string;
  type: 'task_created' | 'task_updated' | 'task_completed' | 'task_assigned' | 'comment_added';
  taskId: string;
  userId: string;
  data?: any;
  createdAt: Date;
}

interface TeamCollaborationProps {
  tasks: Task[];
  currentUser: User;
  users: User[];
  onTaskAssign?: (taskId: string, assigneeId: string) => void;
  onCommentAdd?: (comment: Omit<Comment, 'id' | 'createdAt'>) => void;
  onActivityLog?: (activity: Omit<Activity, 'id' | 'createdAt'>) => void;
}

function TeamCollaboration({
  tasks,
  currentUser,
  users,
  onTaskAssign,
  onCommentAdd,
  onActivityLog
}: TeamCollaborationProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showActivity, setShowActivity] = useState(true);
  const [filterByUser, setFilterByUser] = useState<string | 'all'>('all');

  const canEditTask = useCallback((task: Task): boolean => {
    if (currentUser.role === 'admin') return true;
    if (currentUser.role === 'viewer') return false;
    return task.assigneeId === currentUser.id;
  }, [currentUser]);

  const canAssignTask = useCallback((): boolean => {
    return currentUser.role === 'admin' || currentUser.role === 'member';
  }, [currentUser.role]);

  const handleTaskAssign = useCallback((taskId: string, assigneeId: string) => {
    onTaskAssign?.(taskId, assigneeId);
    
    const activity: Omit<Activity, 'id' | 'createdAt'> = {
      type: 'task_assigned',
      taskId,
      userId: currentUser.id,
      data: { assigneeId }
    };
    onActivityLog?.(activity);
    setActivities(prev => [{ ...activity, id: `act_${Date.now()}`, createdAt: new Date() }, ...prev]);
  }, [currentUser, onTaskAssign, onActivityLog]);

  const handleCommentSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !newComment.trim()) return;

    const comment: Omit<Comment, 'id' | 'createdAt'> = {
      taskId: selectedTask.id,
      userId: currentUser.id,
      content: newComment.trim()
    };

    onCommentAdd?.(comment);
    setComments(prev => [{ ...comment, id: `cmt_${Date.now()}`, createdAt: new Date() }, ...prev]);
    setNewComment('');

    const activity: Omit<Activity, 'id' | 'createdAt'> = {
      type: 'comment_added',
      taskId: selectedTask.id,
      userId: currentUser.id
    };
    onActivityLog?.(activity);
    setActivities(prev => [{ ...activity, id: `act_${Date.now()}`, createdAt: new Date() }, ...prev]);
  }, [selectedTask, currentUser, newComment, onCommentAdd, onActivityLog]);

  const filteredActivities = useMemo(() => {
    if (filterByUser === 'all') return activities;
    return activities.filter(a => a.userId === filterByUser);
  }, [activities, filterByUser]);

  const getTaskComments = useCallback((taskId: string): Comment[] => {
    return comments.filter(c => c.taskId === taskId);
  }, [comments]);

  const getActivityIcon = (type: Activity['type']): string => {
    const icons = {
      task_created: '➕',
      task_updated: '✏️',
      task_completed: '✅',
      task_assigned: '👤',
      comment_added: '💬'
    };
    return icons[type];
  };

  const getActivityText = (activity: Activity): string => {
    const user = users.find(u => u.id === activity.userId);
    const task = tasks.find(t => t.id === activity.taskId);
    const userName = user?.name || 'Unknown User';
    const taskTitle = task?.title || 'Unknown Task';

    switch (activity.type) {
      case 'task_created':
        return `${userName} created task "${taskTitle}"`;
      case 'task_updated':
        return `${userName} updated task "${taskTitle}"`;
      case 'task_completed':
        return `${userName} completed task "${taskTitle}"`;
      case 'task_assigned':
        const assignee = users.find(u => u.id === activity.data?.assigneeId);
        return `${userName} assigned task "${taskTitle}" to ${assignee?.name || 'Unknown'}`;
      case 'comment_added':
        return `${userName} commented on task "${taskTitle}"`;
      default:
        return `${userName} performed an action on "${taskTitle}"`;
    }
  };

  return (
    <div className="team-collaboration">
      <div className="collaboration-header mb-6">
        <h2 className="text-xl font-bold mb-4">Team Collaboration</h2>
        
        <div className="team-members mb-4">
          <h3 className="font-semibold mb-2">Team Members</h3>
          <div className="flex flex-wrap gap-2">
            {users.map(user => (
              <div
                key={user.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-full border-2 ${
                  user.id === currentUser.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                }`}
              >
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center">
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full" />
                    ) : (
                      <span className="text-sm font-medium">{user.name.charAt(0)}</span>
                    )}
                  </div>
                  {user.online && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div>
                  <div className="text-sm font-medium">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowActivity(!showActivity)}
            className={`px-4 py-2 rounded ${showActivity ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
          >
            {showActivity ? 'Hide Activity' : 'Show Activity'}
          </button>
          <select
            value={filterByUser}
            onChange={(e) => setFilterByUser(e.target.value)}
            className="px-3 py-2 border rounded"
          >
            <option value="all">All Users</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="task-assignments">
          <h3 className="font-semibold mb-3">Task Assignments</h3>
          
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No tasks
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => {
                const assignee = users.find(u => u.id === task.assigneeId);
                const isSelected = selectedTask?.id === task.id;

                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className={`task-item p-4 rounded border-2 cursor-pointer transition-all ${
                      isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="font-semibold">{task.title}</h4>
                        <div className="text-sm text-gray-500 mt-1">
                          Status: {task.status} | Priority: {task.priority}
                        </div>
                      </div>
                      {canAssignTask() && (
                        <select
                          value={task.assigneeId || ''}
                          onChange={(e) => {
                            if (e.target.value) {
                              handleTaskAssign(task.id, e.target.value);
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="px-2 py-1 border rounded text-sm"
                        >
                          <option value="">Unassigned</option>
                          {users.map(user => (
                            <option key={user.id} value={user.id}>{user.name}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {assignee && (
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs">
                          {assignee.name.charAt(0)}
                        </div>
                        <span className="text-sm text-gray-600">Assigned to {assignee.name}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="activity-and-comments">
          {showActivity && (
            <div className="activity-feed mb-6">
              <h3 className="font-semibold mb-3">Activity Feed</h3>
              
              {filteredActivities.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No activity yet
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {filteredActivities.map(activity => (
                    <div key={activity.id} className="activity-item p-3 bg-gray-50 rounded">
                      <div className="flex items-start gap-2">
                        <span className="text-lg">{getActivityIcon(activity.type)}</span>
                        <div className="flex-1">
                          <div className="text-sm">{getActivityText(activity)}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {activity.createdAt.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedTask && (
            <div className="task-comments">
              <h3 className="font-semibold mb-3">Comments - {selectedTask.title}</h3>
              
              <form onSubmit={handleCommentSubmit} className="mb-4">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full px-3 py-2 border rounded resize-none"
                  rows={3}
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                >
                  Post Comment
                </button>
              </form>

              <div className="space-y-3 max-h-64 overflow-y-auto">
                {getTaskComments(selectedTask.id).length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No comments yet
                  </div>
                ) : (
                  getTaskComments(selectedTask.id).map(comment => {
                    const user = users.find(u => u.id === comment.userId);
                    return (
                      <div key={comment.id} className="comment p-3 bg-white rounded border">
                        <div className="flex items-start gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm">
                            {user?.name.charAt(0) || '?'}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-sm">{user?.name || 'Unknown'}</span>
                              <span className="text-xs text-gray-500">
                                {comment.createdAt.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm">{comment.content}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TeamCollaboration;
