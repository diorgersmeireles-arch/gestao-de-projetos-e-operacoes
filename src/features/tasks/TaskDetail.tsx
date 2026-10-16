import { useState } from 'react';
import { canMove, fmtDate, fmtDateTime, isLate, logged, stamp, statusChange } from '../../domain/rules';
import { LEVEL_LABEL, type Project, type Status, type Task } from '../../domain/types';
import { Badge, Empty, Icon, Progress, Sheet, Stepper, StatusBadge } from '../../components/ui';
import { TaskForm } from './TaskForm';

export function TaskDetail({ p, task, onClose, patch, onOpen, onSaveEdit, onCelebrate }: {
  p: Project; task: Task; onClose: () => void; patch: (fn: (t: Task) => Task) => void;
  onOpen: (id: string) => void; onSaveEdit: (t: Task) => void; onCelebrate: (text: string) => void;
}) {
  const [evText, setEvText] = useState('');
  const [reason, setReason] = useState(task.blockReason ?? '');
  const [msg, setMsg] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null);
  const [editing, setEditing] = useState(false);
  const deps = task.deps.map((id) => p.tasks.find((x) => x.id === id)).filter((d): d is Task => !!d);

  const move = (to: Status) => {
    const trimmed = reason.trim();
    const err = canMove(p, to === 'bloqueada' ? { ...task, blockReason: trimmed } : task, to);
    if (err) return setMsg({ tone: 'bad', text: err });
    setMsg(null);
    patch((t) => logged(
      { ...t, status: to, blockReason: to === 'bloqueada' ? trimmed : undefined },
      `${statusChange(t.status, to)}${to === 'bloqueada' ? ` (${trimmed})` : ''}`,
    ));
    if (to === 'concluida') {
      const done = p.tasks.filter((t) => t.status === 'concluida').length + 1;
      const left = p.tasks.length - done;
      onCelebrate(left === 0
        ? `Projeto completo! Todas as ${p.tasks.length} entregas foram concluídas.`
        : `${task.code} concluída. ${done} de ${p.tasks.length} entregas prontas, faltam ${left}.`);
    }
  };

  const toggle = (i: number) =>
    patch((t) => ({ ...t, criteria: t.criteria.map((c, k) => (k === i ? { ...c, done: !c.done } : c)) }));

  const addEvidence = () => {
    const text = evText.trim();
    if (!text) return;
    patch((t) => logged({ ...t, evidence: [{ text, by: t.owner, at: stamp() }, ...t.evidence] }, 'Evidência registrada'));
    setEvText('');
  };

  const copy = async () => {
    const txt = `${task.code} — ${task.title}\n` + task.criteria.map((c) => `${c.done ? '[x]' : '[ ]'} ${c.text}`).join('\n');
    try {
      await navigator.clipboard.writeText(txt);
      setMsg({ tone: 'ok', text: 'Checklist copiado.' });
    } catch {
      setMsg({ tone: 'bad', text: 'Não foi possível copiar neste dispositivo.' });
    }
  };

  const actions: { to: Status; label: string; primary?: boolean }[] =
    task.status === 'planejada' ? [{ to: 'andamento', label: 'Iniciar', primary: true }, { to: 'bloqueada', label: 'Bloquear' }]
    : task.status === 'andamento' ? [{ to: 'validacao', label: 'Enviar para validação', primary: true }, { to: 'bloqueada', label: 'Bloquear' }]
    : task.status === 'validacao' ? [{ to: 'concluida', label: 'Aprovar e concluir', primary: true }, { to: 'andamento', label: 'Reprovar' }]
    : task.status === 'bloqueada' ? [{ to: 'andamento', label: 'Desbloquear', primary: true }]
    : [{ to: 'andamento', label: 'Reabrir' }];

  return (
    <Sheet title={task.code} onClose={onClose}
      footer={<>{actions.map((a) => (
        <button key={a.label} className={a.primary ? 'btn' : 'btn ghost'} onClick={() => move(a.to)}>{a.label}</button>
      ))}</>}>
      <div className="stack">
        <div>
          <div className="row-between">
            <StatusBadge status={task.status} />
            <button className="link" onClick={() => setEditing(true)}><Icon name="edit" size={16} /> Editar</button>
          </div>
          <h2 className="detail-title">{task.title}</h2>
          <Stepper status={task.status} />
          <dl className="facts">
            <div><dt>Fase</dt><dd>{task.phase}</dd></div>
            <div><dt>Responsável</dt><dd>{task.owner}</dd></div>
            <div><dt>Aprovador</dt><dd>{task.approver || '—'}</dd></div>
            <div><dt>Prazo</dt><dd className={isLate(task) ? 'txt-bad' : ''}>{fmtDate(task.due)}{isLate(task) && ' · atrasada'}</dd></div>
            <div><dt>Prioridade</dt><dd>{LEVEL_LABEL[task.priority]}</dd></div>
          </dl>
          {task.status === 'bloqueada' && task.blockReason && <div className="alert bad">Bloqueada: {task.blockReason}</div>}
        </div>

        {deps.length > 0 && (
          <section className="card">
            <h4>Dependências</h4>
            {deps.map((d) => (
              <button key={d.id} className="line" onClick={() => onOpen(d.id)}>
                <span className="line-title">{d.code} · {d.title}</span><StatusBadge status={d.status} />
              </button>
            ))}
          </section>
        )}

        <section className="card">
          <div className="row-between"><h4>Critérios de conclusão</h4>
            <button className="link" onClick={copy}><Icon name="copy" size={16} /> Copiar</button></div>
          {task.criteria.length === 0 && <Empty>Sem critérios definidos.</Empty>}
          {task.criteria.map((c, i) => (
            <label key={i} className="switch">
              <input type="checkbox" checked={c.done} onChange={() => toggle(i)} />
              <span className={c.done ? 'strike' : ''}>{c.text}</span>
            </label>
          ))}
          {task.criteria.length > 0 && (
            <Progress value={(task.criteria.filter((c) => c.done).length / task.criteria.length) * 100} />
          )}
        </section>

        <section className="card">
          <div className="row-between"><h4>Evidências</h4>{task.needsEvidence && <Badge tone="warn">Obrigatória</Badge>}</div>
          {task.evidence.map((e, i) => (
            <div key={i} className="evidence">
              <div>{e.text}</div>
              <div className="muted small">{e.by} · {fmtDateTime(e.at)}</div>
            </div>
          ))}
          <textarea rows={2} aria-label="Nova evidência" placeholder="Ex.: HD entregue e recebido pela equipe do cinema às 14h."
            value={evText} onChange={(e) => setEvText(e.target.value)} />
          <button className="btn ghost" onClick={addEvidence}>Registrar evidência</button>
        </section>

        {task.status !== 'concluida' && task.status !== 'validacao' && (
          <section className="card">
            <h4>Bloqueio</h4>
            <input aria-label="Motivo do bloqueio" placeholder="Motivo (obrigatório para bloquear)" value={reason} onChange={(e) => setReason(e.target.value)} />
          </section>
        )}

        {msg && <div className={`alert ${msg.tone}`}>{msg.text}</div>}

        <section className="card">
          <h4>Histórico</h4>
          {task.history.length === 0 && <Empty>Sem alterações registradas.</Empty>}
          {task.history.map((h, i) => (
            <div key={i} className="hist"><span className="muted small">{fmtDateTime(h.at)}</span><span>{h.text}</span></div>
          ))}
        </section>
      </div>
      {editing && (
        <TaskForm project={p} task={task} onClose={() => setEditing(false)}
          onSave={(t) => { onSaveEdit(t); setEditing(false); }} />
      )}
    </Sheet>
  );
}
