// Project-local Graphify; arguments are passed as an array, never through a shell.
import {spawnSync} from 'node:child_process';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const executable=path.join(root,'.tools','graphify','venv',process.platform==='win32'?'Scripts':'bin',process.platform==='win32'?'graphify.exe':'graphify');
if(!existsSync(executable)){
 console.error('Graphify is not installed in this checkout. On Windows: npm.cmd run graph:setup');
 process.exit(1);
}
const [mode='--version',...args]=process.argv.slice(2);
const command=mode==='build'?['extract','.','--code-only','--max-workers','4',...args]:mode==='update'?['update','.',...args]:[mode,...args];
if(mode==='query'&&!args.includes('--budget')&&!args.some(arg=>arg.startsWith('--budget=')))command.push('--budget','1200');
const options={cwd:root,stdio:'inherit',windowsHide:true,env:{...process.env,PYTHONUTF8:'1',PYTHONIOENCODING:'utf-8',GRAPHIFY_MAX_WORKERS:process.env.GRAPHIFY_MAX_WORKERS??'4'}};
const result=spawnSync(executable,command,options);
if(result.error)console.error(result.error.message);
if(mode==='build'&&result.status===0){
 const report=spawnSync(executable,['cluster-only','.','--no-label'],options);
 if(report.error)console.error(report.error.message);
 process.exit(report.status??1);
}
process.exit(result.status??1);
