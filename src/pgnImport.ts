import { makeFen } from 'chessops/fen';
import { makeSanAndPlay, parseSan } from 'chessops/san';
import { makeUci, Rules } from 'chessops';
import {
  makeVariant,
  parsePgn,
  parseVariant,
  startingPosition,
  type ChildNode,
  type PgnNodeData,
} from 'chessops/pgn';
import { IllegalSetup, type Position } from 'chessops/chess';
import { scalachessCharPair } from 'chessops/compat';
import { makeSquare } from 'chessops/util';
import type { AnalyseData, Player, VariantKey, Ply } from './types';

const commentIdFor = (path: string, placement: 'comment' | 'starting', index: number): string =>
  `pgn-${placement}-comment-${path || 'root'}-${index}`;

const importComments = (
  comments: string[] | undefined,
  path: string,
  placement: 'comment' | 'starting',
): Tree.Comment[] | undefined => {
  const imported = (comments || [])
    .map(text => text.trim())
    .filter(Boolean)
    .map((text, index) => ({
      id: commentIdFor(path, placement, index),
      text,
    }));
  return imported.length ? imported : undefined;
};

const playNullMove = (pos: any): void => {
  pos.turn = pos.turn === 'white' ? 'black' : 'white';
  pos.epSquare = undefined;
  pos.halfmoves++;
  if (pos.turn === 'white') {
    pos.fullmoves++;
  }
};

const traverse = (node: ChildNode<PgnNodeData>, pos: Position, ply: Ply, parentPath: Tree.Path): Tree.Node => {
  const san = node.data.san;
  const isNull = san === '--' || san === 'Z0' || san === 'null';

  let id: string;
  let playedSan: string;
  let uci: string;
  let check: any = undefined;

  if (isNull) {
    playNullMove(pos);
    id = san;
    playedSan = san;
    uci = '0000';
  } else {
    const move = parseSan(pos, san);
    if (!move) throw new Error(`Can't play ${san} at move ${Math.ceil(ply / 2)}, ply ${ply}`);
    id = scalachessCharPair(move);
    playedSan = makeSanAndPlay(pos, move);
    uci = makeUci(move);
    check = pos.isCheck() ? makeSquare(pos.toSetup().board.kingOf(pos.turn)!) : undefined;
  }

  const path = parentPath + id;
  const newNode: Tree.Node = {
    id,
    ply,
    san: playedSan,
    fen: makeFen(pos.toSetup()),
    uci,
    children: node.children.map(child => traverse(child, pos.clone(), ply + 1, path)),
    check,
  };

  const comments = importComments(node.data.comments, path, 'comment');
  if (comments) newNode.comments = comments;

  const startingComments = importComments(node.data.startingComments, path, 'starting');
  if (startingComments) newNode.startingComments = startingComments;

  return newNode;
};

export default function (pgn: string): AnalyseData {
  const game = parsePgn(pgn)[0];
  const headers = new Map(Array.from(game.headers, ([key, value]) => [key.toLowerCase(), value]));
  const start = startingPosition(game.headers).unwrap();
  const fen = makeFen(start.toSetup());
  const initialPly = (start.toSetup().fullmoves - 1) * 2 + (start.turn === 'white' ? 0 : 1);

  const root: Tree.Node = {
    id: '',
    ply: initialPly,
    fen,
    uci: '',
    children: game.moves.children.map(child => traverse(child, start.clone(), initialPly + 1, '')),
  };

  const rootComments = importComments(game.comments, '', 'comment');
  if (rootComments) root.comments = rootComments;

  const rules: Rules = parseVariant(headers.get('variant')) || 'chess';
  const variantKey: VariantKey = rulesToVariantKey[rules] || rules;
  const variantName = makeVariant(rules) || variantKey;

  const tags: Record<string, string> = {};
  for (const [key, value] of game.headers) {
    tags[key] = value;
  }

  const white = tags.White;
  const black = tags.Black;
  const event = tags.Event;
  const site = tags.Site;
  const date = tags.Date;
  const round = tags.Round;
  const whiteElo = tags.WhiteElo;
  const blackElo = tags.BlackElo;
  const timeControl = tags.TimeControl;
  const termination = tags.Termination;

  return {
    game: {
      fen,
      id: 'synthetic',
      opening: undefined, // TODO
      player: start.turn,
      result: tags.Result || '*-',
      status: { id: 20, name: 'started' },
      turns: root.children.length > 0 ? Math.ceil(root.children[root.children.length - 1].ply / 2) : 0,
      variant: {
        key: variantKey,
        name: variantName,
        short: variantName,
      },
      white: white ? { name: white } : undefined,
      black: black ? { name: black } : undefined,
      event: event || undefined,
      site: site || undefined,
      date: date || undefined,
      round: round || undefined,
      whiteElo: whiteElo || undefined,
      blackElo: blackElo || undefined,
      timeControl: timeControl || undefined,
      termination: termination || undefined,
      tags,
    },
    player: { color: 'white', name: white } as Player,
    opponent: { color: 'black', name: black } as Player,
    treeParts: [root],
    sidelines: [],
    userAnalysis: true,
  };
}

const rulesToVariantKey: { [key: string]: VariantKey } = {
  chess: 'standard',
  kingofthehill: 'kingOfTheHill',
  '3check': 'threeCheck',
  racingkings: 'racingKings',
};

export const renderPgnError = (error: string = '') =>
  `PGN error: ${
    {
      [IllegalSetup.Empty]: 'empty board',
      [IllegalSetup.OppositeCheck]: 'king in check',
      [IllegalSetup.PawnsOnBackrank]: 'pawns on back rank',
      [IllegalSetup.Kings]: 'king(s) missing',
      [IllegalSetup.Variant]: 'invalid Variant header',
    }[error] ?? error
  }`;
