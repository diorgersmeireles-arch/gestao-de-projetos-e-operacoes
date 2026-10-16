import { useState, type ReactNode } from 'react';
import { fmtDate, fmtFull, uid } from '../../domain/rules';
import { isValidData } from '../../data/store';
import {
  IMPACT_LABEL, LEVEL_LABEL, RISK_STATUS_LABEL,
  type AppData, type Project, type Risk, type ScheduleItem, type Task,
} from '../../domain/types';
import { Badge, Empty, Field, Icon, SectionTitle, StatusBadge } from '../../components/ui';
import { TaskForm } from '../tasks/TaskForm';
import { RiskForm } from '../risks/RiskForm';
import { SlotForm } from '../event/SlotForm';

type Section = 'projetos' | 'estrutura' | 'tarefas' | 'riscos' | 'roteiro' | 'dados';

const SECTIONS: { id: Section; label: string; icon: string }[] = [
  { id: 'projetos', label: 'Projetos', icon: 'folder' },
  { id: 'estrutura', label: 'Equipes e fases', icon: 'users' },
  { id: 'tarefas', label: 'Tarefas', icon: 'tasks' },
  { id: 'riscos', label: 'Riscos', icon: 'risk' },
  { id: 'roteiro', label: 'Roteiro', icon: 'clock' },
  { id: 'dados', label: 'Dados', icon: 'db' },
];

interface Props {
  data: AppData;
  setData: (fn: (d: AppData) => AppData) => void;
  project: Project;
  update: (fn: (p: Project) => Project) => void;
  resetAll: () => void;
  onReplaceAll: (d: AppData) => void;
}

export default function Admin(props: Props) {
  const [section, setSection] = useState<Section>('projetos');
  return (
    <div className="stack">
      <div className="admin-banner"><Icon name="lock" size={16} /> Área de administração — alterações aqui editam o planejamento do projeto.</div>
      <div className="chips">
        {SECTIONS.map((s) => (
          <button key={s.id} className={section === s.id ? 'chip on' : 'chip'} onClick={() => setSection(s.id)}>
            <Icon name={s.icon} size={16} /> {s.label}
          </button>
        ))}
      </div>
      {section === 'projetos' && <Projects {...props} />}
      {section === 'estrutura' && <Structure {...props} />}
      {section === 'tarefas' && <Tasks {...props} />}
      {section === 'riscos' && <Risks {...props} />}
      {section === 'roteiro' && <Schedule {...props} />}
      {section === 'dados' && <DataTools {...props} />}
    </div>
  );
}

function Row({ children, onEdit, onDelete }: { children: ReactNode; onEdit?: () => void; onDelete?: () => void }) {
  return (
    <div className="admin-row">
      <div className="admin-row-body">{children}</div>
      {onEdit && <button className="icon-btn" onClick={onEdit} aria-label="Editar"><Icon name="edit" /></button>}
      {onDelete && <button className="icon-btn danger" onClick={onDelete} aria-label="Excluir"><Icon name="trash" /></button>}
    </div>
  );
}

/* ---------- Projetos ---------- */

