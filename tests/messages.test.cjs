const { test } = require('node:test');
const assert = require('node:assert/strict');
const { messages, messageForDay } = require('../src/messages.ts');
test('every message has a unique id, category, text and concrete action', () => {
  assert.equal(new Set(messages.map(m => m.id)).size, messages.length);
  for (const message of messages) for (const field of ['id', 'category', 'text', 'action']) assert.ok(message[field].trim().length > 0);
});
test('the same local day has one message, regardless of hour', () => {
  assert.equal(messageForDay(new Date(2026, 9, 15, 0, 1)), messageForDay(new Date(2026, 9, 15, 23, 59)));
});
test('all messages rotate through consecutive days and then repeat', () => {
  const cycle = Array.from({ length: messages.length }, (_, i) => messageForDay(new Date(2026, 0, 1 + i)).id);
  assert.equal(new Set(cycle).size, messages.length);
  assert.equal(messageForDay(new Date(2026, 0, 1)), messageForDay(new Date(2026, 0, 1 + messages.length)));
});
