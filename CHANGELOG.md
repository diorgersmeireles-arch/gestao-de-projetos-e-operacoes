# Histórico de versões

Todas as mudanças relevantes do projeto ficam registradas aqui.
O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), e as versões seguem o [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não lançado]

### Adicionado

- Testes automatizados das regras do fluxo e dos dados de exemplo (Vitest).
- Lint com ESLint.
- CI no GitHub Actions: lint, testes e build a cada push e pull request.
- Geração do APK pela CI, com publicação no GitHub Releases ao criar uma tag `v*`.
- Script `npm run android:apk`, que gera o APK em `release/` com o número da versão.
- Modelos de issue e de pull request, Dependabot e documentação do repositório (README, CONTRIBUTING, SECURITY).

### Alterado

- Código organizado em `domain`, `data`, `components` e `features`, sem mudança de comportamento.
- A versão do Android passa a ser lida do `package.json`. Para 0.4.0, o `versionCode` agora é 400.

## [0.4.0] - 2026-10-16

### Alterado

- Paleta teal com contraste WCAG AA verificado em 23 pares de cor (temas claro e escuro).
- Fontes Fira Sans e Fira Code embutidas no app, para funcionar offline.
- Acessibilidade:
  - texto base de 16 px e foco visível;
  - rótulos de acessibilidade em campos e botões só com ícone;
  - atraso e prioridade também indicados em texto, não só por cor.

### Corrigido

- "Impacto alta" passou a ser "Impacto alto".
- O botão flutuante cobria o último item das listas.
- O APK se identificava sempre como versão 1.0.

### Adicionado

- Diagnóstico do sistema e projeto da v1.0 offline com banco interno (`docs/projeto-v1-offline.md`).

## [0.3.0] - 2026-10-15

### Adicionado

- Linha do tempo do status no detalhe da tarefa.
- Aviso de conclusão com o progresso do projeto.
- Cartão de encerramento quando o roteiro do evento termina.
- Filtro "Atrasadas", botão flutuante para criar tarefa e risco, e estados vazios com orientação.
- Mensagem de situação no topo do dashboard.

### Alterado

- Sistema visual: 4 tamanhos de fonte, 2 pesos, grade de 8 pt, alvos de toque de 44 px e sombras suaves.

### Corrigido

- Uma tarefa de exemplo concluída aparecia com critérios pendentes.

## [0.2.0] - 2026-10-15

### Adicionado

- Dashboard analítico:
  - progresso, situação do projeto e indicadores;
  - distribuição por status, progresso por fase e carga por equipe;
  - exposição a riscos, próximos prazos e atividade recente.
- Área de administração: projetos, equipes e fases, tarefas, riscos, roteiro e backup.
- Suporte a vários projetos, menu lateral em telas largas e tema escuro.

### Alterado

- Interface reescrita por completo.

## [0.1.0] - 2026-10-15

### Adicionado

- Primeira versão:
  - tarefas com fluxo de status, critérios de conclusão, evidências e dependências;
  - riscos e roteiro do evento;
  - backup por texto;
  - APK Android.
