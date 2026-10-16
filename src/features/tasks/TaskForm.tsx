import { useState } from 'react';
import { LEVEL_LABEL, STATUSES, STATUS_LABEL, type Level, type Project, type Task } from '../../domain/types';
import { logged, today, uid } from '../../domain/rules';
import { Field, Sheet } from '../../components/ui';

export function TaskForm({ project, task, onSave, onClose }: {
  project: Project; task?: Task; onSave: (t: Task) => void; onClose: () => void;
}) {
  const nextCode = () => {
    const n = project.tasks.length + 1;
    return `TAR-${String(n).padStart(3, '0')}`;
  };
  const [code, setCode] = useState(task?.code ?? nextCode());
  const [title, setTitle] = useState(task?.title ?? '');
  const [phase, setPhase] = useState(task?.phase ?? project.phases[0] ?? '');
  const [owner, setOwner] = useState(task?.owner ?? project.teams[0] ?? '');
  const [approver, setApprover] = useState(task?.approver ?? '');
  const [due, setDue] = useState(task?.due ?? today());
  const [priority, setPriority] = useState<Level>(task?.priority ?? 'medio');
  const [status, setStatus] = useState(task?.status ?? 'planejada');
  const [needsEvidence, setNeedsEvidence] = useState(task?.needsEvidence ?? false);
  const [criteria, setCriteria] = useState((task?.criteria ?? []).map((c) => c.text).join('\n'));
  const [deps, setDeps] = useState<string[]>(task?.deps ?? []);
  const [error, setError] = useState('');

  const others = project.tasks.filter((t) => t.id !== task?.id);

  const save = () => {
    const c = code.trim();
    if (!title.trim()) return setError('Informe o título.');
    if (!c) return setError('Informe o código.');
    if (others.some((t) => t.code === c)) return setError('Já existe uma tarefa com esse código.');
    if (!due) return setError('Informe o prazo.');
    const prev = new Map((task?.criteria ?? []).map((x) => [x.text, x.done]));
    const crit = criteria.split('\n').map((s) => s.trim()).filter(Boolean)
      .map((text) => ({ text, done: prev.get(text) ?? false }));
    let next: Task = {
      id: task?.id ?? uid(), code: c, title: title.trim(), phase, owner, approver: approver.trim(),
      due, priority, status, needsEvidence, criteria: crit, deps,
      blockReason: task?.blockReason, evidence: task?.evidence ?? [], history: task?.history ?? [],
    };
    if (!task) next = logged(next, 'Tarefa criada');
    else if (task.status !== status) next = logged(next, `Ajuste administrativo: ${STATUS_LABEL[task.status]} → ${STATUS_LABEL[status]}`);
    else next = logged(next, 'Tarefa editada');
    onSave(next);
  };

  const toggleDep = (id: string) => setDeps((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]));

  return (
    <Sheet title={task ? 'Editar tarefa' : 'Nova tarefa'} onClose={onClose}
      footer={<><button className="btn ghost" onClick={onClose}>Cancelar</button><button className="btn" onClick={save}>Salvar</button></>}>
      <div className="form">
        <Field label="Título"><input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <div className="grid2">
          <Field label="Código"><input value={code} onChange={(e) => setCode(e.target.value)} /></Field>
          <Field label="Prazo"><input type="date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>
        </div>
        <div className="grid2">
          <Field label="Fase">
            <select value={phase} onChange={(e) => setPhase(e.target.value)}>
              {project.phases.map((p) => <option key={p}>{p}</option>)}
              {phase && !project.phases.includes(phase) && <option>{phase}</option>}
            </select>
          </Field>
          <Field label="Prioridade">
            <select value={priority} onChange={(e) => setPriority(e.target.value as Level)}>
              {(Object.keys(LEVEL_LABEL) as Level[]).map((l) => <option key={l} value={l}>{LEVEL_LABEL[l]}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid2">
          <Field label="Responsável (equipe)">
            <select value={owner} onChange={(e) => setOwner(e.target.value)}>
              {project.teams.map((p) => <option key={p}>{p}</option>)}
              {owner && !project.teams.includes(owner) && <option>{owner}</option>}
            </select>
          </Field>
          <Field label="Aprovador" hint="Opcional">
            <input value={approver} onChange={(e) => setApprover(e.target.value)} />
          </Field>
        </div>
        {task && (
          <Field label="Status" hint="Alterar aqui é um ajuste administrativo e fica no histórico. O fluxo normal é feito na tela da tarefa.">
            <select value={status} onChange={(e) => setStatus(e.target.value as Task['status'])}>
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_LABEL[s]}</option>)}
            </select>
          </Field>
        )}
        <Field label="Critérios de conclusão" hint="Um critério por linha.">
          <textarea rows={5} value={criteria} onChange={(e) => setCriteria(e.target.value)} />
        </Field>
        <label className="switch">
          <input type="checkbox" checked={needsEvidence} onChange={(e) => setNeedsEvidence(e.target.checked)} />
          <span>Exigir evidência para concluir</span>
        </label>
        <Field label="Depende de">
          <div className="checklist">
            {others.length === 0 && <span className="muted">Nenhuma outra tarefa.</span>}
            {others.map((t) => (
              <label key={t.id} className="switch">
                <input type="checkbox" checked={deps.includes(t.id)} onChange={() => toggleDep(t.id)} />
                <span><b>{t.code}</b> · {t.title}</span>
              </label>
            ))}
          </div>
        </Field>
        {error && <div className="alert bad">{error}</div>}
      </div>
    </Sheet>
  );
}
