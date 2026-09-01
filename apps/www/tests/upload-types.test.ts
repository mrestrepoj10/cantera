import assert from 'node:assert/strict'
import test from 'node:test'

import { formatBytes, matchesAccept } from '../registry/lib/upload-types.ts'

test('matchesAccept handles extensions, exact types, and wildcards', () => {
  assert.equal(matchesAccept(new File([], 'model.RVT'), '.rvt'), true)
  assert.equal(
    matchesAccept(new File([], 'plan', { type: 'application/pdf' }), 'application/pdf'),
    true,
  )
  assert.equal(matchesAccept(new File([], 'photo', { type: 'image/png' }), 'image/*'), true)
  assert.equal(matchesAccept(new File([], 'notes.txt'), '.rvt,application/pdf'), false)
})

test('formatBytes clamps negative values and uses decimal units', () => {
  assert.equal(formatBytes(-1, 'en'), '0 byte')
  assert.equal(formatBytes(1500, 'en'), '1.5 kB')
})
