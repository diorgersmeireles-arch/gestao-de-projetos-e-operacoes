# Como contribuir

## Ambiente

| Ferramenta | Versão | Para quê |
| --- | --- | --- |
| Node.js | 24 (veja `.nvmrc`) | App web, testes e build |
| JDK | 17 (ex.: Eclipse Temurin) | Gerar o APK |
| Android SDK | Plataforma 34 e build-tools 34 | Gerar o APK |

Para o APK, o Gradle precisa saber onde estão o JDK e o SDK:

- `JAVA_HOME` apontando para o JDK 17. O Gradle **não** funciona com Java 8.
- `ANDROID_HOME` apontando para o SDK, ou o arquivo `android/local.properties` com `sdk.dir=...`. Esse arquivo não é versionado.

No Windows (PowerShell), por exemplo:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Eclipse Adoptium\jdk-17.<versão>-hotspot'
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
npm run android:apk
```

Se a pasta do projeto tiver acentos no caminho, o build continua funcionando: `android/gradle.properties` já tem `android.overridePathCheck=true`.

## Primeiros passos

```bash
npm ci
npm run dev      # http://localhost:5173
npm run check    # lint, testes e build: rode antes de abrir um PR
```

## Organização do código

| Pasta | Conteúdo | Regra |
| --- | --- | --- |
| `src/domain` | Tipos, regras do fluxo, dados de exemplo | Funções puras, sem React. Toda regra de negócio nova entra aqui, com teste. |
| `src/data` | Persistência | As telas não acessam o armazenamento diretamente; usam `useStore`. |
| `src/components` | Componentes visuais reutilizáveis | Sem regra de negócio. |
| `src/features/<área>` | Telas e formulários de cada área | Uma pasta por funcionalidade. |
| `src/styles/global.css` | Sistema visual | Use os tokens (`--s4`, `--fs-sm`, `--brand`...) em vez de valores soltos. |

### Padrões visuais

- Tipografia e cor:
  - 4 tamanhos de fonte (12, 16, 18 e 28 px) e 2 pesos (400 e 700);
  - números grandes em Fira Code;
  - cores com contraste mínimo de 4,5:1, nos temas claro e escuro;
  - cor nunca é o único indicador: atraso e prioridade também aparecem em texto.
- Espaçamento e toque: grade de 8 pt; alvos de toque com pelo menos 44 px.
- Ícones em SVG (componente `Icon`), nunca emoji.
- Confira as telas alteradas a 375 px de largura.

As decisões de design seguiram duas skills do Claude Code, instaladas localmente e fora do repositório:

- `npx skills add ceorkm/mobile-app-ui-design`
- `npx uipro-cli init --ai claude`

## Fluxo de trabalho

1. Crie uma branch a partir de `main`: `feat/descricao`, `fix/descricao` ou `docs/descricao`.
2. Escreva os commits no padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/), por exemplo:
   - `feat: notificação de prazo da tarefa`
   - `fix: botão voltar fecha o modal`
   - `docs: atualiza README`
3. Rode `npm run check`.
4. Abra o pull request usando o modelo. A CI precisa passar antes do merge.
5. Registre a mudança em `CHANGELOG.md`, na seção **Não lançado**.

## Versões e releases

A versão fica **só** no `package.json`. O Android lê dela:

- `versionName` = versão do `package.json` (ex.: `0.5.0`);
- `versionCode` = maior × 10000 + menor × 100 + correção (ex.: `0.5.0` → `500`).

Para publicar uma versão:

1. No `CHANGELOG.md`, mova as entradas de **Não lançado** para a nova versão e faça o commit.
2. Rode `npm version minor` (ou `patch`/`major`). Isso atualiza o `package.json` e cria o commit e a tag da versão.
3. Rode `git push --follow-tags`.

A tag dispara o workflow **Android APK**, que gera o APK e cria o Release no GitHub com o arquivo anexado.

### APK assinado para produção

Hoje a CI gera APK de **depuração**. Para distribuir pela Play Store ou por MDM será preciso uma chave de release:

- a chave fica fora do repositório (`*.jks` e `*.keystore` estão no `.gitignore`);
- na CI, ela entra pelos *Secrets* do GitHub.

Isso está previsto na fase 3 de [docs/projeto-v1-offline.md](docs/projeto-v1-offline.md).
