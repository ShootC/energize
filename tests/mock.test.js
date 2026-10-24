import { test } from 'node:test';
import assert from 'node:assert/strict';
import { gradeMockAnswer, mockHeadline, weakestAnswer, mockRequiresNumber } from '../src/engine/mock.js';
import { readJson } from './helpers.js';

const q = (beats, extra = {}) => ({ id: 'm-q', kind: 'values', prompt: 'p', followUp: 'f', par: 90, beats, source: 's', ...extra });

test('number is required when the model answer carries one (or the question says so)', () => {
  assert.equal(mockRequiresNumber(q(['16 nodes', 'a lesson'])), true);
  assert.equal(mockRequiresNumber(q(['an obstruction question first', 'panels drop away'])), false);
  assert.equal(mockRequiresNumber(q(['no digits'], { requiresNumber: true })), true);
});

test('grading: all beats + number inside par = clean; one problem = slipped; more = missed', () => {
  const question = q(['Hook · 3 towers', 'Decision', 'Lesson']);
  assert.equal(gradeMockAnswer(question, { hits: [true, true, true], saidNumber: true, seconds: 80 }).result, 'clean');
  assert.equal(gradeMockAnswer(question, { hits: [true, true, true], saidNumber: false, seconds: 80 }).result, 'slipped');
  assert.equal(gradeMockAnswer(question, { hits: [true, true, true], saidNumber: true, seconds: 120 }).result, 'slipped');
  const missed = gradeMockAnswer(question, { hits: [true, true, false], saidNumber: false, seconds: 80 });
  assert.equal(missed.result, 'missed');
  assert.equal(missed.framework, true, '2 of 3 beats is framework right');
  assert.equal(gradeMockAnswer(question, { hits: [true, false, false], saidNumber: false }).framework, false);
});

test('fill-in beats are never graded', () => {
  const question = q(['Hook · 3 towers', { label: 'Result line', fillIn: true }, 'Lesson']);
  const g = gradeMockAnswer(question, { hits: [true, false, true], saidNumber: true, seconds: 30 });
  assert.equal(g.result, 'clean');
  assert.equal(g.beats, 2);
});

test('headline in the morning-quiz format and the weakest answer', () => {
  const grades = [
    { result: 'clean', framework: true, hit: 5, beats: 5 },
    { result: 'slipped', framework: true, hit: 4, beats: 5 },
    { result: 'missed', framework: true, hit: 3, beats: 5 },
    { result: 'missed', framework: false, hit: 1, beats: 5 },
    { result: 'clean', framework: true, hit: 4, beats: 4 },
  ];
  assert.equal(mockHeadline(grades).text, '4 of 5 framework right · 1 close · 2 clean');
  assert.equal(weakestAnswer(grades), 3);
  assert.equal(weakestAnswer([]), -1);
});

test('every shipped mock question grades clean on a perfect answer', () => {
  const mock = readJson('src/data/mock.json');
  for (const deck of mock.decks) {
    for (const question of deck.questions) {
      const g = gradeMockAnswer(question, { hits: question.beats.map(() => true), saidNumber: true, seconds: question.par });
      assert.equal(g.result, 'clean', question.id);
    }
  }
});
