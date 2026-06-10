import { pgnImport } from '../src';

it('should parse a pgn', () => {
  const pgn = '[Event "Test"]\n[Site "Test"]\n[Date "2025.07.13"]\n[Round "-"]\n[White "Test"]\n[Black "Test"]\n[Result "*"]\n\n1. e4 e5 *';
  const result = pgnImport(pgn);
  expect(result.game?.turns).toBe(1);
});

it('should parse a pgn with null/Z0 moves', () => {
  const pgn = '[Event "Test"]\n[Result "*"]\n\n1. Z0 {Intro comment} (1. e4 e5) *';
  const result = pgnImport(pgn);
  expect(result.treeParts[0].children[0].san).toBe('--');
  expect(result.treeParts[0].children[0].uci).toBe('0000');
});

it('should merge sibling variations starting with the same move', () => {
  const pgn = `[Result "*"]\n\n1. Z0 (1. e4 e5) (1. e4 c5) *`;
  const result = pgnImport(pgn);
  const root = result.treeParts[0];
  // Root children: 1. -- and 1. e4 (merged)
  expect(root.children).toHaveLength(2);
  expect(root.children[0].san).toBe('--');
  expect(root.children[1].san).toBe('e4');
  // Under e4, children: e5 and c5
  expect(root.children[1].children).toHaveLength(2);
  expect(root.children[1].children[0].san).toBe('e5');
  expect(root.children[1].children[1].san).toBe('c5');
});
