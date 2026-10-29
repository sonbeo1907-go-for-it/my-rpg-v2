import test from 'node:test';
import assert from 'node:assert/strict';
import { desktopEnvironment } from '../scripts/desktop-env.mjs';

const windows = { platform: 'win32', execPath: 'C:\\Program Files\\nodejs\\node.exe', root: 'E:\\MyRPGv2', home: 'C:\\Users\\Player' };
test('Windows Path is preserved and Node, npm and project tools remain discoverable', () => {
  const source = { Path: 'C:\\Windows\\System32;C:\\Custom Tools', SystemRoot: 'C:\\Windows' };
  const env = desktopEnvironment({ ...windows, source, config: { cargoHome: 'E:\\Rust\\cargo', rustupHome: 'E:\\Rust\\rustup' } });
  assert.deepEqual(Object.keys(env).filter(key => key.toLowerCase() === 'path'), ['Path']);
  assert.deepEqual(env.Path.split(';'), ['C:\\Program Files\\nodejs', 'E:\\Rust\\cargo\\bin', 'E:\\MyRPGv2\\node_modules\\.bin', 'C:\\Windows\\System32', 'C:\\Custom Tools']);
  assert.equal(env.RUSTUP_HOME, 'E:\\Rust\\rustup');
  assert.equal(env.SystemRoot, 'C:\\Windows');
  assert.equal(source.Path, 'C:\\Windows\\System32;C:\\Custom Tools');
  assert.ok(!env.Path.includes('undefined'));
});
test('Windows duplicate PATH / Path keys collapse without losing either search path', () => {
  const env = desktopEnvironment({ ...windows, source: { PATH: 'C:\\NodeTools', Path: 'C:\\Windows\\System32' } });
  assert.equal(Object.keys(env).filter(key => key.toLowerCase() === 'path').length, 1);
  assert.ok(env.Path.includes('C:\\Windows\\System32'));
  assert.ok(env.Path.includes('C:\\NodeTools'));
});
test('POSIX PATH stays case-sensitive and retains the original system directories', () => {
  const env = desktopEnvironment({ source: { PATH: '/usr/bin:/bin', Path: 'unrelated' }, platform: 'linux', execPath: '/opt/node/bin/node', root: '/game', home: '/home/player' });
  assert.equal(env.PATH, '/opt/node/bin:/home/player/.cargo/bin:/game/node_modules/.bin:/usr/bin:/bin');
  assert.equal(env.Path, 'unrelated');
});
