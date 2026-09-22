const assert = require('assert');
const {
  parseWebVTT,
  parseTimestampToSeconds,
  formatSeconds,
  toCleanText,
  toTimestampedText,
  toSRT,
  toVTT,
  toMarkdown,
  toJSON
} = require('../utils/parser.js');

const sampleVTT = `WEBVTT
Kind: captions
Language: en

00:00:01.500 --> 00:00:04.200
<c.colorE5E5E5>Welcome to the Udemy</c> course!

00:00:04.300 --> 00:00:08.750
Today we are going to learn how to build Chrome extensions.

00:00:09.000 --> 00:00:13.100
It is super easy &amp; fun to do.
`;

console.log('Testing parseWebVTT...');
const cues = parseWebVTT(sampleVTT);
assert.strictEqual(cues.length, 3);
assert.strictEqual(cues[0].text, 'Welcome to the Udemy course!');
assert.strictEqual(cues[0].start, 1.5);
assert.strictEqual(cues[0].end, 4.2);
assert.strictEqual(cues[2].text, 'It is super easy & fun to do.');

console.log('Testing formatSeconds...');
assert.strictEqual(formatSeconds(75.321, false), '00:01:15.321');
assert.strictEqual(formatSeconds(75.321, true), '00:01:15,321');
assert.strictEqual(formatSeconds(75.321, false, true), '01:15');
assert.strictEqual(formatSeconds(3665.1, false, true), '01:01:05');

console.log('Testing toCleanText...');
const cleanText = toCleanText(cues);
assert.ok(cleanText.includes('Welcome to the Udemy course! Today we are going to learn'));

console.log('Testing toTimestampedText...');
const timedText = toTimestampedText(cues);
assert.ok(timedText.includes('[00:01] Welcome to the Udemy course!'));
assert.ok(timedText.includes('[00:04] Today we are going to learn'));

console.log('Testing toSRT...');
const srt = toSRT(cues);
assert.ok(srt.includes('1\n00:00:01,500 --> 00:00:04,200\nWelcome to the Udemy course!'));
assert.ok(srt.includes('2\n00:00:04,300 --> 00:00:08,750'));

console.log('Testing toVTT...');
const vtt = toVTT(cues);
assert.ok(vtt.startsWith('WEBVTT'));
assert.ok(vtt.includes('00:00:01.500 --> 00:00:04.200'));

console.log('Testing toMarkdown...');
const md = toMarkdown(cues, {
  courseTitle: 'Python Masterclass',
  lectureTitle: 'Introduction',
  lectureIndex: 1,
  language: 'English'
});
assert.ok(md.includes('# Introduction'));
assert.ok(md.includes('Python Masterclass'));
assert.ok(md.includes('English'));

console.log('Testing toJSON...');
const jsonStr = toJSON(cues, { courseTitle: 'Python Masterclass', lectureTitle: 'Introduction' });
const parsedJson = JSON.parse(jsonStr);
assert.strictEqual(parsedJson.totalCues, 3);
assert.strictEqual(parsedJson.metadata.courseTitle, 'Python Masterclass');

console.log('✅ ALL PARSER TESTS PASSED!');
