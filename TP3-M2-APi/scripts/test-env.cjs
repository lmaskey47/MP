const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const { test } = require('node:test');

function start(overrides) {
  return spawnSync(process.execPath, ['-e', "require('./dist/config/env')"], {
    cwd: require('node:path').resolve(__dirname, '..'),
    env: {
      ...process.env,
      DOTENV_CONFIG_QUIET: 'true',
      NODE_ENV: 'production',
      PORT: '3000',
      MONGODB_URI: 'mongodb://app:test@localhost:27017/logichain',
      JWT_SECRET: 'x'.repeat(48),
      ...overrides,
    },
    encoding: 'utf8',
  });
}

test('production accepts explicit authenticated configuration', () => {
  assert.equal(start({}).status, 0);
});
test('production refuses a short JWT secret', () => {
  const result = start({ JWT_SECRET: 'short' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /JWT_SECRET/);
});
test('production refuses MongoDB without authentication', () => {
  const result = start({ MONGODB_URI: 'mongodb://localhost:27017/logichain' });
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /MONGODB_URI/);
});
test('invalid listening ports are rejected', () => {
  for (const PORT of ['0', '65536', '3.5', 'abc']) {
    assert.notEqual(start({ PORT }).status, 0);
  }
});
