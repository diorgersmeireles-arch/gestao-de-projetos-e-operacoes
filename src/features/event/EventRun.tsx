import { fmtFull } from '../../domain/rules';
import type { Project, ScheduleItem } from '../../domain/types';
import { Badge, Empty, Icon, Progress } from '../../components/ui';

export function EventRun({ p, update }: { p: Project; update: (fn: (p: Project) => Project) => void }) {
  const slots = [...p.schedule].sort((a, b) => a.time.localeCompare(b.time));
  const done = slots.filter((s) => s.done).length;
  const next = slots.find((s) => !s.done);

  const toggle = (s: ScheduleItem) =>
    update((pr) => ({ ...pr, schedule: pr.schedule.map((x) => (x.id === s.id ? { ...x, done: !x.done } : x)) }));

  return (
    <div className="stack">
      <section className="card">
        <div className="row-between">
          <div>
            <h3>Roteiro do dia · {fmtFull(p.eventDate)}</h3>
            <p className="muted small">Toque em um item para marcar como realizado.</p>
          </div>
          <b className="big-num">{done}/{slots.length}</b>
        </div>
        <Progress value={slots.length ? (done / slots.length) * 100 : 0} />
        {next && <p className="next-line"><Badge tone="info">Próximo</Badge> {next.time} · {next.title}</p>}
      </section>
      {!next && slots.length > 0 && (
        <section className="card celebrate">
          <div className="celebrate-icon"><Icon name="check" size={28} /></div>
          <h3>Mostra encerrada com sucesso</h3>
          <p className="muted">Os {slots.length} itens do roteiro foram realizados. Equipe, obrigado pelo trabalho.</p>
          <p className="muted">Próximo passo: registre a desmontagem e o relatório de encerramento nas tarefas.</p>
        </section>
      )}
      {slots.length === 0 && <Empty>Roteiro vazio. Cadastre os horários em Administração → Roteiro.</Empty>}
      <div className="timeline">
        {slots.map((s) => (
          <button key={s.id} className={`slot ${s.done ? 'done' : ''} ${next?.id === s.id ? 'next' : ''}`} onClick={() => toggle(s)}>
            <span className="time">{s.time}</span>
            <span className="slot-body"><b>{s.title}</b><small>{s.owner}</small></span>
            <span className="tick">{s.done && <Icon name="check" size={18} />}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
