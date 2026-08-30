import assert from 'node:assert/strict'
import test from 'node:test'

import {
  displayObjectName,
  isOwnedUrn,
  MAX_UPLOAD_BYTES,
  objectIdFor,
  parseUploadRequest,
} from '../registry/blocks/model-upload-page/api/upload-request.ts'

const bucket = 'cantera-models'
const objectKey = '123e4567-e89b-42d3-a456-426614174000--tower.rvt'
const objectId = objectIdFor(bucket, objectKey)

test('start requests require a safe name and bounded positive size', () => {
  assert.equal(parseUploadRequest({ kind: 'start', name: 'tower.rvt', size: 10 }, bucket).ok, true)
  assert.equal(
    parseUploadRequest({ kind: 'start', name: '../tower.rvt', size: 10 }, bucket).ok,
    false,
  )
  assert.equal(parseUploadRequest({ kind: 'start', name: 'tower.rvt', size: -1 }, bucket).ok, false)
  const oversized = parseUploadRequest(
    { kind: 'start', name: 'tower.rvt', size: MAX_UPLOAD_BYTES + 1 },
    bucket,
  )
  assert.equal(oversized.ok, false)
  if (!oversized.ok) assert.equal(oversized.status, 413)
})

test('finish requests must use the issued object identity and valid views', () => {
  const valid = {
    kind: 'finish',
    name: 'tower.rvt',
    objectKey,
    objectId,
    uploadKey: 'upload-1',
    views: ['2d', '3d'],
  }
  assert.equal(parseUploadRequest(valid, bucket).ok, true)
  assert.equal(parseUploadRequest({ ...valid, objectId: 'urn:other' }, bucket).ok, false)
  assert.equal(parseUploadRequest({ ...valid, views: [] }, bucket).ok, false)
  assert.equal(parseUploadRequest({ ...valid, zipEntrypoint: '../tower.rvt' }, bucket).ok, false)
})

test('owned URNs decode to this bucket only', () => {
  const urn = Buffer.from(objectId, 'utf8').toString('base64url')
  assert.equal(displayObjectName(objectKey), 'tower.rvt')
  assert.equal(isOwnedUrn(urn, bucket), true)
  assert.equal(isOwnedUrn(urn, 'another-bucket'), false)
})
