import path from 'node:path';

// Node's plain objects are case-sensitive, while Windows environment names are not.
// Passing both Path and PATH to spawn can discard the real inherited search path.
export function desktopEnvironment({ source, platform, execPath, root, home, config = {} }) {
  const env = { ...source };
  const windows = platform === 'win32';
  const paths = windows ? path.win32 : path.posix;
  const delimiter = windows ? ';' : ':';
  const keys = Object.keys(env).filter(key => windows ? key.toLowerCase() === 'path' : key === 'PATH');
  const inherited = keys.flatMap(key => typeof env[key] === 'string' ? env[key].split(delimiter) : []);
  for (const key of keys) delete env[key];
  if (config.cargoHome) env.CARGO_HOME = config.cargoHome;
  if (config.rustupHome) env.RUSTUP_HOME = config.rustupHome;
  const directories = [
    paths.dirname(execPath),
    paths.join(env.CARGO_HOME ?? paths.join(home, '.cargo'), 'bin'),
    paths.join(root, 'node_modules', '.bin'),
    ...inherited,
  ];
  env[windows ? 'Path' : 'PATH'] = [...new Set(directories.filter(Boolean))].join(delimiter);
  return env;
}
