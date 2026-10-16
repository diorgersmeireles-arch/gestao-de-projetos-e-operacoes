import { useState } from 'react';
import { fmtDate, isLate, openDeps } from '../../domain/rules';
import { LEVEL_LABEL, STATUSES, STATUS_LABEL, type Project, type Status, type Task } from '../../domain/types';
import { Empty, Fab, Icon, Progress, StatusBadge } from '../../components/ui';

export function TaskList({ p, onOpen, onCreate }: { p: Project; onOpen: (id: string) => void; onCreate: () => void }) {
  const [filter, setFilter] = useState<'todas' | 'atrasadas' | Status>('todas');
  const [q, setQ] = useState('');
  const [team, setTeam] = useState('');

  const list = p.tasks
    .filter((t) => filter === 'todas' || (filter === 'atrasadas' ? isLate(t) : t.status === filter))
    .filter((t) => !team || t.owner === team)
    .filter((t) => !q || `${t.code} ${t.title} ${t.owner}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.due.localeCompare(b.due));
  const phases = [...new Set(list.map((t) => t.phase))].sort((a, b) => p.phases.indexOf(a) - p.phases.indexOf(b));

  return (
    <div className="stack">
      <div className="toolbar">
        <div className="search"><Icon name="search" size={18} />
          <input aria-label="Buscar tarefas" placeholder="Buscar por código, título ou equipe" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select value={team} onChange={(e) => setTeam(e.target.value)} aria-label="Equipe">
          <option value="">Todas as equipes</option>
          {p.teams.map((t) => <option key={t}>{t}</option>)}
        </select>
      </div>
      <div className="chips">
        {(['todas', 'atrasadas', ...STATUSES] as const).map((f) => (
          <button key={f} className={filter === f ? 'chip on' : 'chip'} onClick={() => setFilter(f)}>
            {f === 'todas' ? 'Todas' : f === 'atrasadas' ? 'Atrasadas' : STATUS_LABEL[f]}
            <small>{f === 'todas' ? p.tasks.length : f === 'atrasadas' ? p.tasks.filter(isLate).length : p.tasks.filter((t) => t.status === f).length}</small>
          </button>
        ))}
      </div>
      {list.length === 0 && (
        p.tasks.length === 0
          ? <Empty icon="tasks" action={<button className="btn" onClick={onCreate}>Criar primeira tarefa</button>}>
              Este projeto ainda não tem tarefas. Comece pela primeira entrega e defina quem é o responsável.
            </Empty>
          : <Empty icon="search" action={<button className="btn ghost" onClick={() => { setFilter('todas'); setQ(''); setTeam(''); }}>Limpar filtros</button>}>
              Nenhuma tarefa com esses filtros.
            </Empty>
      )}
      {phases.map((ph) => (
        <section key={ph} className="stack tight">
          <h4 className="phase">{ph}</h4>
          {list.filter((t) => t.phase === ph).map((t) => <TaskRow key={t.id} p={p} t={t} onOpen={onOpen} />)}
        </section>
      ))}
      <div className="fab-space" aria-hidden="true" />
      <Fab label="Nova tarefa" onClick={onCreate} />
    </div>
  );
}

function TaskRow({ p, t, onOpen }: { p: Project; t: Task; onOpen: (id: string) => void }) {
  const waiting = t.status !== 'concluida' && openDeps(p, t).length > 0;
  const done = t.criteria.filter((c) => c.done).length;
  return (
    <button className={`card task prio-${t.priority}`} onClick={() => onOpen(t.id)}>
      <div className="row-between">
        <span className="code">{t.code}</span>
        <StatusBadge status={t.status} />
      </div>
      <div className="task-title">{t.title}</div>
      <div className="task-meta">
        <span>{t.owner}</span>
        <span className={isLate(t) ? 'txt-bad' : ''}>{isLate(t) ? 'Atrasada · prazo' : 'Prazo'} {fmtDate(t.due)}</span>
        <span>Prioridade {LEVEL_LABEL[t.priority].toLowerCase()}</span>
        {waiting && <span className="txt-warn">Aguarda dependência</span>}
      </div>
      {t.criteria.length > 0 && (
        <div className="task-prog"><Progress value={(done / t.criteria.length) * 100} /><small>{done}/{t.criteria.length}</small></div>
      )}
    </button>
  );
}
