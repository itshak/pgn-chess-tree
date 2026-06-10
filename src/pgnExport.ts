import { INITIAL_FEN } from 'chessops/fen';
import { Game } from './types';
import { fixCrazySan } from './utils';
import { TreeWrapper } from './tree';

interface AnalyseCtrl {
  data: { game: Game };
  tree: TreeWrapper;
}

const plyPrefix = (node: Tree.Node): string =>
  `${Math.floor((node.ply + 1) / 2)}${node.ply % 2 === 1 ? '. ' : '... '}`;

const escapeComment = (text: string): string => text.replace(/\\/g, '\\\\').replace(/}/g, '\\}');

const renderComments = (comments: Tree.Comment[] | undefined): string =>
  (comments || [])
    .map(comment => comment.text.trim())
    .filter(Boolean)
    .map(text => `{${escapeComment(text)}}`)
    .join(' ');

const appendPart = (text: string, part: string): string => {
  if (!part) return text;
  return text ? `${text} ${part}` : part;
};

const renderMoveTxt = (node: Tree.Node, forcePly: boolean): string => {
  let text = renderComments(node.startingComments);
  const moveText = `${forcePly || node.ply % 2 === 1 ? plyPrefix(node) : ''}${fixCrazySan(node.san!)}`;
  text = appendPart(text, moveText);
  return appendPart(text, renderComments(node.comments));
};

function renderNodesTxt(node: Tree.Node, forcePly: boolean): string {
  let s = node.san ? '' : renderComments(node.comments);
  if (node.children.length === 0) return s;

  const first = node.children[0];
  s = appendPart(s, renderMoveTxt(first, forcePly || first.ply % 2 === 1));

  for (let i = 1; i < node.children.length; i++) {
    const child = node.children[i];
    s += ` (${renderMoveTxt(child, true)}`;
    const variation = renderNodesTxt(child, false);
    if (variation) s += ' ' + variation;
    s += ')';
  }

  const mainline = renderNodesTxt(first, node.children.length > 1);
  if (mainline) s += ' ' + mainline;

  return s;
}

function renderPgnTags(game: Game): string {
  const standardTags: Array<[string, string | undefined]> = [
    ['Event', game.event],
    ['Site', game.site],
    ['Date', game.date],
    ['Round', game.round],
    ['White', game.white?.name],
    ['Black', game.black?.name],
    ['Result', game.result],
    ['WhiteElo', game.whiteElo],
    ['BlackElo', game.blackElo],
    ['TimeControl', game.timeControl],
    ['Termination', game.termination],
  ];

  const allTags: Array<[string, string]> = [];

  // Add all tags from game.tags first
  for (const key in game.tags) {
    if (Object.prototype.hasOwnProperty.call(game.tags, key)) {
      allTags.push([key, game.tags[key]]);
    }
  }

  // Override with standard tags if they exist
  for (const [key, value] of standardTags) {
    if (value !== undefined) {
      const existingIndex = allTags.findIndex(tag => tag[0] === key);
      if (existingIndex !== -1) {
        allTags[existingIndex] = [key, value];
      } else {
        allTags.push([key, value]);
      }
    }
  }

  if (game.variant.key !== 'standard') {
    const existingIndex = allTags.findIndex(tag => tag[0] === 'Variant');
    if (existingIndex !== -1) {
      allTags[existingIndex] = ['Variant', game.variant.name];
    } else {
      allTags.push(['Variant', game.variant.name]);
    }
  }
  if (game.fen && game.fen !== INITIAL_FEN) {
    const existingIndex = allTags.findIndex(tag => tag[0] === 'FEN');
    if (existingIndex !== -1) {
      allTags[existingIndex] = ['FEN', game.fen];
    } else {
      allTags.push(['FEN', game.fen]);
    }
  }

  let txt = '';
  for (const [key, value] of allTags) {
    txt += `[${key} "${value}"]\n`;
  }
  return txt ? txt + '\n' : '';
}

export function renderFullTxt(ctrl: AnalyseCtrl): string {
  const g = ctrl.data.game;
  const moves = renderNodesTxt(ctrl.tree.root, true);
  return `${renderPgnTags(g)}${moves}${moves ? ' ' : ''}${g.result}`;
}

export function renderVariationPgn(game: Game, nodeList: Tree.Node[]): string {
  const filteredNodeList = nodeList.filter(node => node.san);
  if (filteredNodeList.length === 0) return '';

  let variationPgn = '';

  const first = filteredNodeList[0];
  variationPgn += `${renderMoveTxt(first, true)} `;

  for (let i = 1; i < filteredNodeList.length; i++) {
    const node = filteredNodeList[i];
    variationPgn += `${renderMoveTxt(node, node.ply % 2 === 1)} `;
  }

  return renderPgnTags(game) + variationPgn;
}
