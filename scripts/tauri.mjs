// Keep development-tool paths local to this process instead of editing system PATH.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { desktopEnvironment } from './desktop-env.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const configPath = path.join(root, '.desktop-env.json');
const config = fs.existsSync(configPath) ? JSON.parse(fs.readFileSync(configPath, 'utf8')) : {};
const env = desktopEnvironment({ source: process.env, platform: process.platform, execPath: process.execPath, root, home: os.homedir(), config });
const args = process.argv.slice(2);
const test = args[0] === '--test';
const command = test ? (process.platform === 'win32' ? 'cargo.exe' : 'cargo') : process.execPath;
const result = spawnSync(command, test ? ['test', '--manifest-path', 'src-tauri/Cargo.toml', ...args.slice(1)] : [path.join(root, 'node_modules/@tauri-apps/cli/tauri.js'), ...args], { cwd: root, env, stdio: 'inherit' });
if (result.error) process.stderr.write(`Không chạy được công cụ desktop: ${result.error.message}\nCần Rust MSVC và Microsoft C++ Build Tools + Windows SDK.\n`);
process.exit(result.status ?? 1);