function Projects({ data, setData, project, update }: Props) {
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [date, setDate] = useState('');

  const create = (copy: boolean) => {
    if (!name.trim()) return;
    const base: Project = copy
      ? {
        ...structuredClone(project),
        tasks: project.tasks.map((t) => ({
          ...structuredClone(t), status: 'planejada', blockReason: undefined, evidence: [], history: [],
          criteria: t.criteria.map((c) => ({ ...c, done: false })),
        })),
        risks: project.risks.map((r) => ({ ...structuredClone(r), status: 'aberto' })),
        schedule: project.schedule.map((s) => ({ ...s, done: false })),
      }
      : {
        id: '', name: '', objective: '', eventDate: '', teams: ['Coordenação'],
        phases: ['Planejamento', 'Execução', 'Encerramento'], tasks: [], risks: [], schedule: [],
      };
    const np: Project = { ...base, id: uid(), name: name.trim(), eventDate: date };
    setData((d) => ({ projects: [...d.projects, np], activeId: np.id }));
    setName(''); setDate(''); setCreating(false);
  };

  const remove = (p: Project) => {
    if (data.projects.length === 1) return window.alert('Não é possível excluir o único projeto.');
    if (!window.confirm(`Excluir o projeto "${p.name}" e todos os seus dados?`)) return;
    setData((d) => {
      const rest = d.projects.filter((x) => x.id !== p.id);
      return { projects: rest, activeId: d.activeId === p.id ? rest[0].id : d.activeId };
    });
  };

  return (
    <>
      <section className="card form">
        <SectionTitle>Dados do projeto ativo</SectionTitle>
        <Field label="Nome"><input value={project.name} onChange={(e) => update((p) => ({ ...p, name: e.target.value }))} /></Field>
        <Field label="Objetivo">
          <textarea rows={3} value={project.objective} onChange={(e) => update((p) => ({ ...p, objective: e.target.value }))} />
        </Field>
        <Field label="Data do evento / entrega final">
          <input type="date" value={project.eventDate} onChange={(e) => update((p) => ({ ...p, eventDate: e.target.value }))} />
        </Field>
      </section>

      <section className="card">
        <SectionTitle action={<button className="btn small" onClick={() => setCreating((v) => !v)}><Icon name="plus" size={16} /> Novo</button>}>
          Projetos ({data.projects.length})
        </SectionTitle>
        {creating && (
          <div className="form inset">
            <Field label="Nome do novo projeto"><input value={name} onChange={(e) => setName(e.target.value)} /></Field>
            <Field label="Data do evento"><input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
            <div className="btn-row">
              <button className="btn" onClick={() => create(false)}>Criar em branco</button>
              <button className="btn ghost" onClick={() => create(true)}>Duplicar estrutura do ativo</button>
            </div>
            <p className="muted small">Duplicar copia tarefas, riscos e roteiro com o andamento zerado, útil para reaproveitar um modelo.</p>
          </div>
        )}
        {data.projects.map((p) => (
          <Row key={p.id} onDelete={() => remove(p)}>
            <button className="proj" onClick={() => setData((d) => ({ ...d, activeId: p.id }))}>
              <b>{p.name || 'Sem nome'}</b>
              <span className="muted small">{p.tasks.length} tarefas · {fmtFull(p.eventDate)}</span>
              {p.id === project.id && <Badge tone="ok">Ativo</Badge>}
            </button>
          </Row>
        ))}
      </section>
    </>
  );
}

/* ---------- Equipes e fases ---------- */

function Structure({ project, update }: Props) {
  return (
    <div className="cols">
      <ListEditor
        title="Equipes"
        items={project.teams}
        usage={(n) => project.tasks.filter((t) => t.owner === n).length + project.risks.filter((r) => r.owner === n).length}
        onAdd={(n) => update((p) => ({ ...p, teams: [...p.teams, n] }))}
        onRename={(o, n) => update((p) => ({
          ...p,
          teams: p.teams.map((x) => (x === o ? n : x)),
          tasks: p.tasks.map((t) => (t.owner === o ? { ...t, owner: n } : t)),
          risks: p.risks.map((r) => (r.owner === o ? { ...r, owner: n } : r)),
          schedule: p.schedule.map((s) => (s.owner === o ? { ...s, owner: n } : s)),
        }))}
        onRemove={(n) => update((p) => ({ ...p, teams: p.teams.filter((x) => x !== n) }))}
      />
      <ListEditor
        title="Fases (EAP)"
        items={project.phases}
        usage={(n) => project.tasks.filter((t) => t.phase === n).length}
        onAdd={(n) => update((p) => ({ ...p, phases: [...p.phases, n] }))}
        onRename={(o, n) => update((p) => ({
          ...p,
          phases: p.phases.map((x) => (x === o ? n : x)),
          tasks: p.tasks.map((t) => (t.phase === o ? { ...t, phase: n } : t)),
        }))}
        onRemove={(n) => update((p) => ({ ...p, phases: p.phases.filter((x) => x !== n) }))}
      />
    </div>
  );
}

