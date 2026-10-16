import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { canMove, daysUntil, health, isLate, logged, openDeps, statusChange } from './rules';
import type { Project, Task } from './types';

function task(over: Partial<Task> = {}): Task {
  return {
    id: 'T1', code: 'T-1', title: 'Tarefa', phase: 'Fase', owner: 'Equipe', approver: '',
    due: '2026-10-20', priority: 'medio', status: 'planejada',
    criteria: [], deps: [], needsEvidence: false, evidence: [], history: [], ...over,
  };
}

function project(tasks: Task[]): Project {
  return {
    id: 'p', name: 'Projeto', objective: '', eventDate: '2026-10-27',
    teams: [], phases: [], tasks, risks: [], schedule: [],
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date(2026, 9, 16, 10, 0, 0)); // 16/10/2026, horário local
});

afterEach(() => {
  vi.useRealTimers();
});

describe('canMove', () => {
  it('permite iniciar uma tarefa planejada sem dependências', () => {
    const t = task();
    expect(canMove(project([t]), t, 'andamento')).toBeNull();
  });

  it('permite manter o mesmo status', () => {
    const t = task({ status: 'andamento' });
    expect(canMove(project([t]), t, 'andamento')).toBeNull();
  });

  it('impede o avanço enquanto houver dependência aberta', () => {
    const dep = task({ id: 'D1', code: 'D-1', status: 'andamento' });
    const t = task({ deps: ['D1'] });
    expect(canMove(project([dep, t]), t, 'andamento')).toBe('Depende de: D-1');
  });

  it('libera o avanço quando a dependência está concluída', () => {
    const dep = task({ id: 'D1', code: 'D-1', status: 'concluida' });
    const t = task({ deps: ['D1'] });
    expect(canMove(project([dep, t]), t, 'andamento')).toBeNull();
  });

  it('exige passar pela validação antes de concluir', () => {
    const t = task({ status: 'andamento' });
    expect(canMove(project([t]), t, 'concluida')).toBe('Envie para validação antes de concluir.');
  });

  it('não conclui com critério pendente', () => {
    const t = task({ status: 'validacao', criteria: [{ text: 'HD entregue', done: false }] });
    expect(canMove(project([t]), t, 'concluida')).toBe('Há critérios de conclusão pendentes.');
  });

  it('exige evidência quando ela é obrigatória', () => {
    const t = task({ status: 'validacao', needsEvidence: true, criteria: [{ text: 'HD entregue', done: true }] });
    expect(canMove(project([t]), t, 'concluida')).toBe('Registre ao menos uma evidência.');
  });

  it('conclui quando critérios e evidência estão completos', () => {
    const t = task({
      status: 'validacao', needsEvidence: true,
      criteria: [{ text: 'HD entregue', done: true }],
      evidence: [{ text: 'Recebido pelo cinema', by: 'TI', at: '2026-10-16T10:00:00.000Z' }],
    });
    expect(canMove(project([t]), t, 'concluida')).toBeNull();
  });

  it('só envia para validação uma tarefa em andamento', () => {
    const t = task({ status: 'planejada' });
    expect(canMove(project([t]), t, 'validacao')).toBe('Só é possível validar uma tarefa em andamento.');
  });

  it('exige motivo para bloquear', () => {
    const semMotivo = task({ status: 'andamento' });
    const comMotivo = task({ status: 'andamento', blockReason: 'Aguardando o cinema' });
    expect(canMove(project([semMotivo]), semMotivo, 'bloqueada')).toBe('Informe o motivo do bloqueio.');
    expect(canMove(project([comMotivo]), comMotivo, 'bloqueada')).toBeNull();
  });
});

describe('isLate', () => {
  it('marca como atrasada a tarefa aberta com prazo vencido', () => {
    expect(isLate(task({ due: '2026-10-15' }))).toBe(true);
  });

  it('não marca como atrasada a tarefa que vence hoje', () => {
    expect(isLate(task({ due: '2026-10-16' }))).toBe(false);
  });

  it('ignora tarefas concluídas', () => {
    expect(isLate(task({ due: '2026-10-01', status: 'concluida' }))).toBe(false);
  });
});

describe('daysUntil', () => {
  it('conta os dias até a data', () => {
    expect(daysUntil('2026-10-27')).toBe(11);
    expect(daysUntil('2026-10-16')).toBe(0);
    expect(daysUntil('2026-10-15')).toBe(-1);
  });
});

describe('openDeps', () => {
  it('retorna só as dependências não concluídas e ignora IDs inexistentes', () => {
    const aberta = task({ id: 'A', status: 'andamento' });
    const feita = task({ id: 'B', status: 'concluida' });
    const t = task({ id: 'C', deps: ['A', 'B', 'X'] });
    expect(openDeps(project([aberta, feita, t]), t).map((d) => d.id)).toEqual(['A']);
  });
});

describe('health', () => {
  it('fica "ok" sem atrasos nem bloqueios', () => {
    expect(health(project([task()]))).toBe('ok');
  });

  it('fica em "atenção" com atraso de prioridade não alta', () => {
    expect(health(project([task({ due: '2026-10-10', priority: 'baixo' })]))).toBe('atencao');
  });

  it('fica "crítico" com tarefa de prioridade alta bloqueada', () => {
    expect(health(project([task({ status: 'bloqueada', priority: 'alto', blockReason: 'x' })]))).toBe('critico');
  });
});

describe('histórico', () => {
  it('registra a alteração no topo sem modificar a tarefa original', () => {
    const original = task();
    const atualizada = logged(original, 'Tarefa editada');
    expect(atualizada.history[0].text).toBe('Tarefa editada');
    expect(original.history).toHaveLength(0);
  });

  it('descreve a mudança de status', () => {
    expect(statusChange('planejada', 'andamento')).toBe('Planejada → Em andamento');
  });
});
