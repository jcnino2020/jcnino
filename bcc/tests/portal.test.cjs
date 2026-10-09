const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { JSDOM, VirtualConsole } = require('jsdom');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function page(file, id, grades) {
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => {
    if (!error.message.startsWith('Not implemented: navigation')) throw error;
  });
  const dom = new JSDOM(read(file), { url: 'http://localhost/bcc/' + file, runScripts: 'outside-only', virtualConsole });
  const window = dom.window;
  window.scrollTo = () => {};
  window.confirm = () => true;
  window.print = () => { window.printed = true; };
  window.eval(read('core.js'));
  if (id) window.sessionStorage.setItem(window.BccDemo.SESSION_KEY, id);
  if (grades) window.localStorage.setItem(window.BccDemo.KEY, grades);
  window.eval(read(file === 'index.html' ? 'entry.js' : 'dashboard.js'));
  return { dom, window, $: name => window.document.getElementById(name) };
}
const nav = (page, view) => page.window.document.querySelector(`[data-view="${view}"]`).click();
const edit = (page, midterm, final) => {
  page.$('grade-midterm').value = midterm;
  page.$('grade-final').value = final;
  page.$('grade-form').dispatchEvent(new page.window.Event('submit', { bubbles: true, cancelable: true }));
};

const p = page('index.html');
assert.equal(p.window.document.querySelectorAll('[data-user]').length, 3);
p.window.document.querySelector('[data-user=student1]').click();
assert.equal(p.window.sessionStorage.getItem(p.window.BccDemo.SESSION_KEY), 'student1');
assert.match(p.window.document.body.textContent, /sample accounts and grades/i);

const student = page('dashboard.html', 'student1');
assert.equal(student.$('page-title').textContent, 'Overview');
assert.equal(student.window.document.querySelectorAll('[data-view]').length, 4);
assert.equal(student.window.document.querySelector('[data-view=gradebook]'), null);
nav(student, 'grades');
assert.equal(student.window.document.activeElement.id, 'page-title');
assert.equal(student.window.document.querySelectorAll('tbody tr').length, 5);
assert.match(student.$('workspace-content').textContent, /NOT AN OFFICIAL TRANSCRIPT/);
student.$('page-actions').querySelector('button').click();
assert.equal(student.window.printed, true);
nav(student, 'schedule');
assert.match(student.$('workspace-content').textContent, /Illustrative class times/);
nav(student, 'profile');
assert.match(student.$('workspace-content').textContent, /Juan Dela Cruz/);

const faculty = page('dashboard.html', 'faculty1');
assert.equal(faculty.window.document.querySelector('[data-view=schedule]'), null);
nav(faculty, 'gradebook');
assert.equal(faculty.$('grade-student').value, 'student1');
assert.equal(faculty.$('grade-course').value, 'IT311');
edit(faculty, '1.10', '1.20');
assert.match(faculty.$('grade-form').textContent, /Saved in this browser/);
assert.equal(faculty.window.BccDemo.record(faculty.window.localStorage, 'student1', 'IT311').final, 1.2);
assert.match(faculty.$('selected-record').textContent, /Edited locally/);
faculty.$('grade-student').value = 'student2';
faculty.$('grade-student').dispatchEvent(new faculty.window.Event('change'));
assert.equal(faculty.$('grade-midterm').value, '2.25');
edit(faculty, '0', '6');
assert.equal(faculty.window.BccDemo.record(faculty.window.localStorage, 'student2', 'IT311').midterm, 2.25);
assert.equal(faculty.window.BccDemo.validGrade(1.1), true);
assert.equal(faculty.window.BccDemo.validGrade(1.234), false);
nav(faculty, 'students');
assert.equal(faculty.window.document.querySelectorAll('tbody tr').length, 2);
faculty.window.document.querySelector('tbody .compact-action').click();
assert.equal(faculty.$('grade-student').value, 'student1');

const saved = faculty.window.localStorage.getItem(faculty.window.BccDemo.KEY);
const studentAfterEdit = page('dashboard.html', 'student1', saved);
nav(studentAfterEdit, 'grades');
assert.match(studentAfterEdit.$('workspace-content').textContent, /1\.20/);
assert.match(studentAfterEdit.$('workspace-content').textContent, /Edited locally/);

const admin = page('dashboard.html', 'admin', saved);
assert.equal(admin.window.document.querySelector('[data-view=students]') !== null, true);
admin.window.confirm = () => false;
admin.$('page-actions').querySelector('.danger').click();
assert.equal(admin.window.localStorage.getItem(admin.window.BccDemo.KEY), saved);
admin.window.confirm = () => true;
admin.$('page-actions').querySelector('.danger').click();
assert.equal(admin.window.localStorage.getItem(admin.window.BccDemo.KEY), null);
assert.equal(admin.window.BccDemo.record(admin.window.localStorage, 'student1', 'IT311').final, 1.5);
admin.window.localStorage.setItem(admin.window.BccDemo.KEY, '{invalid');
assert.equal(admin.window.BccDemo.record(admin.window.localStorage, 'student1', 'IT311').final, 1.5);

for (const item of [p, student, faculty, studentAfterEdit, admin]) item.dom.window.close();
console.log('Passed: three role paths, student grades and schedule, faculty grade entry, validation, cross-role local persistence, sample print label, and confirmed reset.');
