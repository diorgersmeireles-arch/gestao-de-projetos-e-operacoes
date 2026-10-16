# Projeto GPO v1.0: gestão de projetos e operações offline

**Situação:** proposta para aprovação. **Base:** versão atual v0.4 (APK de 16/10/2026).
**Objetivo:** transformar o MVP em um sistema confiável que funcione 100% offline, com banco de dados interno no aparelho, e que já nasça preparado para sincronizar com um servidor depois.

## Resumo

A v0.4 cobre bem o fluxo central (tarefas com critérios, evidências e dependências, dashboard, riscos, roteiro e administração). Os limites estão na base, não na tela:

- Os dados ficam em uma única chave do `localStorage`.
- Não há identidade de quem faz cada ação.
- O botão "voltar" do Android fecha o app.
- O projeto não tem controle de versão.

A proposta tem quatro fases:

| Fase | Versão | Entrega |
| --- | --- | --- |
| 0. Estabilização | v0.5 | Correções de baixo risco, antes da Mostra (27/10) |
| 1. Banco interno offline | v1.0 | SQLite no aparelho, perfis com PIN, aprovação real, fotos como evidência, auditoria e backup automático |
| 2. Operação e produtividade | v1.1–1.2 | Notificações, "Minhas tarefas", cronograma visual, matriz de riscos e relatórios |
| 3. Sincronização (opcional) | v2.0 | Servidor FastAPI + PostgreSQL e vários aparelhos com os mesmos dados |

---

## 1. Diagnóstico da versão atual (v0.4)

### 1.1 O que foi verificado

- Compilação TypeScript e build de produção: sem erros.
- `npm audit`:
  - Dependências do app: 0 vulnerabilidades.
  - Ferramentas de desenvolvimento: 4 (1 crítica, 2 altas, 1 moderada).
- Configuração Android (`build.gradle`, `variables.gradle`, `AndroidManifest.xml`).
- Revisão do código-fonte (`src/`).
- Contraste de cores pelo cálculo WCAG: 23 de 23 pares atendem 4,5:1, nos temas claro e escuro.
- Telas capturadas em 375 px (claro e escuro) e em desktop: sem rolagem horizontal.

### 1.2 Pontos fortes (manter)

- Regras do fluxo corretas:
  - Concluir exige validação, todos os critérios e, quando obrigatória, evidência.
  - Uma dependência aberta impede o avanço.
  - Bloquear exige motivo.
- As regras são funções puras em `rules.ts`, fáceis de testar e de reaproveitar no servidor.
- Funciona sem internet; o pacote é pequeno (cerca de 60 KB de JS compactado, mais as fontes).
- Visual consistente: 4 tamanhos de fonte, grade de 8 pt, alvos de toque de 44 px, foco visível e `prefers-reduced-motion`.
- Administração completa: projetos, equipes, fases, tarefas, riscos e roteiro.

### 1.3 Problemas encontrados

Severidade: **Alta** = risco de perda de dados ou de uso incorreto; **Média** = qualidade ou manutenção; **Baixa** = melhoria de experiência.

