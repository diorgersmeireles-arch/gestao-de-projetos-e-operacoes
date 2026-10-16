export type Status = 'planejada' | 'andamento' | 'validacao' | 'bloqueada' | 'concluida';
export type Level = 'alto' | 'medio' | 'baixo';

export const STATUSES: Status[] = ['planejada', 'andamento', 'validacao', 'bloqueada', 'concluida'];
export const STATUS_LABEL: Record<Status, string> = {
  planejada: 'Planejada',
  andamento: 'Em andamento',
  validacao: 'Em validação',
  bloqueada: 'Bloqueada',
  concluida: 'Concluída',
};
/** Prioridade (feminino). */
export const LEVEL_LABEL: Record<Level, string> = { alto: 'Alta', medio: 'Média', baixo: 'Baixa' };
/** Impacto de risco (masculino). */
export const IMPACT_LABEL: Record<Level, string> = { alto: 'Alto', medio: 'Médio', baixo: 'Baixo' };
export const RISK_STATUS_LABEL = { aberto: 'Aberto', mitigado: 'Mitigado', ocorrido: 'Ocorrido' } as const;

export interface Criterion { text: string; done: boolean }
export interface Evidence { text: string; by: string; at: string }
export interface Entry { text: string; at: string }

export interface Task {
  id: string;
  code: string;
  title: string;
  phase: string;
  owner: string;
  approver: string;
  due: string; // YYYY-MM-DD
  priority: Level;
  status: Status;
  criteria: Criterion[];
  deps: string[];
  needsEvidence: boolean;
  blockReason?: string;
  evidence: Evidence[];
  history: Entry[];
}

export interface Risk {
  id: string;
  title: string;
  impact: Level;
  owner: string;
  response: string;
  status: keyof typeof RISK_STATUS_LABEL;
}

export interface ScheduleItem { id: string; time: string; title: string; owner: string; done: boolean }

export interface Project {
  id: string;
  name: string;
  objective: string;
  eventDate: string;
  teams: string[];
  phases: string[];
  tasks: Task[];
  risks: Risk[];
  schedule: ScheduleItem[];
}

export interface AppData { projects: Project[]; activeId: string }
