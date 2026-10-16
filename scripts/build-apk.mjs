// Gera o APK de depuração e o copia para release/ com o número da versão.
// Uso: npm run android:apk   (requer JDK 17 em JAVA_HOME e o Android SDK; veja CONTRIBUTING.md)
import { execSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const { version } = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const run = (cmd, cwd = root) => execSync(cmd, { cwd, stdio: 'inherit' });

if (!process.env.JAVA_HOME) {
  console.warn('Aviso: JAVA_HOME não está definido. O Gradle precisa do JDK 17 (veja CONTRIBUTING.md).');
}

run('npm run build');
run('npx cap sync android');
// Caminho explícito: o cmd do Windows pode não procurar comandos na pasta atual.
run(process.platform === 'win32' ? '.\\gradlew.bat assembleDebug' : './gradlew assembleDebug', join(root, 'android'));

const outDir = join(root, 'release');
mkdirSync(outDir, { recursive: true });
const target = join(outDir, `gestao-projetos-v${version}-debug.apk`);
copyFileSync(join(root, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'), target);
console.log(`\nAPK gerado: ${target}`);