| # | Sev. | Problema | Impacto | Correção | Fase |
| --- | --- | --- | --- | --- | --- |
| 1 | Alta | Projeto sem controle de versão (não há `.git`) | Uma alteração errada não tem volta; não há histórico | **Em andamento:** repositório git criado e estrutura para o GitHub pronta; falta o primeiro commit e o repositório remoto | 0 |
| 2 | Alta | Todos os dados em uma chave do `localStorage` (`store.ts`), regravada inteira a cada alteração | Limite de ~5 MB, sem transação nem migração de esquema; perde tudo ao limpar os dados ou desinstalar | Banco SQLite interno, com transações e migrações | 1 |
| 3 | Alta | Botão "voltar" do Android não é tratado (falta `@capacitor/app`) | Com o detalhe de uma tarefa aberto, "voltar" fecha o app | Tratar o evento `backButton`: fechar modal, depois voltar para o Dashboard, depois sair | 0 |
| 4 | Alta | Sem identidade: evidência registra a equipe, não a pessoa; qualquer um aprova; Admin aberto | Auditoria sem valor; o aprovador não é verificado | Perfis locais com PIN e papéis por projeto | 1 |
| 5 | Alta | `structuredClone` (4 usos) exige WebView 98+, e o build mira Chrome 87+; `minSdk` 22 com `minWebViewVersion` padrão (60) | Em aparelho com WebView desatualizada o app abre em branco | Trocar por cópia própria e definir `android.minWebViewVersion`, para mostrar aviso em vez de tela branca | 0 |
| 6 | Alta | Dependências circulares não são bloqueadas | Se A depende de B e B de A, as duas travam para sempre | Detectar ciclo ao salvar e recusar | 0 |
| 7 | Média | APK sempre identificado como "1.0" (`versionCode 1`) | Impossível saber qual versão está instalada | **Corrigido:** a versão do Android agora vem do `package.json` (0.4.0 → `versionCode 400`) | Feito |
| 8 | Média | Código sugerido para nova tarefa usa "quantidade + 1" | Depois de exclusões, sugere código que já existe | Usar o maior número existente + 1 | 0 |
| 9 | Média | 10 diálogos nativos (`confirm`, `prompt`, `alert`) | Fora do padrão visual; sem "desfazer" | Diálogo próprio e aviso com "Desfazer" | 0 |
| 10 | Média | Formulário fecha ao tocar fora (tablet e desktop) sem confirmar | Perda do que foi digitado | Pedir confirmação quando houver alteração | 0 |
| 11 | Média | Importação de backup só valida a estrutura de cima | Arquivo malformado pode quebrar telas | Validação completa por esquema (`zod`) | 0 |
| 12 | Média | Evidência só aceita texto | Não comprova entregas (ex.: foto do HD recebido) | Foto (câmera) e arquivo anexo | 1 |
| 13 | Média | Sem testes automatizados nem lint | Regressões passam despercebidas | Vitest para regras e repositórios; ESLint | 0–1 |
| 14 | Média | Vulnerabilidades em ferramentas de desenvolvimento (esbuild, tar) | Não afetam o APK, mas afetam a máquina de build | Atualizar Vite e Capacitor CLI | 1 |
| 15 | Média | Capacitor 6 (atual: 8.x) e `targetSdk 34`; APK assinado com chave de debug | Bom para instalar direto, insuficiente para a Play Store, que exige `targetSdk` recente | Chave de release e avaliação da migração para Capacitor 8 (exige JDK e SDK Android mais novos) | 3 |
| 16 | Média | Mudanças em projeto, riscos e roteiro não ficam registradas; histórico só por tarefa | Auditoria incompleta | Registro de auditoria global | 1 |
| 17 | Média | `allowBackup="true"` sem regras | O backup automático do Android pode ou não restaurar os dados; comportamento não controlado | Regras explícitas de backup para o banco | 1 |
| 18 | Baixa | Ícone e tela de abertura padrão do Capacitor | Aparência pouco profissional | Gerar ícone e splash com `@capacitor/assets` | 0 |
| 19 | Baixa | Datas sem ano (dd/mm) | Ambíguo em projetos longos | Mostrar o ano quando for diferente do atual | 0 |
| 20 | Baixa | Risco só tem impacto, sem probabilidade | Não há matriz de risco real | Probabilidade × impacto | 2 |
| 21 | Baixa | Roteiro do evento ignora o relógio | O "próximo" é só o primeiro não marcado | Destacar o item pelo horário atual e mostrar o atraso em minutos | 2 |
| 22 | Baixa | Sem notificações de prazo nem relatórios | A equipe depende de abrir o app | Notificações locais e relatório em PDF/CSV | 2 |

---

## 2. Visão da v1.0

Um aplicativo Android que a coordenação e as equipes usam sem internet, com estas garantias:

- **Dados seguros no aparelho:** banco SQLite com transações, backup automático diário e exportação em arquivo.
- **Cada ação tem autor:** a pessoa entra no seu perfil com PIN; evidências, aprovações e alterações registram quem e quando.
- **Aprovação de verdade:** só o aprovador designado aprova ou reprova, com comentário.
- **Comprovação com foto:** evidências com câmera ou arquivo, vinculadas à tarefa.
- **Nada some sem rastro:** exclusões vão para a lixeira, e tudo fica no registro de auditoria.
- **Pronto para crescer:** o mesmo modelo de dados funcionará no servidor PostgreSQL da fase 3.

## 3. Arquitetura proposta

### 3.1 Decisão: SQLite nativo como banco interno

| Opção | Prós | Contras |
| --- | --- | --- |
| **SQLite via `@capacitor-community/sqlite` 6.0.2 (recomendado)** | Banco relacional real; transações; chaves estrangeiras; migrações; criptografia opcional (SQLCipher); mesmo modelo do PostgreSQL futuro | Plugin nativo; no navegador (desenvolvimento) usa WASM com configuração extra |
| IndexedDB via Dexie | Puro web, simples, igual no navegador e no app | Não é SQL; o modelo diverge do servidor futuro; durabilidade igual à do armazenamento da WebView |

A stack atual continua: React + TypeScript + Vite + Capacitor 6. Não é preciso reescrever as telas.

### 3.2 Camadas

