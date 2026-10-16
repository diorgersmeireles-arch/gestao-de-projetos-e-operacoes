import { useMemo } from 'react';
import { daysUntil, fmtDate, fmtDateTime, fmtFull, health, isLate, openDeps } from '../../domain/rules';
import { STATUSES, STATUS_LABEL, type Project } from '../../domain/types';
import { Badge, Empty, Icon, Progress, Ring, SectionTitle, StatusBadge } from '../../components/ui';

const HEALTH = {
  ok: { tone: 'ok', label: 'No prazo', text: 'Nenhuma pendência crítica.' },
  atencao: { tone: 'warn', label: 'Atenção', text: 'Há tarefas atrasadas ou bloqueadas.' },
  critico: { tone: 'bad', label: 'Crítico', text: 'Tarefas de alta prioridade atrasadas ou bloqueadas.' },
} as const;

export default function Dashboard({ p, onOpen }: { p: Project; onOpen: (id: string) => void }) {
  const d = useMemo(() => {
    const total = p.tasks.length;
    const done = p.tasks.filter((t) => t.status === 'concluida').length;
    const late = p.tasks.filter(isLate);
    const blocked = p.tasks.filter((t) => t.status === 'bloqueada');
    const counts = STATUSES.map((s) => ({ s, n: p.tasks.filter((t) => t.status === s).length }));
    const phases = p.phases.map((ph) => {
      const ts = p.tasks.filter((t) => t.phase === ph);
      return { ph, total: ts.length, done: ts.filter((t) => t.status === 'concluida').length };
    }).filter((x) => x.total > 0);
    const teams = p.teams.map((tm) => {
      const ts = p.tasks.filter((t) => t.owner === tm);
      return {
        tm, total: ts.length,
        done: ts.filter((t) => t.status === 'concluida').length,
        late: ts.filter(isLate).length,
      };
    }).filter((x) => x.total > 0);
    const upcoming = p.tasks
      .filter((t) => t.status !== 'concluida' && daysUntil(t.due) <= 7)
      .sort((a, b) => a.due.localeCompare(b.due)).slice(0, 6);
    const activity = p.tasks
      .flatMap((t) => t.history.map((h) => ({ ...h, code: t.code, id: t.id })))
      .sort((a, b) => b.at.localeCompare(a.at)).slice(0, 6);
    const risks = {
      alto: p.risks.filter((r) => r.impact === 'alto' && r.status !== 'mitigado').length,
      medio: p.risks.filter((r) => r.impact === 'medio' && r.status !== 'mitigado').length,
      baixo: p.risks.filter((r) => r.impact === 'baixo' && r.status !== 'mitigado').length,
      ocorridos: p.risks.filter((r) => r.status === 'ocorrido').length,
    };
    const slots = p.schedule.length;
    return { total, done, late, blocked, counts, phases, teams, upcoming, activity, risks, slots,
      pct: total ? Math.round((done / total) * 100) : 0 };
  }, [p]);

  const h = HEALTH[health(p)];
  const days = daysUntil(p.eventDate);
  const urgent = [...d.late, ...d.blocked].filter((t) => t.priority === 'alto').length;
  const nextTask = p.tasks.filter((t) => t.status !== 'concluida').sort((a, b) => a.due.localeCompare(b.due))[0];
  const headline =
    d.total > 0 && d.done === d.total ? 'Tudo entregue. Excelente trabalho da equipe!'
    : urgent > 0 ? `${urgent} tarefa(s) de alta prioridade precisam de ação agora.`
    : d.late.length + d.blocked.length > 0 ? 'Há pendências, mas nada de alta prioridade.'
    : nextTask ? `Tudo no rumo. Próxima entrega: ${nextTask.code} em ${fmtDate(nextTask.due)}.` : h.text;
  const attention = [...d.late, ...d.blocked.filter((b) => !d.late.includes(b))]
    .sort((a, b) => (a.priority === b.priority ? a.due.localeCompare(b.due) : a.priority === 'alto' ? -1 : 1));

  return (
    <div className="stack">
      <section className="card hero">
        <Ring value={d.pct} label="concluído" />
        <div className="hero-body">
          <div className="hero-top">
            <Badge tone={h.tone}>{h.label}</Badge>
            <span className="muted">{d.done} de {d.total} atividades</span>
          </div>
          <h2>{p.name}</h2>
          <p className="headline">{headline}</p>
          <div className="hero-meta">
            <span><Icon name="clock" size={15} /> {days > 0 ? `Faltam ${days} dias` : days === 0 ? 'O evento é hoje' : `Evento encerrado há ${-days} dias`} · {fmtFull(p.eventDate)}</span>
          </div>
        </div>
      </section>

      <div className="kpis">
        <Kpi label="Atrasadas" value={d.late.length} tone={d.late.length ? 'bad' : 'ok'} />
        <Kpi label="Bloqueadas" value={d.blocked.length} tone={d.blocked.length ? 'warn' : 'ok'} />
        <Kpi label="Em validação" value={p.tasks.filter((t) => t.status === 'validacao').length} tone="info" />
        <Kpi label="Riscos altos" value={d.risks.alto} tone={d.risks.alto ? 'warn' : 'ok'} />
      </div>

      <div className="cols">
        <section className="card">
          <SectionTitle>Distribuição por status</SectionTitle>
          <div className="stacked" role="img"
            aria-label={d.counts.map((c) => `${STATUS_LABEL[c.s]}: ${c.n}`).join(', ')}>
            {d.counts.filter((c) => c.n > 0).map((c) => (
              <div key={c.s} className={`seg sb-${c.s}`} style={{ flex: c.n }} title={`${STATUS_LABEL[c.s]}: ${c.n}`} />
            ))}
          </div>
          <div className="legend">
            {d.counts.map((c) => (
              <span key={c.s}><i className={`dot sb-${c.s}`} />{STATUS_LABEL[c.s]} <b>{c.n}</b></span>
            ))}
          </div>
        </section>

        <section className="card">
          <SectionTitle>Progresso por fase</SectionTitle>
          {d.phases.length === 0 && <Empty>Sem tarefas cadastradas.</Empty>}
          {d.phases.map((x) => (
            <div key={x.ph} className="metric">
              <div className="metric-head"><span>{x.ph}</span><b>{x.done}/{x.total}</b></div>
              <Progress value={(x.done / x.total) * 100} />
            </div>
          ))}
        </section>
      </div>

      <div className="cols">
        <section className="card">
          <SectionTitle>Carga por equipe</SectionTitle>
          {d.teams.length === 0 && <Empty>Sem tarefas atribuídas.</Empty>}
          {d.teams.map((x) => (
            <div key={x.tm} className="metric">
              <div className="metric-head">
                <span>{x.tm}</span>
                <span className="muted">{x.done}/{x.total} concluídas{x.late > 0 && <b className="txt-bad"> · {x.late} atrasada(s)</b>}</span>
              </div>
              <Progress value={(x.done / x.total) * 100} tone={x.late ? 'bad' : 'brand'} />
            </div>
          ))}
        </section>

        <section className="card">
          <SectionTitle>Exposição a riscos</SectionTitle>
          <div className="risk-grid">
            <div className="rk bad"><b>{d.risks.alto}</b><span>Alto</span></div>
            <div className="rk warn"><b>{d.risks.medio}</b><span>Médio</span></div>
            <div className="rk ok"><b>{d.risks.baixo}</b><span>Baixo</span></div>
          </div>
          <p className="muted small">Riscos em aberto ou ocorridos, por impacto. {d.risks.ocorridos > 0 && `${d.risks.ocorridos} já ocorreu(ram).`}</p>
        </section>
      </div>

      <section className="card">
        <SectionTitle>Requer atenção</SectionTitle>
        {attention.length === 0 && <Empty icon="check">Nada atrasado ou bloqueado. A equipe está em dia.</Empty>}
        {attention.map((t) => (
          <button key={t.id} className="line" onClick={() => onOpen(t.id)}>
            <div>
              <div className="line-title">{t.code} · {t.title}</div>
              <div className="muted small">
                {t.owner} · prazo {fmtDate(t.due)}
                {isLate(t) && <b className="txt-bad"> · {-daysUntil(t.due)}d de atraso</b>}
                {t.status === 'bloqueada' && t.blockReason && <> · {t.blockReason}</>}
              </div>
            </div>
            <StatusBadge status={t.status} />
          </button>
        ))}
      </section>

      <div className="cols">
        <section className="card">
          <SectionTitle>Próximos prazos (7 dias)</SectionTitle>
          {d.upcoming.length === 0 && <Empty>Sem prazos na semana.</Empty>}
          {d.upcoming.map((t) => (
            <button key={t.id} className="line" onClick={() => onOpen(t.id)}>
              <div>
                <div className="line-title">{t.title}</div>
                <div className="muted small">{t.code} · {t.owner}{openDeps(p, t).length > 0 && ' · aguarda dependência'}</div>
              </div>
              <span className={`due ${isLate(t) ? 'txt-bad' : ''}`}>{isLate(t) ? `Atrasada · ${fmtDate(t.due)}` : fmtDate(t.due)}</span>
            </button>
          ))}
        </section>

        <section className="card">
          <SectionTitle>Atividade recente</SectionTitle>
          {d.activity.length === 0 && <Empty>Nenhuma alteração registrada ainda.</Empty>}
          {d.activity.map((a, i) => (
            <button key={i} className="line" onClick={() => onOpen(a.id)}>
              <div>
                <div className="line-title">{a.code}</div>
                <div className="muted small">{a.text}</div>
              </div>
              <span className="muted small">{fmtDateTime(a.at)}</span>
            </button>
          ))}
        </section>
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number; tone: 'ok' | 'warn' | 'bad' | 'info' }) {
  return (
    <div className={`card kpi tone-${tone}`}>
      <b>{value}</b>
      <span>{label}</span>
    </div>
  );
}
