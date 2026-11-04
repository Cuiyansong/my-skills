import { useState, useCallback, useEffect } from 'react';
import { Task } from './TaskModel';

type IntegrationType = 'google' | 'outlook' | 'slack' | 'trello' | 'github' | 'jira';

interface Integration {
  type: IntegrationType;
  name: string;
  connected: boolean;
  lastSync?: Date;
  settings: Record<string, any>;
}

interface ExternalEvent {
  id: string;
  source: IntegrationType;
  title: string;
  start: Date;
  end?: Date;
  description?: string;
  taskId?: string;
}

interface ThirdPartyIntegrationProps {
  tasks: Task[];
  onTaskImport?: (tasks: Task[]) => void;
  onTaskExport?: (tasks: Task[]) => void;
}

function ThirdPartyIntegration({ tasks, onTaskImport, onTaskExport }: ThirdPartyIntegrationProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([
    { type: 'google', name: 'Google Calendar', connected: false, settings: {} },
    { type: 'outlook', name: 'Outlook Calendar', connected: false, settings: {} },
    { type: 'slack', name: 'Slack', connected: false, settings: {} },
    { type: 'trello', name: 'Trello', connected: false, settings: {} },
    { type: 'github', name: 'GitHub', connected: false, settings: {} },
    { type: 'jira', name: 'Jira', connected: false, settings: {} }
  ]);
  const [externalEvents, setExternalEvents] = useState<ExternalEvent[]>([]);
  const [syncing, setSyncing] = useState<IntegrationType | null>(null);
  const [showSettings, setShowSettings] = useState<IntegrationType | null>(null);

  const connectIntegration = useCallback(async (type: IntegrationType) => {
    setSyncing(type);

    try {
      switch (type) {
        case 'google':
          await connectGoogleCalendar();
          break;
        case 'outlook':
          await connectOutlook();
          break;
        case 'slack':
          await connectSlack();
          break;
        case 'trello':
          await connectTrello();
          break;
        case 'github':
          await connectGitHub();
          break;
        case 'jira':
          await connectJira();
          break;
      }

      setIntegrations(prev =>
        prev.map(int => int.type === type ? { ...int, connected: true, lastSync: new Date() } : int)
      );
    } catch (error) {
      console.error(`Failed to connect ${type}:`, error);
      alert(`Failed to connect to ${type}`);
    } finally {
      setSyncing(null);
    }
  }, []);

  const disconnectIntegration = useCallback(async (type: IntegrationType) => {
    setIntegrations(prev =>
      prev.map(int => int.type === type ? { ...int, connected: false, lastSync: undefined } : int)
    );
    setExternalEvents(prev => prev.filter(e => e.source !== type));
  }, []);

  const syncIntegration = useCallback(async (type: IntegrationType) => {
    setSyncing(type);

    try {
      let events: ExternalEvent[] = [];

      switch (type) {
        case 'google':
          events = await syncGoogleCalendar();
          break;
        case 'outlook':
          events = await syncOutlook();
          break;
        case 'slack':
          events = await syncSlack();
          break;
        case 'trello':
          events = await syncTrello();
          break;
        case 'github':
          events = await syncGitHub();
          break;
        case 'jira':
          events = await syncJira();
          break;
      }

      setExternalEvents(prev => {
        const filtered = prev.filter(e => e.source !== type);
        return [...filtered, ...events];
      });

      setIntegrations(prev =>
        prev.map(int => int.type === type ? { ...int, lastSync: new Date() } : int)
      );
    } catch (error) {
      console.error(`Failed to sync ${type}:`, error);
      alert(`Failed to sync with ${type}`);
    } finally {
      setSyncing(null);
    }
  }, []);

  const exportTasks = useCallback(async (type: IntegrationType) => {
    setSyncing(type);

    try {
      switch (type) {
        case 'google':
          await exportToGoogleCalendar(tasks);
          break;
        case 'outlook':
          await exportToOutlook(tasks);
          break;
        case 'slack':
          await exportToSlack(tasks);
          break;
        case 'trello':
          await exportToTrello(tasks);
          break;
        case 'github':
          await exportToGitHub(tasks);
          break;
        case 'jira':
          await exportToJira(tasks);
          break;
      }

      alert(`Tasks exported to ${type} successfully`);
    } catch (error) {
      console.error(`Failed to export to ${type}:`, error);
      alert(`Failed to export to ${type}`);
    } finally {
      setSyncing(null);
    }
  }, [tasks]);

  const importTasks = useCallback(async (type: IntegrationType) => {
    setSyncing(type);

    try {
      let importedTasks: Task[] = [];

      switch (type) {
        case 'google':
          importedTasks = await importFromGoogleCalendar();
          break;
        case 'outlook':
          importedTasks = await importFromOutlook();
          break;
        case 'slack':
          importedTasks = await importFromSlack();
          break;
        case 'trello':
          importedTasks = await importFromTrello();
          break;
        case 'github':
          importedTasks = await importFromGitHub();
          break;
        case 'jira':
          importedTasks = await importFromJira();
          break;
      }

      onTaskImport?.(importedTasks);
      alert(`Imported ${importedTasks.length} tasks from ${type}`);
    } catch (error) {
      console.error(`Failed to import from ${type}:`, error);
      alert(`Failed to import from ${type}`);
    } finally {
      setSyncing(null);
    }
  }, [onTaskImport]);

  const getIntegrationIcon = (type: IntegrationType): string => {
    const icons = {
      google: '📅',
      outlook: '📧',
      slack: '💬',
      trello: '📋',
      github: '🐙',
      jira: '📊'
    };
    return icons[type];
  };

  const connectGoogleCalendar = async () => {
    const authUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const params = new URLSearchParams({
      client_id: 'YOUR_CLIENT_ID',
      redirect_uri: window.location.origin,
      response_type: 'token',
      scope: 'https://www.googleapis.com/auth/calendar'
    });
    window.location.href = `${authUrl}?${params}`;
  };

  const connectOutlook = async () => {
    console.log('Connecting to Outlook...');
  };

  const connectSlack = async () => {
    console.log('Connecting to Slack...');
  };

  const connectTrello = async () => {
    console.log('Connecting to Trello...');
  };

  const connectGitHub = async () => {
    console.log('Connecting to GitHub...');
  };

  const connectJira = async () => {
    console.log('Connecting to Jira...');
  };

  const syncGoogleCalendar = async (): Promise<ExternalEvent[]> => {
    return [];
  };

  const syncOutlook = async (): Promise<ExternalEvent[]> => {
    return [];
  };

  const syncSlack = async (): Promise<ExternalEvent[]> => {
    return [];
  };

  const syncTrello = async (): Promise<ExternalEvent[]> => {
    return [];
  };

  const syncGitHub = async (): Promise<ExternalEvent[]> => {
    return [];
  };

  const syncJira = async (): Promise<ExternalEvent[]> => {
    return [];
  };

  const exportToGoogleCalendar = async (tasks: Task[]) => {
    console.log('Exporting to Google Calendar...');
  };

  const exportToOutlook = async (tasks: Task[]) => {
    console.log('Exporting to Outlook...');
  };

  const exportToSlack = async (tasks: Task[]) => {
    console.log('Exporting to Slack...');
  };

  const exportToTrello = async (tasks: Task[]) => {
    console.log('Exporting to Trello...');
  };

  const exportToGitHub = async (tasks: Task[]) => {
    console.log('Exporting to GitHub...');
  };

  const exportToJira = async (tasks: Task[]) => {
    console.log('Exporting to Jira...');
  };

  const importFromGoogleCalendar = async (): Promise<Task[]> => {
    return [];
  };

  const importFromOutlook = async (): Promise<Task[]> => {
    return [];
  };

  const importFromSlack = async (): Promise<Task[]> => {
    return [];
  };

  const importFromTrello = async (): Promise<Task[]> => {
    return [];
  };

  const importFromGitHub = async (): Promise<Task[]> => {
    return [];
  };

  const importFromJira = async (): Promise<Task[]> => {
    return [];
  };

  return (
    <div className="third-party-integration">
      <div className="integration-header mb-6">
        <h2 className="text-xl font-bold mb-4">Third-Party Integrations</h2>
        <p className="text-gray-600 text-sm">
          Connect your favorite tools to sync tasks and events
        </p>
      </div>

      <div className="integrations-grid grid grid-cols-2 gap-4 mb-6">
        {integrations.map(integration => (
          <div
            key={integration.type}
            className={`
              integration-card p-4 rounded-lg border-2
              ${integration.connected ? 'border-green-400 bg-green-50' : 'border-gray-200 bg-white'}
            `}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getIntegrationIcon(integration.type)}</span>
                <div>
                  <h3 className="font-semibold">{integration.name}</h3>
                  <div className="text-xs text-gray-500">
                    {integration.connected ? 'Connected' : 'Not connected'}
                  </div>
                </div>
              </div>
              {integration.connected && (
                <div className="w-3 h-3 bg-green-500 rounded-full" />
              )}
            </div>

            <div className="flex gap-2">
              {integration.connected ? (
                <>
                  <button
                    onClick={() => syncIntegration(integration.type)}
                    disabled={syncing === integration.type}
                    className="flex-1 px-3 py-1.5 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                  >
                    {syncing === integration.type ? 'Syncing...' : 'Sync'}
                  </button>
                  <button
                    onClick={() => disconnectIntegration(integration.type)}
                    className="px-3 py-1.5 bg-red-500 text-white rounded text-sm hover:bg-red-600"
                  >
                    Disconnect
                  </button>
                </>
              ) : (
                <button
                  onClick={() => connectIntegration(integration.type)}
                  disabled={syncing === integration.type}
                  className="flex-1 px-3 py-1.5 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
                >
                  {syncing === integration.type ? 'Connecting...' : 'Connect'}
                </button>
              )}
            </div>

            {integration.lastSync && (
              <div className="text-xs text-gray-500 mt-2">
                Last sync: {integration.lastSync.toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="integration-actions mb-6">
        <h3 className="font-semibold mb-3">Import / Export Tasks</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-50 rounded">
            <h4 className="font-medium mb-2">Import Tasks</h4>
            <div className="space-y-2">
              {integrations.filter(i => i.connected).map(integration => (
                <button
                  key={integration.type}
                  onClick={() => importTasks(integration.type)}
                  disabled={syncing === integration.type}
                  className="w-full px-3 py-2 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
                >
                  Import from {integration.name}
                </button>
              ))}
              {integrations.filter(i => i.connected).length === 0 && (
                <div className="text-sm text-gray-500">
                  Connect an integration to import tasks
                </div>
              )}
            </div>
          </div>

          <div className="p-4 bg-gray-50 rounded">
            <h4 className="font-medium mb-2">Export Tasks</h4>
            <div className="space-y-2">
              {integrations.filter(i => i.connected).map(integration => (
                <button
                  key={integration.type}
                  onClick={() => exportTasks(integration.type)}
                  disabled={syncing === integration.type}
                  className="w-full px-3 py-2 bg-green-500 text-white rounded text-sm hover:bg-green-600 disabled:opacity-50"
                >
                  Export to {integration.name}
                </button>
              ))}
              {integrations.filter(i => i.connected).length === 0 && (
                <div className="text-sm text-gray-500">
                  Connect an integration to export tasks
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {externalEvents.length > 0 && (
        <div className="external-events">
          <h3 className="font-semibold mb-3">External Events</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {externalEvents.map(event => (
              <div key={event.id} className="p-3 bg-white rounded border">
                <div className="flex items-start gap-2">
                  <span>{getIntegrationIcon(event.source)}</span>
                  <div className="flex-1">
                    <div className="font-medium">{event.title}</div>
                    <div className="text-sm text-gray-500">
                      {event.start.toLocaleString()}
                      {event.end && ` - ${event.end.toLocaleString()}`}
                    </div>
                    {event.description && (
                      <div className="text-sm text-gray-600 mt-1">{event.description}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ThirdPartyIntegration;
