import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { extensionForMime, takeDownloadName } from './audioFile.ts';

describe('take downloads', () => {
  it('keeps a webm recording from being saved as a nameless audio file', () => {
    assert.equal(extensionForMime('audio/webm;codecs=opus'), 'webm');
    assert.equal(takeDownloadName('sonicrift 2026-11-15', 'audio/webm'), 'sonicrift-2026-11-15.webm');
    assert.equal(takeDownloadName('  ', 'audio/mp4'), 'take.m4a');
  });
});
