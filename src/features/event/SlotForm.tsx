import { useState } from 'react';
import type { Project, ScheduleItem } from '../../domain/types';
import { uid } from '../../domain/rules';
import { Field, Sheet } from '../../components/ui';

export function SlotForm({ project, slot, onSave, onClose }: {
  project: Project; slot?: ScheduleItem; onSave: (s: ScheduleItem) => void; onClose: () => void;
}) {
  const [time, setTime] = useState(slot?.time ?? '09:00');
  const [title, setTitle] = useState(slot?.title ?? '');
  const [owner, setOwner] = useState(slot?.owner ?? project.teams[0] ?? '');
  const [error, setError] = useState('');

  const save = () => {
    if (!title.trim()) return setError('Informe a atividade.');
    if (!time) return setError('Informe o horário.');
    onSave({ id: slot?.id ?? uid(), time, title: title.trim(), owner, done: slot?.done ?? false });
  };

  return (
    <Sheet title={slot ? 'Editar item do roteiro' : 'Novo item do roteiro'} onClose={onClose}
      footer={<><button className="btn ghost" onClick={onClose}>Cancelar</button><button className="btn" onClick={save}>Salvar</button></>}>
      <div className="form">
        <Field label="Horário"><input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></Field>
        <Field label="Atividade"><input value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
        <Field label="Responsável">
          <select value={owner} onChange={(e) => setOwner(e.target.value)}>
            {[...project.teams, 'Todos'].map((p) => <option key={p}>{p}</option>)}
            {owner && ![...project.teams, 'Todos'].includes(owner) && <option>{owner}</option>}
          </select>
        </Field>
        {error && <div className="alert bad">{error}</div>}
      </div>
    </Sheet>
  );
}