function ListEditor({ title, items, usage, onAdd, onRename, onRemove }: {
  title: string; items: string[]; usage: (n: string) => number;
  onAdd: (n: string) => void; onRename: (o: string, n: string) => void; onRemove: (n: string) => void;
}) {
  const [text, setText] = useState('');
  const add = () => {
    const n = text.trim();
    if (!n || items.includes(n)) return;
    onAdd(n); setText('');
  };
  const rename = (o: string) => {
    const n = window.prompt('Novo nome:', o)?.trim();
    if (n && n !== o && !items.includes(n)) onRename(o, n);
  };
  const remove = (n: string) => {
    const u = usage(n);
    if (u > 0) return window.alert(`"${n}" está em uso por ${u} item(ns). Reatribua antes de excluir.`);
    if (window.confirm(`Excluir "${n}"?`)) onRemove(n);
  };
  return (
    <section className="card">
      <SectionTitle>{title}</SectionTitle>
      <div className="inline-add">
        <input aria-label={`Nome para adicionar em ${title}`} placeholder="Adicionar…" value={text}
          onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} />
        <button className="btn small" onClick={add} aria-label="Adicionar"><Icon name="plus" size={16} /></button>
      </div>
      {items.length === 0 && <Empty>Nada cadastrado.</Empty>}
      {items.map((n) => (
        <Row key={n} onEdit={() => rename(n)} onDelete={() => remove(n)}>
          <b>{n}</b> <span className="muted small">· {usage(n)} em uso</span>
        </Row>
      ))}
    </section>
  );
}

/* ---------- Tarefas ---------- */

function Tasks({ project, update }: Props) {
  const [editing, setEditing] = useState<Task | 'new' | null>(null);

  const save = (t: Task) => {
    update((p) => ({
      ...p,
      tasks: p.tasks.some((x) => x.id === t.id) ? p.tasks.map((x) => (x.id === t.id ? t : x)) : [...p.tasks, t],
    }));
    setEditing(null);
  };
  const remove = (t: Task) => {
    if (!window.confirm(`Excluir a tarefa ${t.code}? Ela será removida das dependências de outras tarefas.`)) return;
    update((p) => ({
      ...p,
      tasks: p.tasks.filter((x) => x.id !== t.id).map((x) => ({ ...x, deps: x.deps.filter((d) => d !== t.id) })),
    }));
  };

  return (
    <section className="card">
      <SectionTitle action={<button className="btn small" onClick={() => setEditing('new')}><Icon name="plus" size={16} /> Nova</button>}>
        Tarefas ({project.tasks.length})
      </SectionTitle>
      {project.tasks.length === 0 && <Empty>Nenhuma tarefa. Crie a primeira.</Empty>}
      {[...project.tasks].sort((a, b) => a.due.localeCompare(b.due)).map((t) => (
        <Row key={t.id} onEdit={() => setEditing(t)} onDelete={() => remove(t)}>
          <div className="admin-title"><b>{t.code}</b> {t.title}</div>
          <div className="admin-meta">
            <StatusBadge status={t.status} />
            <span className="muted small">{t.owner} · {fmtDate(t.due)} · prioridade {LEVEL_LABEL[t.priority].toLowerCase()}</span>
          </div>
        </Row>
      ))}
      {editing && (
        <TaskForm project={project} task={editing === 'new' ? undefined : editing} onSave={save} onClose={() => setEditing(null)} />
      )}
    </section>
  );
}

/* ---------- Riscos ---------- */

function Risks({ project, update }: Props) {
  const [editing, setEditing] = useState<Risk | 'new' | null>(null);
  const save = (r: Risk) => {
    update((p) => ({
      ...p,
      risks: p.risks.some((x) => x.id === r.id) ? p.risks.map((x) => (x.id === r.id ? r : x)) : [...p.risks, r],
    }));
    setEditing(null);
  };
  const remove = (r: Risk) => {
    if (window.confirm('Excluir este risco?')) update((p) => ({ ...p, risks: p.risks.filter((x) => x.id !== r.id) }));
  };
  return (
    <section className="card">
      <SectionTitle action={<button className="btn small" onClick={() => setEditing('new')}><Icon name="plus" size={16} /> Novo</button>}>
        Riscos ({project.risks.length})
      </SectionTitle>
      {project.risks.length === 0 && <Empty>Nenhum risco cadastrado.</Empty>}
      {project.risks.map((r) => (
        <Row key={r.id} onEdit={() => setEditing(r)} onDelete={() => remove(r)}>
          <div className="admin-title">{r.title}</div>
          <div className="muted small">Impacto {IMPACT_LABEL[r.impact].toLowerCase()} · {RISK_STATUS_LABEL[r.status].toLowerCase()} · {r.owner}</div>
        </Row>
      ))}
      {editing && (
        <RiskForm project={project} risk={editing === 'new' ? undefined : editing} onSave={save} onClose={() => setEditing(null)} />
      )}
    </section>
  );
}