```
src/
  domain/          tipos e regras puras (rules.ts atual), sem dependência de banco
  db/
    connection.ts  abre o SQLite; PRAGMA foreign_keys = ON; journal WAL
    migrations/    001_inicial.sql, 002_..., aplicadas em transação
    migrate.ts     controla a versão do esquema (tabela schema_version)
    repositories/  projects, tasks, risks, schedule, people, audit
                   (único ponto de escrita; aplica permissões e grava auditoria)
    legacy.ts      importa os dados da v0.x (localStorage) na primeira execução
  services/        backup, evidências (câmera/arquivos), notificações
  state/           hooks de leitura (useTasks, useProject...) com recarga após gravar
  ui/              telas e componentes atuais
```

Regra de ouro: **as telas nunca gravam direto**; tudo passa pelos repositórios. Isso garante permissão, auditoria e, na fase 3, a fila de sincronização em um único lugar.

### 3.3 Regras para o banco nascer sincronizável

- IDs em UUID (`crypto.randomUUID()`), nunca sequenciais.
- `created_at`, `updated_at` (UTC, ISO 8601) e `version` em toda tabela editável.
- Exclusão lógica (`deleted_at`): permite lixeira agora e propagar exclusões no futuro.
- Toda alteração gera uma linha em `audit_log` (antes e depois em JSON).

## 4. Modelo de dados (SQLite)

| Tabela | Campos principais | Observações |
| --- | --- | --- |
| `people` | id, name, email, is_admin, pin_hash, pin_salt, active | PIN com PBKDF2 (WebCrypto) |
| `projects` | id, name, objective, event_date, status | |
| `project_members` | project_id, person_id, role | coordenador, líder, executor, aprovador ou consulta |
| `teams` / `team_members` | id, project_id, name / team_id, person_id | substituem as equipes em texto |
| `phases` | id, project_id, name, position | EAP |
| `tasks` | id, project_id, phase_id, code, title, description, owner_team_id, owner_person_id, approver_person_id, due_date, priority, status, needs_evidence, block_reason | `UNIQUE(project_id, code)` |
| `task_criteria` | id, task_id, text, position, done, done_by, done_at | critério passa a ter autor |
| `task_dependencies` | task_id, depends_on_id | `CHECK (task_id <> depends_on_id)` mais detecção de ciclo no repositório |
| `task_evidence` | id, task_id, kind, text, file_path, mime, sha256, created_by | texto, foto ou arquivo |
| `approvals` | id, task_id, decision, comment, person_id, created_at | histórico de aprovações e reprovações |
| `risks` | id, project_id, title, probability, impact, owner_team_id, response, status | matriz P × I |
| `schedule_items` | id, project_id, day, start_time, end_time, title, owner_team_id, done, done_by, done_at, notes | roteiro de vários dias |
| `audit_log` | id, at, person_id, entity, entity_id, action, before_json, after_json | só inclusão; alimenta histórico e "atividade recente" |
| `settings` | key, value | preferências e marcos de migração |
| `schema_version` | version, applied_at | controle de migrações |
| `sync_outbox` (fase 3) | id, entity, entity_id, op, payload, created_at, synced_at | fila para o servidor |

## 5. Migração dos dados atuais

Na primeira abertura da v1.0:

1. Se existir `gpo.data.v2` no `localStorage`, gerar antes um **arquivo de backup** com esses dados.
2. Importar tudo em **uma única transação**. As equipes e fases em texto viram linhas, `deps` viram `task_dependencies`, e o `history` vira `audit_log`.
3. Se algo falhar, a transação é desfeita, o app continua com os dados antigos e mostra o erro.
4. Gravar `settings.legacy_imported = data/hora`. O `localStorage` antigo fica intocado por 30 dias para permitir voltar.
5. A importação é idempotente: rodar de novo não duplica registros, porque os IDs de origem são mantidos.

## 6. Segurança e perfis offline

- **Perfis:** a primeira execução cria o administrador e seu PIN; o administrador cadastra as pessoas.
- **Troca de usuário:** tela de seleção de perfil com PIN, prática em aparelho compartilhado.
- **Bloqueio por inatividade:** configurável (ex.: 5 minutos).
- **Onde as permissões valem:** são verificadas nos repositórios, não só na tela. Exemplos:
  - Executor atualiza só tarefas da sua equipe.
  - Só o aprovador designado conclui.
  - Consulta apenas lê.
- **Criptografia do banco (SQLCipher):** recomendada se houver dados pessoais de alunos (LGPD).
- **Backups:** contêm dados pessoais; orientar o armazenamento em local institucional.

## 7. Fases, entregas e critérios de aceite

Estimativas para um desenvolvedor com apoio do Claude Code, incluindo testes em aparelho.

### Fase 0: Estabilização (v0.5), 2 a 3 dias, antes da Mostra

Entregas: itens 1, 3, 5, 6, 8, 9, 10, 11, 13 (testes das regras), 18 e 19 da tabela, além de backup em arquivo pelo menu de compartilhar.

