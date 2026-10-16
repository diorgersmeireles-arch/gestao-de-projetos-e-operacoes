import { useState } from 'react';
import { IMPACT_LABEL, RISK_STATUS_LABEL, type Level, type Project, type Risk } from '../../domain/types';
import { uid } from '../../domain/rules';
import { Field, Sheet } from '../../components/ui';

export function RiskForm({ project, risk, onSave, onClose }: {
  project: Project; risk?: Risk; onSave: (r: Risk) => void; onClose: () => void;
}) {
  const [title, setTitle] = useState(risk?.title ?? '');
  const [impact, setImpact] = useState<Level>(risk?.impact ?? 'medio');
  const [owner, setOwner] = useState(risk?.owner ?? project.teams[0] ?? '');
  const [response, setResponse] = useState(risk?.response ?? '');
  const [status, setStatus] = useState<Risk['status']>(risk?.status ?? 'aberto');
  const [error, setError] = useState('');

  const save = () => {
    if (!title.trim()) return setError('Descreva o risco.');
    onSave({ id: risk?.id ?? uid(), title: title.trim(), impact, owner, response: response.trim(), status });
  };

  return (
    <Sheet title={risk ? 'Editar risco' : 'Novo risco'} onClose={onClose}
      footer={<><button className="btn ghost" onClick={onClose}>Cancelar</button><button className="btn" onClick={save}>Salvar</button></>}>
      <div className="form">
        <Field label="Descrição"><textarea rows={3} value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <div className="grid2">
          <Field label="Impacto">
            <select value={impact} onChange={(e) => setImpact(e.target.value as Level)}>
              {(Object.keys(IMPACT_LABEL) as Level[]).map((l) => <option key={l} value={l}>{IMPACT_LABEL[l]}</option>)}
            </select>
          </Field>
          <Field label="Situação">
            <select value={status} onChange={(e) => setStatus(e.target.value as Risk['status'])}>
              {(Object.keys(RISK_STATUS_LABEL) as Risk['status'][]).map((s) => <option key={s} value={s}>{RISK_STATUS_LABEL[s]}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Responsável">
          <select value={owner} onChange={(e) => setOwner(e.target.value)}>
            {project.teams.map((p) => <option key={p}>{p}</option>)}
            {owner && !project.teams.includes(owner) && <option>{owner}</option>}
          </select>
        </Field>
        <Field label="Plano de resposta"><textarea rows={3} value={response} onChange={(e) => setResponse(e.target.value)} /></Field>
        {error && <div className="alert bad">{error}</div>}
      </div>
    </Sheet>
  );
}
