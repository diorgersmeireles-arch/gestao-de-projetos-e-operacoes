import type { Project, Status, Task } from './types';
import { STATUS_LABEL } from './types';

export const stamp = () => new Date().toISOString();
export const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);

export const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export const fmtDate = (d: string) => (d ? d.split('-').reverse().slice(0, 2).join('/') : '—');
export const fmtFull = (d: string) => (d ? d.split('-').reverse().join('/') : '—');
export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

export function daysUntil(date: string): number {
  const ms = new Date(date + 'T00:00:00').getTime() - new Date(today() + 'T00:00:00').getTime();
  return Math.round(ms / 86400000);
}

export const isLate = (t: Task) => t.status !== 'concluida' && t.due < today();

export function openDeps(p: Project, task: Task): Task[] {
  return task.deps
    .map((id) => p.tasks.find((x) => x.id === id))
    .filter((d): d is Task => !!d && d.status !== 'concluida');
}

/** Retorna o motivo de a transição ser proibida, ou null se permitida. */
export function canMove(p: Project, task: Task, to: Status): string | null {
  if (to === task.status) return null;
  if (to === 'andamento' || to === 'validacao' || to === 'concluida') {
    const open = openDeps(p, task);
    if (open.length) return `Depende de: ${open.map((d) => d.code).join(', ')}`;
  }
  if (to === 'concluida') {
    if (task.status !== 'validacao') return 'Envie para validação antes de concluir.';
    if (task.criteria.some((c) => !c.done)) return 'Há critérios de conclusão pendentes.';
    if (task.needsEvidence && task.evidence.length === 0) return 'Registre ao menos uma evidência.';
  }
  if (to === 'validacao' && task.status !== 'andamento') return 'Só é possível validar uma tarefa em andamento.';
  if (to === 'bloqueada' && !task.blockReason) return 'Informe o motivo do bloqueio.';
  return null;
}

export function logged(task: Task, text: string): Task {
  return { ...task, history: [{ text, at: stamp() }, ...task.history] };
}

export const statusChange = (from: Status, to: Status) => `${STATUS_LABEL[from]} → ${STATUS_LABEL[to]}`;

export type Health = 'ok' | 'atencao' | 'critico';
export function health(p: Project): Health {
  const late = p.tasks.filter(isLate);
  const blocked = p.tasks.filter((t) => t.status === 'bloqueada');
  if ([...late, ...blocked].some((t) => t.priority === 'alto')) return 'critico';
  if (late.length || blocked.length) return 'atencao';
  return 'ok';
}