Critérios de aceite:
- [ ] Projeto versionado em git com repositório remoto.
- [ ] "Voltar" fecha o modal aberto e não fecha o app.
- [ ] Salvar dependência circular mostra erro e não grava.
- [ ] Nenhum `confirm`, `prompt` ou `alert` nativo no código.
- [ ] Backup exportado como arquivo e restaurado em outro aparelho.
- [x] Testes automatizados das regras do fluxo passando.

### Fase 1: Banco interno offline (v1.0), 2 a 3 semanas

Entregas: itens 2, 4, 12, 16 e 17, com SQLite, migrações, repositórios, importação da v0.x, perfis com PIN, papéis, aprovação real, fotos como evidência, lixeira e backup automático diário (7 cópias em rotação), além de exportar e importar arquivo.

Critérios de aceite:
- [ ] App funciona em modo avião em todas as telas.
- [ ] Dados da v0.4 importados sem perda (teste com backup real).
- [ ] Encerrar o app no meio de uma gravação não corrompe dados (transação).
- [ ] Toda evidência, aprovação e alteração mostra autor e horário.
- [ ] Executor não consegue aprovar; Consulta não consegue editar.
- [ ] Foto anexada como evidência abre após reiniciar o aparelho.
- [ ] Testes dos repositórios passando (sql.js no Node).

### Fase 2: Operação e produtividade (v1.1–1.2), 3 a 4 semanas

- "Minhas tarefas" (hoje e atrasadas) por pessoa.
- Notificações locais:
  - prazos, com aviso 2 dias antes e no dia;
  - roteiro do evento, 5 minutos antes. Horário exato exige permissão de alarme no Android 12+.
- Cronograma visual (barras por fase) e caminho crítico pelas dependências.
- Matriz de riscos probabilidade × impacto.
- Roteiro com relógio, atraso em minutos e vários dias.
- Relatório de encerramento em PDF e CSV (compartilhar).
- Modelos de projeto (ex.: "Evento escolar") e busca com termos recentes.

### Fase 3: Sincronização (v2.0), 6 a 8 semanas, opcional

- Backend FastAPI + PostgreSQL (arquitetura do planejamento original), com autenticação institucional.
- Sincronização offline:
  - fila local (`sync_outbox`) enviada quando houver rede;
  - recebimento incremental por `updated_at`;
  - exclusões propagadas por `deleted_at`;
  - conflitos resolvidos por campo, com fila de revisão.
- Painel web para coordenação e direção.
- Assinatura de release, distribuição (Play Store ou MDM da instituição) e atualização do Capacitor.

## 8. Cronograma em relação à Mostra (27/10/2026)

| Período | Ação |
| --- | --- |
| 16 a 20/10 | Fase 0 → v0.5 instalada e testada no aparelho da coordenação |
| 21/10 | **Congelamento:** nenhuma mudança na versão usada no evento |
| 23/10 | Entrega do HD ao cinema, controlada no app e no checklist em papel (contingência) |
| 27/10 | Mostra com v0.5 + checklist em papel |
| 21/10 a ~10/11 | Fase 1 em paralelo, sem tocar no aparelho do evento |
| Após a Mostra | Instalar a v1.0, migrar os dados e registrar o encerramento |

## 9. Testes e qualidade

- **Unitários (Vitest):** regras do fluxo, detecção de ciclo, permissões e cálculo dos indicadores.
- **Integração:** repositórios contra SQLite em memória (sql.js), cobrindo migrações do zero e a partir da v0.4.
- **Manual em aparelho:** um Android antigo (10) e um recente (14 ou 15); modo avião; reinício no meio do uso; tema escuro.
- **Antes de cada entrega:** subir `versionCode` e `versionName`, build limpo, verificação de contraste e telas a 375 px.

## 10. Riscos do projeto

| Risco | Prob. | Impacto | Resposta |
| --- | --- | --- | --- |
| Mudança grande perto do evento | Média | Alto | Congelar a v0.5 em 21/10; v1.0 só depois da Mostra |
| Perda de dados na migração | Baixa | Alto | Backup automático antes; transação única; `localStorage` preservado por 30 dias |
| Plugin SQLite trabalhoso no navegador | Média | Baixo | Repositórios testados com sql.js; telas testadas no app |
| Aparelho compartilhado sem controle | Média | Médio | Perfis com PIN e bloqueio por inatividade |
| WebView antiga nos aparelhos da escola | Média | Médio | `minWebViewVersion` com aviso claro; teste em aparelho antigo |

## 11. Decisões pendentes

1. **Banco:** SQLite nativo (recomendado) ou IndexedDB?
2. **Identidade:** pessoas nomeadas com PIN (recomendado) ou só equipes?
3. **Momento da v1.0:** depois da Mostra (recomendado) ou antes?
4. **Criptografia do banco:** necessária se houver dados de alunos.
5. **Distribuição:** APK direto, Play Store ou MDM da instituição?
