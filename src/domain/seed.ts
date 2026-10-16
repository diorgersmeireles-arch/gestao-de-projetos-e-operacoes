import type { Project, Task, Level } from './types';

function t(
  code: string, title: string, phase: string, owner: string, due: string,
  priority: Level, criteria: string[], opts: Partial<Task> = {},
): Task {
  return {
    id: code, code, title, phase, owner, approver: '', due, priority,
    status: 'planejada',
    criteria: criteria.map((text) => ({ text, done: opts.status === 'concluida' })),
    deps: [], needsEvidence: false, evidence: [], history: [], ...opts,
  };
}

export const seed: Project = {
  id: 'mostra-2026',
  name: 'Mostra de Curtas 2026',
  objective: 'Realizar a Mostra de Curtas em 27/10/2026 com todo o material audiovisual homologado e a equipe preparada.',
  eventDate: '2026-10-27',
  teams: ['Coordenação', 'TI / Audiovisual', 'Administrativo', 'Recepção', 'Palco'],
  phases: ['Planejamento', 'Audiovisual', 'Logística', 'Operação', 'Execução', 'Encerramento'],
  tasks: [
    t('PLA-001', 'Fechar roteiro e responsáveis do evento', 'Planejamento', 'Coordenação', '2026-10-12', 'alto',
      ['Roteiro por horário aprovado', 'Responsável definido para cada bloco'], { status: 'concluida', approver: 'Direção' }),

    t('AUD-001', 'Confirmar especificações técnicas com o cinema', 'Audiovisual', 'TI / Audiovisual', '2026-10-16', 'alto',
      ['Formato DCP/arquivo confirmado', 'Resolução e áudio confirmados', 'Resposta do cinema registrada'],
      { status: 'andamento', needsEvidence: true }),
    t('AUD-002', 'Conferir vídeo de abertura, trailers e nove curtas', 'Audiovisual', 'TI / Audiovisual', '2026-10-19', 'alto',
      ['Vídeo de abertura conferido', 'Trailers conferidos', 'Nove curtas conferidos'], { deps: ['AUD-001'] }),
    t('AUD-003', 'Gerar e validar pacotes audiovisuais (DCP)', 'Audiovisual', 'TI / Audiovisual', '2026-10-21', 'alto',
      ['Pacotes gerados', 'Homologação aprovada pelo cinema'], { deps: ['AUD-002'], approver: 'Cinema', needsEvidence: true }),
    t('AUD-005', 'Preparar e entregar os materiais audiovisuais', 'Audiovisual', 'TI / Audiovisual', '2026-10-23', 'alto',
      ['Especificações técnicas confirmadas pelo cinema', 'Vídeo de abertura, trailers e nove curtas conferidos',
        'Pacotes audiovisuais validados', 'HD entregue com recebimento registrado', 'Teste de ingestão e reprodução confirmado'],
      { deps: ['AUD-003'], approver: 'Cinema', needsEvidence: true }),
    t('LOG-001', 'Reservar transporte de alunos e equipe', 'Logística', 'Administrativo', '2026-10-20', 'medio',
      ['Veículos confirmados', 'Lista de passageiros fechada']),
    t('LOG-002', 'Montar mapa de assentos e lista de convidados', 'Logística', 'Coordenação', '2026-10-22', 'medio',
      ['Lista de convidados fechada', 'Mapa de assentos validado']),
    t('REC-001', 'Treinar equipe de recepção', 'Operação', 'Recepção', '2026-10-24', 'medio',
      ['Equipe escalada', 'Briefing realizado']),
    t('PAL-001', 'Roteiro de palco e apresentadores', 'Operação', 'Palco', '2026-10-24', 'medio',
      ['Falas revisadas', 'Ensaio realizado'], { deps: ['PLA-001'] }),
    t('PRE-001', 'Preparar premiação (troféus e certificados)', 'Operação', 'Coordenação', '2026-10-25', 'baixo',
      ['Troféus conferidos', 'Certificados impressos']),
    t('EVT-001', 'Passagem de som e teste final no cinema', 'Execução', 'TI / Audiovisual', '2026-10-27', 'alto',
      ['Áudio testado', 'Projeção testada', 'Plano B de reprodução disponível'], { deps: ['AUD-005'], needsEvidence: true }),
    t('POS-001', 'Desmontagem e relatório de encerramento', 'Encerramento', 'Coordenação', '2026-10-30', 'baixo',
      ['Materiais devolvidos', 'Relatório de encerramento registrado'], { deps: ['EVT-001'] }),
  ],
  risks: [
    { id: 'R1', title: 'Incompatibilidade do DCP com o projetor do cinema', impact: 'alto', owner: 'TI / Audiovisual', response: 'Teste prévio de ingestão; levar cópia em MP4 como alternativa.', status: 'aberto' },
    { id: 'R2', title: 'Falha de áudio durante a exibição', impact: 'alto', owner: 'TI / Audiovisual', response: 'Passagem de som no dia e áudio reserva.', status: 'aberto' },
    { id: 'R3', title: 'Atraso na entrega do HD', impact: 'medio', owner: 'Coordenação', response: 'Prazo interno 2 dias antes do limite do cinema.', status: 'aberto' },
    { id: 'R4', title: 'Ausência de membro-chave da equipe', impact: 'baixo', owner: 'Coordenação', response: 'Suplentes definidos por bloco.', status: 'mitigado' },
  ],
  schedule: [
    { id: 'S1', time: '07:30', title: 'Chegada da equipe técnica e montagem', owner: 'TI / Audiovisual', done: false },
    { id: 'S2', time: '08:30', title: 'Passagem de som e teste de projeção', owner: 'TI / Audiovisual', done: false },
    { id: 'S3', time: '09:30', title: 'Briefing final da equipe', owner: 'Coordenação', done: false },
    { id: 'S4', time: '10:00', title: 'Abertura das portas e recepção', owner: 'Recepção', done: false },
    { id: 'S5', time: '10:30', title: 'Vídeo de abertura e fala inicial', owner: 'Palco', done: false },
    { id: 'S6', time: '11:00', title: 'Exibição dos curtas (bloco 1)', owner: 'TI / Audiovisual', done: false },
    { id: 'S7', time: '12:30', title: 'Intervalo', owner: 'Coordenação', done: false },
    { id: 'S8', time: '13:30', title: 'Exibição dos curtas (bloco 2)', owner: 'TI / Audiovisual', done: false },
    { id: 'S9', time: '15:00', title: 'Premiação', owner: 'Palco', done: false },
    { id: 'S10', time: '16:00', title: 'Encerramento e desmontagem', owner: 'Todos', done: false },
  ],
};
