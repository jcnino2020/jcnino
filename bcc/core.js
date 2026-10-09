(function (global) {
  'use strict';
  const KEY = 'bcc-elite-demo-grades-v1';
  const SESSION_KEY = 'bcc-elite-demo-user-v1';
  const USERS = [
    { id: 'student1', role: 'student', name: 'Juan Dela Cruz', email: 'j.delacruz@student.bcc.edu.ph', number: '2023-0001', programme: 'BS in Information Technology', year: 'Year 3 · Section B' },
    { id: 'student2', role: 'student', name: 'Eliza Pineda', email: 'e.pineda@student.bcc.edu.ph', number: '2023-0002', programme: 'BS in Information Technology', year: 'Year 3 · Section B' },
    { id: 'faculty1', role: 'faculty', name: 'Dr. Maria Clara', email: 'm.clara@bcc.edu.ph', number: 'FAC-001', programme: 'Information Technology', year: 'Faculty demo' },
    { id: 'admin', role: 'admin', name: 'System Administrator', email: 'admin@bcc.edu.ph', number: 'ADM-001', programme: 'Academic records', year: 'Administrator demo' }
  ];
  const COURSES = [
    { code: 'IT311', title: 'Web Development 2', units: 3, slot: 'Mon / Wed · 09:00–10:30', room: 'Lab 2' },
    { code: 'IT312', title: 'Database Management Systems 2', units: 3, slot: 'Tue / Thu · 10:30–12:00', room: 'Lab 1' },
    { code: 'IT313', title: 'Networking 1', units: 3, slot: 'Mon / Wed · 13:00–14:30', room: 'Lab 3' },
    { code: 'GE101', title: 'Understanding the Self', units: 3, slot: 'Tue / Thu · 08:00–09:30', room: 'Room 204' },
    { code: 'GE102', title: 'Purposive Communication', units: 3, slot: 'Fri · 09:00–12:00', room: 'Room 211' }
  ];
  const SAMPLE = {
    student1: { IT311: [1.25, 1.50], IT312: [1.75, 1.50], IT313: [2.25, 2.00], GE101: [1.00, 1.25], GE102: [1.50, 1.50] },
    student2: { IT311: [2.25, 2.00], IT312: [1.50, 1.75], IT313: [1.75, 1.75], GE101: [1.25, 1.50], GE102: [2.00, 1.75] }
  };
  const student = id => USERS.find(user => user.id === id && user.role === 'student');
  const user = id => USERS.find(entry => entry.id === id);
  const validGrade = value => value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 1 && value <= 5 && Math.abs(value * 100 - Math.round(value * 100)) < 1e-8);
  function overrides(storage) {
    try {
      const stored = JSON.parse(storage.getItem(KEY) || '{}');
      if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return {};
      const result = {};
      for (const id of Object.keys(SAMPLE)) for (const course of COURSES) {
        const item = stored[id]?.[course.code];
        if (Array.isArray(item) && item.length === 2 && item.every(validGrade)) {
          (result[id] ||= {})[course.code] = item;
        }
      }
      return result;
    } catch { return {}; }
  }
  function record(storage, studentId, courseCode) {
    if (!student(studentId) || !COURSES.some(course => course.code === courseCode)) return null;
    const edited = overrides(storage)[studentId]?.[courseCode];
    const [midterm, final] = edited || SAMPLE[studentId][courseCode];
    return { midterm, final, edited: Boolean(edited) };
  }
  function save(storage, studentId, courseCode, midterm, final) {
    if (!student(studentId) || !COURSES.some(course => course.code === courseCode) || !validGrade(midterm) || !validGrade(final)) throw new Error('Choose a valid student, course and grades from 1.00 to 5.00.');
    const next = overrides(storage);
    (next[studentId] ||= {})[courseCode] = [midterm, final];
    storage.setItem(KEY, JSON.stringify(next));
    return record(storage, studentId, courseCode);
  }
  function average(storage, studentId) {
    if (!student(studentId)) return null;
    const finals = COURSES.map(course => record(storage, studentId, course.code).final).filter(value => value !== null);
    return finals.length ? finals.reduce((sum, value) => sum + value, 0) / finals.length : null;
  }
  global.BccDemo = { KEY, SESSION_KEY, USERS, COURSES, SAMPLE, user, student, validGrade, overrides, record, save, average };
})(window);
