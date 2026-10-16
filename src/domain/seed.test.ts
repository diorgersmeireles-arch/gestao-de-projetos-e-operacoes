import { describe, expect, it } from 'vitest';
import { seed } from './seed';

/** Os dados de exemplo são a primeira impressão do app: precisam ser coerentes. */
describe('dados de exemplo', () => {
  const ids = new Set(seed.tasks.map((t) => t.id));

  it('não repete códigos de tarefa', () => {
    const codes = seed.tasks.map((t) => t.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('só referencia dependências que existem', () => {
    for (const t of seed.tasks) {
      for (const d of t.deps) expect(ids.has(d), `${t.code} depende de ${d}`).toBe(true);
    }
  });

  it('não tem dependências circulares', () => {
    const byId = new Map(seed.tasks.map((t) => [t.id, t]));
    const visiting = new Set<string>();
    const done = new Set<string>();
    const visit = (id: string): boolean => {
      if (done.has(id)) return false;
      if (visiting.has(id)) return true;
      visiting.add(id);
      const cycle = (byId.get(id)?.deps ?? []).some(visit);
      visiting.delete(id);
      done.add(id);
      return cycle;
    };
    expect(seed.tasks.some((t) => visit(t.id))).toBe(false);
  });

  it('marca todos os critérios das tarefas já concluídas', () => {
    for (const t of seed.tasks.filter((x) => x.status === 'concluida')) {
      expect(t.criteria.every((c) => c.done), t.code).toBe(true);
    }
  });

  it('usa apenas fases e equipes cadastradas no projeto', () => {
    for (const t of seed.tasks) {
      expect(seed.phases, t.code).toContain(t.phase);
      expect(seed.teams, t.code).toContain(t.owner);
    }
  });
});
