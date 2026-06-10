import { buildTree, pgnExport, pgnImport } from '../src';

const load = (pgn: string) => {
  const analysis = pgnImport(pgn);
  const tree = buildTree(analysis.treeParts[0]);
  return { analysis, tree };
};

describe('PGN comments', () => {
  it('imports and exports root comments', () => {
    const { analysis, tree } = load(`[Event "Root"]\n[Result "*"]\n\n{Study this first} *`);

    expect(tree.root.comments?.[0]?.text).toBe('Study this first');
    expect(
      pgnExport.renderFullTxt({
        data: { game: analysis.game },
        tree,
      }),
    ).toContain('{Study this first} *');
  });

  it('imports and exports comments on moves', () => {
    const { analysis, tree } = load(`[Event "Move"]\n[Result "1-0"]\n\n1. e4 {A flexible move} e5 1-0`);
    const firstMove = tree.root.children[0];

    expect(firstMove.comments?.[0]?.text).toBe('A flexible move');
    expect(
      pgnExport.renderFullTxt({
        data: { game: analysis.game },
        tree,
      }),
    ).toContain('1. e4 {A flexible move} e5 1-0');
  });

  it('imports and exports comments on variation moves', () => {
    const { analysis, tree } = load(`[Event "Variation"]\n[Result "*"]\n\n1. e4 (1. d4 {Queen pawn}) e5 *`);
    const variation = tree.root.children[1];

    expect(variation.san).toBe('d4');
    expect(variation.comments?.[0]?.text).toBe('Queen pawn');
    expect(
      pgnExport.renderFullTxt({
        data: { game: analysis.game },
        tree,
      }),
    ).toContain('(1. d4 {Queen pawn})');
  });

  it('preserves comments before variation moves', () => {
    const { analysis, tree } = load(`[Event "Starting"]\n[Result "*"]\n\n1. e4 ({Try this} 1. d4) e5 *`);
    const variation = tree.root.children[1];

    expect(variation.startingComments?.[0]?.text).toBe('Try this');
    expect(
      pgnExport.renderFullTxt({
        data: { game: analysis.game },
        tree,
      }),
    ).toContain('({Try this} 1. d4)');
  });

  it('keeps clock comments', () => {
    const { analysis, tree } = load(`[Event "Clock"]\n[Result "*"]\n\n1. e4 {[%clk 0:59:59]} e5 *`);

    expect(tree.root.children[0].comments?.[0]?.text).toBe('[%clk 0:59:59]');
    expect(
      pgnExport.renderFullTxt({
        data: { game: analysis.game },
        tree,
      }),
    ).toContain('{[%clk 0:59:59]}');
  });

  it('escapes comment text when exporting', () => {
    const { analysis, tree } = load(`[Event "Escape"]\n[Result "*"]\n\n1. e4 *`);
    tree.setCommentAt({ id: 'escape', text: String.raw`Brace } and slash \\` }, tree.root.children[0].id);

    expect(
      pgnExport.renderFullTxt({
        data: { game: analysis.game },
        tree,
      }),
    ).toContain(String.raw`{Brace \} and slash \\\\}`);
  });

  it('exports comments added through the tree wrapper', () => {
    const { analysis, tree } = load(`[Event "Edit"]\n[Result "*"]\n\n1. e4 e5 *`);
    const path = tree.root.children[0].id + tree.root.children[0].children[0].id;

    tree.setCommentAt({ id: 'note', text: 'Black replies symmetrically' }, path);

    expect(
      pgnExport.renderFullTxt({
        data: { game: analysis.game },
        tree,
      }),
    ).toContain('1. e4 e5 {Black replies symmetrically} *');
  });
});
