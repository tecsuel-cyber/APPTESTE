const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const ts = require('typescript');
function setup({ denied = false, failAt = -1 } = {}) {
  const scheduled = [], canceled = [];
  const notifications = {
    AndroidImportance: { DEFAULT: 3 }, SchedulableTriggerInputTypes: { WEEKLY: 'weekly', TIME_INTERVAL: 'timeInterval' },
    setNotificationHandler() {}, async setNotificationChannelAsync() {},
    async getPermissionsAsync() { return { granted: !denied }; },
    async requestPermissionsAsync() { return { granted: !denied }; },
    async getAllScheduledNotificationsAsync() { return [{ identifier: 'old', content: { data: { daily: true } } }, { identifier: 'unrelated', content: { data: {} } }]; },
    async scheduleNotificationAsync(request) { if (scheduled.length === failAt) throw Error('schedule failed'); scheduled.push(request); return 'new' + scheduled.length; },
    async cancelScheduledNotificationAsync(id) { canceled.push(id); },
  };
  const exports = {};
  const code = ts.transpileModule(fs.readFileSync('src/notifications.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
  vm.runInNewContext(code, { exports, require: name => name === 'expo-notifications' ? notifications : require('../src/messages.ts') });
  return { api: exports, scheduled, canceled };
}
test('daily reminders schedule seven weekdays and replace only owned notifications', async () => {
  const { api, scheduled, canceled } = setup();
  await api.scheduleDaily(8, 30);
  assert.equal(scheduled.length, 7);
  assert.deepEqual(scheduled.map(s => s.trigger.weekday), [1, 2, 3, 4, 5, 6, 7]);
  assert.ok(scheduled.every(s => s.trigger.hour === 8 && s.trigger.minute === 30 && s.content.data.messageId));
  assert.deepEqual(canceled, ['old']);
});
test('permission denial never schedules notifications or deletes the previous schedule', async () => {
  const { api, scheduled, canceled } = setup({ denied: true });
  await assert.rejects(api.scheduleDaily(8, 0), /Permita/);
  assert.equal(scheduled.length, 0); assert.equal(canceled.length, 0);
});
test('partial scheduling failure rolls back new reminders while keeping the previous ones', async () => {
  const { api, canceled } = setup({ failAt: 2 });
  await assert.rejects(api.scheduleDaily(8, 0), /schedule failed/);
  assert.deepEqual(canceled, ['new1', 'new2']);
});
test('disabling reminders preserves unrelated notifications', async () => {
  const { api, canceled } = setup(); await api.cancelDaily(); assert.deepEqual(canceled, ['old']);
});
