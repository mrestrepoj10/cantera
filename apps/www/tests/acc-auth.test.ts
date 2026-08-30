import assert from 'node:assert/strict'
import test from 'node:test'

import {
  allowedSignInScopes,
  appOrigin,
  safeNext,
  sealSession,
  verifySealedSession,
} from '../registry/blocks/acc-auth-routes/lib/acc-auth.ts'

test('allowedSignInScopes keeps required scopes and drops unknown consent', () => {
  assert.deepEqual(allowedSignInScopes('data:write code:all data:write'), [
    'user-profile:read',
    'data:read',
    'viewables:read',
    'data:write',
  ])
})

test('safeNext accepts only same-origin relative paths', () => {
  assert.equal(safeNext('/models?view=latest', '/sign-in'), '/models?view=latest')
  assert.equal(safeNext('//evil.example', '/sign-in'), '/sign-in')
  assert.equal(safeNext('/\\evil.example', '/sign-in'), '/sign-in')
})

test('sealed sessions reject tampering and server-expired payloads', async () => {
  const sealed = await sealSession({ userId: 'user-1' })
  assert.deepEqual(await verifySealedSession(sealed), { userId: 'user-1' })
  assert.equal(await verifySealedSession(`${sealed}x`), null)
  assert.equal(await verifySealedSession(await sealSession({ userId: 'user-1' }, -1)), null)
})

test('appOrigin prefers the configured canonical origin', () => {
  const previous = process.env.APP_ORIGIN
  process.env.APP_ORIGIN = 'https://cantera.example'
  try {
    assert.equal(appOrigin('https://attacker.example'), 'https://cantera.example')
  } finally {
    if (previous === undefined) delete process.env.APP_ORIGIN
    else process.env.APP_ORIGIN = previous
  }
})
