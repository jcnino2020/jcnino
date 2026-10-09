(function () {
  'use strict';
  const D = window.BccDemo;
  const $ = id => document.getElementById(id);
  const node = (tag, className, content) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (content !== undefined) element.textContent = String(content);
    return element;
  };
  const button = (label, iconName, action, className = 'button') => {
    const element = node('button', className);
    element.type = 'button';
    if (iconName) {
      const icon = node('i', iconName);
      icon.setAttribute('aria-hidden', 'true');
      element.append(icon);
    }
    element.append(document.createTextNode(label));
    element.addEventListener('click', action);
    return element;
  };
  let user = null;
  try { user = D.user(sessionStorage.getItem(D.SESSION_KEY)); } catch {}
  if (!user) { window.location.replace('index.html'); return; }
  const students = D.USERS.filter(person => person.role === 'student');
  const views = user.role === 'student'
    ? [['overview', 'Overview', 'ri-dashboard-line'], ['grades', 'My grades', 'ri-file-list-3-line'], ['schedule', 'Schedule', 'ri-calendar-line'], ['profile', 'Profile', 'ri-user-line']]
    : [['overview', 'Overview', 'ri-dashboard-line'], ['gradebook', 'Gradebook', 'ri-edit-line'], ['students', 'Students', 'ri-group-line'], ['profile', 'Profile', 'ri-user-line']];
  const copy = {
    overview: ['Overview', 'A summary of the 2025–2026 sample academic record.'],
    grades: ['My grades', 'Second semester · 2025–2026 sample grades.'],
    schedule: ['Class schedule', 'Illustrative timetable for this sample account.'],
    gradebook: ['Gradebook', 'Edit sample midterm and final grades in this browser.'],
    students: ['Students', 'Explore the two sample student records.'],
    profile: ['Profile', 'Sample account details for this demonstration.']
  };
  let active = 'overview';
  let selectedStudent = students[0].id;
  let selectedCourse = D.COURSES[0].code;
  let storage;
  try { storage = window.localStorage; }
  catch { storage = { getItem: () => null, setItem: () => { throw new Error('Storage unavailable'); }, removeItem: () => { throw new Error('Storage unavailable'); } }; }
  function switchRole() {
    try { sessionStorage.removeItem(D.SESSION_KEY); } catch {}
    window.location.assign('index.html');
  }
  $('switch-role').addEventListener('click', switchRole);
  $('mobile-switch-role').addEventListener('click', switchRole);
  $('sidebar-name').textContent = user.name;
  $('sidebar-role').textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1) + ' demo';
  const nav = $('workspace-nav');
  for (const [key, label, icon] of views) {
    const item = button(label, icon, () => show(key), 'nav-button');
    item.dataset.view = key;
    nav.append(item);
  }
  function section(title, description) {
    const wrapper = node('section', 'record-section');
    const head = node('div', 'section-head');
    const titleGroup = node('div');
    titleGroup.append(node('h2', '', title));
    if (description) titleGroup.append(node('p', '', description));
    head.append(titleGroup); wrapper.append(head);
    return { wrapper, head };
  }
  function summary(items) {
    const strip = node('div', 'summary-strip');
    items.forEach(([label, value, note]) => {
      const entry = node('div', 'summary-item');
      entry.append(node('small', '', label), node('strong', '', value));
      if (note) entry.append(node('em', '', note));
      strip.append(entry);
    });
    return strip;
  }
  function table(headers, rows) {
    const scroller = node('div', 'table-scroll');
    const tableElement = node('table');
    const thead = node('thead'); const headRow = node('tr');
    headers.forEach(header => headRow.append(node('th', '', header)));
    thead.append(headRow); tableElement.append(thead);
    const tbody = node('tbody');
    rows.forEach(cells => {
      const row = node('tr');
      cells.forEach(cell => {
        const td = node('td', typeof cell === 'object' ? cell.className || '' : '', typeof cell === 'object' ? cell.text : cell);
        row.append(td);
      });
      tbody.append(row);
    });
    tableElement.append(tbody); scroller.append(tableElement);
    return scroller;
  }
  const fmt = value => value === null ? '—' : Number(value).toFixed(2);
  function gradesTable(studentId, compact = false) {
    const rows = D.COURSES.map(course => {
      const grade = D.record(storage, studentId, course.code);
      return [
        { text: course.code, className: 'course-code' },
        { text: course.title, className: 'course-title' },
        { text: course.units, className: 'numeric' },
        { text: fmt(grade.midterm), className: 'numeric' },
        { text: fmt(grade.final), className: 'numeric' },
        { text: grade.edited ? 'Edited locally' : 'Sample', className: 'cell-muted' }
      ];
    });
    return table(['Code', 'Course', 'Units', 'Midterm', 'Final', 'Record'], compact ? rows.slice(0, 4) : rows);
  }
  function recordNote() { return node('p', 'record-note', 'Demonstration record. These grades are not official, and browser-local edits are not sent to the college.'); }
  function printAction() { $('page-actions').append(button('Print demo copy', 'ri-printer-line', () => window.print())); }
  function studentOverview() {
    const average = D.average(storage, user.id);
    $('workspace-content').append(summary([
      ['Average of shown finals', average === null ? '—' : fmt(average), 'Illustrative calculation'],
      ['Courses', D.COURSES.length, 'Second semester sample'],
      ['Sample units', D.COURSES.reduce((sum, course) => sum + course.units, 0), 'Not an official audit']
    ]));
    const { wrapper, head } = section('Semester at a glance', 'Course values in this browser.');
    const link = button('View all grades', 'ri-arrow-right-line', () => show('grades'), 'compact-action');
    head.append(link); wrapper.append(gradesTable(user.id, true), recordNote());
    $('workspace-content').append(wrapper);
  }
  function studentGrades() {
    printAction();
    $('workspace-content').append(node('p', 'print-only', 'BCC Elite — DEMONSTRATION COPY · NOT AN OFFICIAL TRANSCRIPT'));
    const { wrapper } = section('Second semester grades', 'Sample academic year 2025–2026');
    wrapper.append(gradesTable(user.id), recordNote());
    $('workspace-content').append(wrapper);
  }
  function schedule() {
    const { wrapper } = section('Weekly timetable', 'Illustrative class times and rooms, not a live registration schedule.');
    wrapper.append(table(['Course', 'Title', 'Meeting time', 'Room'], D.COURSES.map(course => [
      { text: course.code, className: 'course-code' }, course.title, course.slot, course.room
    ])), node('p', 'record-note', 'Times and room assignments are sample content for this prototype.'));
    $('workspace-content').append(wrapper);
  }
  function overview() {
    if (user.role === 'student') { studentOverview(); return; }
    const editedCount = Object.values(D.overrides(storage)).reduce((sum, courses) => sum + Object.keys(courses).length, 0);
    $('workspace-content').append(summary([
      ['Sample students', students.length, 'One demonstration cohort'],
      ['Courses in this set', D.COURSES.length, 'Academic year 2025–2026'],
      ['Local grade edits', editedCount, 'Only on this browser']
    ]));
    const { wrapper, head } = section('Student records', 'Choose a student to inspect the demo gradebook.');
    head.append(button('Open gradebook', 'ri-arrow-right-line', () => show('gradebook'), 'compact-action'));
    wrapper.append(studentTable(true), recordNote());
    $('workspace-content').append(wrapper);
    const note = node('section', 'notice-panel');
    note.append(node('h2', '', 'A working demonstration'), node('p', '', 'The sample data can be edited in the gradebook. Changes are saved only in this browser and can be reset at any time.'));
    note.append(button('Enter demo grades', 'ri-edit-line', () => show('gradebook'), 'button primary'));
    $('workspace-content').append(note);
  }
  function studentTable(compact = false) {
    const rows = students.map(student => [
      { text: student.number, className: 'course-code' },
      { text: student.name, className: 'course-title' },
      student.programme,
      { text: fmt(D.average(storage, student.id)), className: 'numeric' },
      'Sample record'
    ]);
    return table(['Student ID', 'Student', 'Programme', 'Shown final avg.', 'Source'], compact ? rows.slice(0, 2) : rows);
  }
  function studentDirectory() {
    const { wrapper } = section('Sample student directory', 'Select a row to open that student in the gradebook.');
    const scroller = studentTable();
    scroller.querySelectorAll('tbody tr').forEach((row, index) => {
      const action = button('Open record', 'ri-arrow-right-line', () => {
        selectedStudent = students[index].id;
        show('gradebook');
      }, 'compact-action');
      const cell = node('td'); cell.append(action); row.append(cell);
    });
    scroller.querySelector('thead tr').append(node('th', '', 'Action'));
    wrapper.append(scroller, recordNote());
    $('workspace-content').append(wrapper);
  }
  function labelledSelect(labelText, id, options, selected) {
    const field = node('div', 'field');
    const label = node('label', '', labelText); label.htmlFor = id;
    const select = node('select'); select.id = id;
    options.forEach(([value, text]) => {
      const option = node('option', '', text); option.value = value; option.selected = selected === value; select.append(option);
    });
    field.append(label, select);
    return { field, select };
  }
  function gradebook() {
    const { wrapper } = section('Edit demonstration grades', 'Select a student and course, then save local sample values.');
    const form = node('form', 'edit-form'); form.id = 'grade-form';
    const selection = node('div', 'field-row');
    const studentField = labelledSelect('Student', 'grade-student', students.map(entry => [entry.id, entry.name + ' · ' + entry.number]), selectedStudent);
    const courseField = labelledSelect('Course', 'grade-course', D.COURSES.map(course => [course.code, course.code + ' · ' + course.title]), selectedCourse);
    selection.append(studentField.field, courseField.field);
    const values = node('div', 'field-row');
    const inputs = ['Midterm grade', 'Final grade'].map((labelText, index) => {
      const field = node('div', 'field');
      const label = node('label', '', labelText); label.htmlFor = index ? 'grade-final' : 'grade-midterm';
      const input = node('input'); input.id = label.htmlFor; input.type = 'number'; input.min = '1'; input.max = '5'; input.step = '0.01'; input.required = true; input.inputMode = 'decimal';
      field.append(label, input); values.append(field); return input;
    });
    const status = node('p', 'form-status'); status.role = 'status';
    function loadValues() {
      selectedStudent = studentField.select.value;
      selectedCourse = courseField.select.value;
      const current = D.record(storage, selectedStudent, selectedCourse);
      inputs[0].value = current?.midterm === null ? '' : fmt(current.midterm);
      inputs[1].value = current?.final === null ? '' : fmt(current.final);
      status.textContent = current?.edited ? 'Showing grades last saved in this browser.' : 'Showing seeded sample grades.';
      status.classList.remove('error');
    }
    studentField.select.addEventListener('change', loadValues);
    courseField.select.addEventListener('change', loadValues);
    form.append(selection, values, button('Save sample grades', 'ri-save-line', () => form.requestSubmit(), 'button primary'), status);
    form.addEventListener('submit', event => {
      event.preventDefault();
      const midterm = Number(inputs[0].value);
      const final = Number(inputs[1].value);
      try {
        D.save(storage, selectedStudent, selectedCourse, midterm, final);
        status.textContent = 'Saved in this browser. Switch to a student view to see the updated sample record.';
        status.classList.remove('error');
        renderStudentGrades();
      } catch (error) {
        status.textContent = error.message.includes('Choose a valid') ? error.message : 'Could not save. Check that browser storage is available, then try again.';
        status.classList.add('error');
      }
    });
    wrapper.append(form); $('workspace-content').append(wrapper);
    const { wrapper: tableWrapper } = section('Selected student record', 'Values update after each successful local save.');
    tableWrapper.id = 'selected-record';
    tableWrapper.append(gradesTable(selectedStudent), recordNote());
    $('workspace-content').append(tableWrapper);
    function renderStudentGrades() {
      tableWrapper.querySelector('.table-scroll').replaceWith(gradesTable(selectedStudent));
    }
    studentField.select.addEventListener('change', renderStudentGrades);
    loadValues();
  }
  function profile() {
    const { wrapper } = section('Sample profile', 'These details are fictional account data for the portal demonstration.');
    const details = node('div', 'record-details');
    [['Name', user.name], ['Role', user.role.charAt(0).toUpperCase() + user.role.slice(1)], ['Sample ID', user.number], ['Email', user.email], ['Programme or unit', user.programme], ['Level', user.year]].forEach(([label, value]) => {
      const line = node('div', 'detail-line'); line.append(node('small', '', label), node('strong', '', value)); details.append(line);
    });
    wrapper.append(details, recordNote()); $('workspace-content').append(wrapper);
  }
  function resetAction() {
    if (user.role === 'admin') $('page-actions').append(button('Reset local grades', 'ri-restart-line', () => {
      if (!window.confirm('Reset all sample grade edits saved in this browser?')) return;
      try { storage.removeItem(D.KEY); show(active); }
      catch { window.alert('Could not reset browser data. Check storage settings and try again.'); }
    }, 'button danger'));
  }
  function show(view, writeHash = true) {
    if (!views.some(([key]) => key === view)) view = 'overview';
    active = view;
    const [title, subtitle] = copy[view];
    $('page-title').textContent = title;
    $('page-subtitle').textContent = subtitle;
    $('page-context').textContent = user.name + ' · ' + (user.role === 'student' ? 'Student' : user.role === 'faculty' ? 'Faculty' : 'Administrator') + ' demo';
    $('page-actions').replaceChildren(); $('workspace-content').replaceChildren();
    nav.querySelectorAll('button').forEach(item => {
      if (item.dataset.view === view) item.setAttribute('aria-current', 'page');
      else item.removeAttribute('aria-current');
    });
    if (view === 'overview') overview();
    if (view === 'grades') studentGrades();
    if (view === 'schedule') schedule();
    if (view === 'gradebook') gradebook();
    if (view === 'students') studentDirectory();
    if (view === 'profile') profile();
    resetAction();
    if (writeHash) history.replaceState(null, '', '#' + view);
    if (writeHash) $('page-title').focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'auto' });
  }
  window.addEventListener('hashchange', () => show(location.hash.slice(1), false));
  show(location.hash.slice(1), false);
})();
