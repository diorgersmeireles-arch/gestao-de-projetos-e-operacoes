import { useCallback, useState } from 'react';
import { useStore } from './data/store';
import { fmtFull } from './domain/rules';
import type { Task } from './domain/types';
import { Icon, Toast } from './components/ui';
import Dashboard from './features/dashboard/Dashboard';
import Admin from './features/admin/Admin';
import { TaskList } from './features/tasks/TaskList';
import { TaskDetail } from './features/tasks/TaskDetail';
import { TaskForm } from './features/tasks/TaskForm';
import { RiskView } from './features/risks/RiskView';
import { EventRun } from './features/event/EventRun';

type Tab = 'dashboard' | 'tarefas' | 'evento' | 'riscos' | 'admin';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard' },
  { id: 'tarefas', label: 'Tarefas', icon: 'tasks' },
  { id: 'evento', label: 'Evento', icon: 'clock' },
  { id: 'riscos', label: 'Riscos', icon: 'risk' },
  { id: 'admin', label: 'Admin', icon: 'settings' },
];

export default function App() {
  const { data, setData, project, update, resetAll } = useStore();
  const hash = window.location.hash.slice(1);
  const [tab, setTab] = useState<Tab>(TABS.some((t) => t.id === hash) ? (hash as Tab) : 'dashboard');
  const [openId, setOpenId] = useState<string | null>(hash.startsWith('t:') ? hash.slice(2) : null);
  const [creating, setCreating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const clearToast = useCallback(() => setToast(null), []);
  const openTask = project.tasks.find((t) => t.id === openId) ?? null;

  const patchTask = (id: string, fn: (t: Task) => Task) =>
    update((p) => ({ ...p, tasks: p.tasks.map((t) => (t.id === id ? fn(t) : t)) }));

  const saveTask = (t: Task) =>
    update((p) => ({ ...p, tasks: p.tasks.map((x) => (x.id === t.id ? t : x)) }));

  const title = TABS.find((t) => t.id === tab)!.label;

  return (
    <div className="shell">
      <aside className="nav">
        <div className="brand">
          <div className="logo"><Icon name="dashboard" size={18} /></div>
          <div><b>GPO</b><small>Projetos e Operações</small></div>
        </div>
        {TABS.map((t) => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>
            <Icon name={t.icon} size={22} /><span>{t.label}</span>
          </button>
        ))}
      </aside>

      <div className="content">
        <header className="top">
          <div>
            <h1>{title}</h1>
            <small>{project.name} · {fmtFull(project.eventDate)}</small>
          </div>
          {data.projects.length > 1 && (
            <select aria-label="Projeto" value={project.id}
              onChange={(e) => setData((d) => ({ ...d, activeId: e.target.value }))}>
              {data.projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
        </header>

        <main>
          {tab === 'dashboard' && <Dashboard p={project} onOpen={setOpenId} />}
          {tab === 'tarefas' && <TaskList p={project} onOpen={setOpenId} onCreate={() => setCreating(true)} />}
          {tab === 'evento' && <EventRun p={project} update={update} />}
          {tab === 'riscos' && <RiskView p={project} update={update} />}
          {tab === 'admin' && (
            <Admin data={data} setData={(fn) => setData(fn)} project={project} update={update}
              resetAll={resetAll} onReplaceAll={setData} />
          )}
        </main>
      </div>

      {openTask && (
        <TaskDetail p={project} task={openTask} onClose={() => setOpenId(null)}
          patch={(fn) => patchTask(openTask.id, fn)} onOpen={setOpenId} onSaveEdit={saveTask} onCelebrate={setToast} />
      )}
      {toast && <Toast text={toast} onDone={clearToast} />}
      {creating && (
        <TaskForm project={project} onClose={() => setCreating(false)}
          onSave={(t) => { update((p) => ({ ...p, tasks: [...p.tasks, t] })); setCreating(false); }} />
      )}
    </div>
  );
}
