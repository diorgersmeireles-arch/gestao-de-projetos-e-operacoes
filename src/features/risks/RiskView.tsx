import { useState } from 'react';
import { IMPACT_LABEL, RISK_STATUS_LABEL, type Project, type Risk } from '../../domain/types';
import { Badge, Empty, Fab } from '../../components/ui';
import { RiskForm } from './RiskForm';

const IMPACT_TONE = { alto: 'bad', medio: 'warn', baixo: 'ok' } as const;
const RISK_TONE = { aberto: 'info', mitigado: 'ok', ocorrido: 'bad' } as const;

export function RiskView({ p, update }: { p: Project; update: (fn: (p: Project) => Project) => void }) {
  const [editing, setEditing] = useState<Risk | 'new' | null>(null);
  const order = { alto: 0, medio: 1, baixo: 2 };
  const list = [...p.risks].sort((a, b) =>
    (a.status === 'mitigado' ? 1 : 0) - (b.status === 'mitigado' ? 1 : 0) || order[a.impact] - order[b.impact]);

  const save = (r: Risk) => {
    update((pr) => ({
      ...pr,
      risks: pr.risks.some((x) => x.id === r.id) ? pr.risks.map((x) => (x.id === r.id ? r : x)) : [r, ...pr.risks],
    }));
    setEditing(null);
  };

  return (
    <div className="stack">
      <p className="muted">{p.risks.filter((r) => r.status !== 'mitigado').length} riscos em aberto ou ocorridos</p>
      {list.length === 0 && (
        <Empty icon="risk" action={<button className="btn" onClick={() => setEditing('new')}>Registrar primeiro risco</button>}>
          Nenhum risco cadastrado. Pense no que pode dar errado no evento e defina um plano de resposta.
        </Empty>
      )}
      {list.map((r) => (
        <button key={r.id} className={`card risk imp-${r.impact}`} onClick={() => setEditing(r)}>
          <div className="row-between">
            <Badge tone={IMPACT_TONE[r.impact]}>Impacto {IMPACT_LABEL[r.impact].toLowerCase()}</Badge>
            <Badge tone={RISK_TONE[r.status]}>{RISK_STATUS_LABEL[r.status]}</Badge>
          </div>
          <div className="task-title">{r.title}</div>
          <div className="muted small">Responsável: {r.owner}</div>
          {r.response && <div className="muted small">Resposta: {r.response}</div>}
        </button>
      ))}
      <div className="fab-space" aria-hidden="true" />
      <Fab label="Novo risco" onClick={() => setEditing('new')} />
      {editing && (
        <RiskForm project={p} risk={editing === 'new' ? undefined : editing} onSave={save} onClose={() => setEditing(null)} />
      )}
    </div>
  );
}
