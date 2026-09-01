import assert from 'node:assert/strict'
import test from 'node:test'

import {
  groupProjectsByHub,
  normalizeSearchText,
  versionSetIssuance,
} from '../registry/lib/project-types.ts'

test('versionSetIssuance keeps date-only values on their calendar day', () => {
  const issued = versionSetIssuance({ id: 'set-1', name: 'Issued', issuanceDate: '2026-03-12' })
  assert.ok(issued)
  assert.equal(issued.getFullYear(), 2026)
  assert.equal(issued.getMonth(), 2)
  assert.equal(issued.getDate(), 12)
})

test('groupProjectsByHub preserves hub order and trails unknown projects', () => {
  const hubs = [
    { id: 'west', name: 'West' },
    { id: 'east', name: 'East' },
  ]
  const groups = groupProjectsByHub(hubs, [
    { id: 'e1', name: 'East One', hubId: 'east' },
    { id: 'orphan', name: 'Unknown', hubId: 'missing' },
    { id: 'w1', name: 'West One', hubId: 'west' },
  ])

  assert.deepEqual(
    groups.map((group) => [group.hub?.id ?? null, group.projects.map((project) => project.id)]),
    [
      ['west', ['w1']],
      ['east', ['e1']],
      [null, ['orphan']],
    ],
  )
})

test('normalizeSearchText folds case and diacritics', () => {
  assert.equal(normalizeSearchText('CAÑA VIVA'), 'cana viva')
})
