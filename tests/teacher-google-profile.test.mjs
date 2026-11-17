import { test } from 'node:test';
import assert from 'node:assert/strict';
import { teacherGoogleProfile } from '../src/lib/teacher-google-profile.ts';

test('returns Google session data only for the matching Google account', () => {
  const session = { id:'google-123', name:'Google Teacher', email:'teacher@gmail.com', image:'https://lh3.googleusercontent.com/a/photo' };
  assert.deepEqual(teacherGoogleProfile('google-123', session), { name:'Google Teacher', email:'teacher@gmail.com', image:'https://lh3.googleusercontent.com/a/photo' });
  assert.equal(teacherGoogleProfile('other', session), null);
  assert.equal(teacherGoogleProfile('local:123', {...session, id:'local:123'}), null);
});
test('rejects unsafe photo URLs and keeps profile data available', () => {
  const session = { id:'123', name:'Teacher', email:'x@example.test', image:'https://lh3.googleusercontent.com.evil.test/photo' };
  assert.equal(teacherGoogleProfile('123', session).image, null);
  assert.equal(teacherGoogleProfile('123', {...session, image:'http://lh3.googleusercontent.com/photo'}).image, null);
  assert.equal(teacherGoogleProfile('123', {...session, image:null}).image, null);
});
