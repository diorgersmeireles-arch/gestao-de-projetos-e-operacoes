import { useCallback, useEffect, useState } from 'react';
import type { AppData, Project } from '../domain/types';
import { seed } from '../domain/seed';

const KEY = 'gpo.data.v2';

const fresh = (): AppData => ({ projects: [structuredClone(seed)], activeId: seed.id });

function valid(d: AppData): boolean {
  return Array.isArray(d?.projects) && d.projects.length > 0 &&
    d.projects.every((p) => Array.isArray(p.tasks) && Array.isArray(p.risks) && Array.isArray(p.schedule) &&
      Array.isArray(p.teams) && Array.isArray(p.phases));
}

export const isValidData = valid;

function load(): AppData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw) as AppData;
      if (valid(d)) return d;
    }
  } catch {
    /* dados corrompidos: volta ao modelo inicial */
  }
  return fresh();
}

export function useStore() {
  const [data, setData] = useState<AppData>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      /* armazenamento indisponível */
    }
  }, [data]);

  const project = data.projects.find((p) => p.id === data.activeId) ?? data.projects[0];

  const update = useCallback(
    (fn: (p: Project) => Project) =>
      setData((d) => {
        const id = d.projects.some((p) => p.id === d.activeId) ? d.activeId : d.projects[0].id;
        return { ...d, projects: d.projects.map((p) => (p.id === id ? fn(p) : p)) };
      }),
    [],
  );

  const resetAll = useCallback(() => setData(fresh()), []);

  return { data, setData, project, update, resetAll };
}