/* ---------- Roteiro ---------- */

function Schedule({ project, update }: Props) {
  const [editing, setEditing] = useState<ScheduleItem | 'new' | null>(null);
  const save = (s: ScheduleItem) => {
    update((p) => ({
      ...p,
      schedule: p.schedule.some((x) => x.id === s.id) ? p.schedule.map((x) => (x.id === s.id ? s : x)) : [...p.schedule, s],
    }));
    setEditing(null);
  };
  const remove = (s: ScheduleItem) => {
    if (window.confirm('Excluir este item do roteiro?')) update((p) => ({ ...p, schedule: p.schedule.filter((x) => x.id !== s.id) }));
  };
  return (
    <section className="card">
      <SectionTitle action={<button className="btn small" onClick={() => setEditing('new')}><Icon name="plus" size={16} /> Novo</button>}>
        Roteiro do evento ({project.schedule.length})
      </SectionTitle>
      {project.schedule.length === 0 && <Empty>Roteiro vazio.</Empty>}
      {[...project.schedule].sort((a, b) => a.time.localeCompare(b.time)).map((s) => (
        <Row key={s.id} onEdit={() => setEditing(s)} onDelete={() => remove(s)}>
          <div className="admin-title"><b>{s.time}</b> {s.title}</div>
          <div className="muted small">{s.owner}</div>
        </Row>
      ))}
      {project.schedule.some((s) => s.done) && (
        <button className="btn ghost" onClick={() => update((p) => ({ ...p, schedule: p.schedule.map((s) => ({ ...s, done: false })) }))}>
          Reiniciar marcações do dia
        </button>
      )}
      {editing && (
        <SlotForm project={project} slot={editing === 'new' ? undefined : editing} onSave={save} onClose={() => setEditing(null)} />
      )}
    </section>
  );
}

/* ---------- Dados ---------- */

function DataTools({ data, resetAll, onReplaceAll }: Props) {
  const [text, setText] = useState('');
  const [msg, setMsg] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null);

  const exportJson = async () => {
    const json = JSON.stringify(data, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      setMsg({ tone: 'ok', text: 'Backup copiado. Cole em uma mensagem ou e-mail para guardar.' });
    } catch {
      setText(json);
      setMsg({ tone: 'ok', text: 'Copie o texto abaixo para guardar o backup.' });
    }
  };
  const importJson = () => {
    try {
      const d = JSON.parse(text) as AppData;
      if (!isValidData(d)) throw new Error();
      if (!window.confirm('Substituir todos os dados atuais pelo backup?')) return;
      onReplaceAll({ ...d, activeId: d.projects.some((p) => p.id === d.activeId) ? d.activeId : d.projects[0].id });
      setText('');
      setMsg({ tone: 'ok', text: 'Backup restaurado.' });
    } catch {
      setMsg({ tone: 'bad', text: 'Texto inválido: cole o backup completo.' });
    }
  };

  return (
    <>
      <section className="card form">
        <SectionTitle>Backup e restauração</SectionTitle>
        <p className="muted">Os dados ficam apenas neste aparelho. Faça backup antes de trocar de celular ou reinstalar o app.</p>
        <button className="btn" onClick={exportJson}><Icon name="copy" size={18} /> Copiar backup</button>
        <Field label="Restaurar a partir de um backup">
          <textarea rows={4} placeholder="Cole aqui o backup" value={text} onChange={(e) => setText(e.target.value)} />
        </Field>
        <button className="btn ghost" onClick={importJson}>Restaurar backup</button>
        {msg && <div className={`alert ${msg.tone}`}>{msg.text}</div>}
      </section>
      <section className="card form">
        <SectionTitle>Zona de risco</SectionTitle>
        <p className="muted">Apaga todos os projetos e volta ao exemplo da Mostra de Curtas.</p>
        <button className="btn danger" onClick={() => window.confirm('Apagar TODOS os dados?') && resetAll()}>
          Restaurar dados de exemplo
        </button>
      </section>
    </>
  );
}
