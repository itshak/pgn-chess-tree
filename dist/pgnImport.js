"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderPgnError = void 0;
exports.default = default_1;
const fen_1 = require("chessops/fen");
const san_1 = require("chessops/san");
const chessops_1 = require("chessops");
const pgn_1 = require("chessops/pgn");
const chess_1 = require("chessops/chess");
const compat_1 = require("chessops/compat");
const util_1 = require("chessops/util");
const ops_1 = require("./ops");
const mergeNodes = (nodes) => {
    const merged = [];
    for (const node of nodes) {
        const existing = merged.find(n => n.id === node.id);
        if (existing) {
            (0, ops_1.merge)(existing, node);
        }
        else {
            merged.push(node);
        }
    }
    return merged;
};
const commentIdFor = (path, placement, index) => `pgn-${placement}-comment-${path || 'root'}-${index}`;
const importComments = (comments, path, placement) => {
    const imported = (comments || [])
        .map(text => text.trim())
        .filter(Boolean)
        .map((text, index) => ({
        id: commentIdFor(path, placement, index),
        text,
    }));
    return imported.length ? imported : undefined;
};
const playNullMove = (pos) => {
    pos.turn = pos.turn === 'white' ? 'black' : 'white';
    pos.epSquare = undefined;
    pos.halfmoves++;
    if (pos.turn === 'white') {
        pos.fullmoves++;
    }
};
const traverse = (node, pos, ply, parentPath) => {
    const san = node.data.san;
    const isNull = san === '--' || san === 'Z0' || san === 'null';
    let id;
    let playedSan;
    let uci;
    let check = undefined;
    if (isNull) {
        playNullMove(pos);
        id = san;
        playedSan = san;
        uci = '0000';
    }
    else {
        const move = (0, san_1.parseSan)(pos, san);
        if (!move)
            throw new Error(`Can't play ${san} at move ${Math.ceil(ply / 2)}, ply ${ply}`);
        id = (0, compat_1.scalachessCharPair)(move);
        playedSan = (0, san_1.makeSanAndPlay)(pos, move);
        uci = (0, chessops_1.makeUci)(move);
        check = pos.isCheck() ? (0, util_1.makeSquare)(pos.toSetup().board.kingOf(pos.turn)) : undefined;
    }
    const path = parentPath + id;
    const newNode = {
        id,
        ply,
        san: playedSan,
        fen: (0, fen_1.makeFen)(pos.toSetup()),
        uci,
        children: mergeNodes(node.children.map(child => traverse(child, pos.clone(), ply + 1, path))),
        check,
    };
    const comments = importComments(node.data.comments, path, 'comment');
    if (comments)
        newNode.comments = comments;
    const startingComments = importComments(node.data.startingComments, path, 'starting');
    if (startingComments)
        newNode.startingComments = startingComments;
    return newNode;
};
function default_1(pgn) {
    const game = (0, pgn_1.parsePgn)(pgn)[0];
    const headers = new Map(Array.from(game.headers, ([key, value]) => [key.toLowerCase(), value]));
    const start = (0, pgn_1.startingPosition)(game.headers).unwrap();
    const fen = (0, fen_1.makeFen)(start.toSetup());
    const initialPly = (start.toSetup().fullmoves - 1) * 2 + (start.turn === 'white' ? 0 : 1);
    const root = {
        id: '',
        ply: initialPly,
        fen,
        uci: '',
        children: mergeNodes(game.moves.children.map(child => traverse(child, start.clone(), initialPly + 1, ''))),
    };
    const rootComments = importComments(game.comments, '', 'comment');
    if (rootComments)
        root.comments = rootComments;
    const rules = (0, pgn_1.parseVariant)(headers.get('variant')) || 'chess';
    const variantKey = rulesToVariantKey[rules] || rules;
    const variantName = (0, pgn_1.makeVariant)(rules) || variantKey;
    const tags = {};
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
        player: { color: 'white', name: white },
        opponent: { color: 'black', name: black },
        treeParts: [root],
        sidelines: [],
        userAnalysis: true,
    };
}
const rulesToVariantKey = {
    chess: 'standard',
    kingofthehill: 'kingOfTheHill',
    '3check': 'threeCheck',
    racingkings: 'racingKings',
};
const renderPgnError = (error = '') => {
    var _a;
    return `PGN error: ${(_a = {
        [chess_1.IllegalSetup.Empty]: 'empty board',
        [chess_1.IllegalSetup.OppositeCheck]: 'king in check',
        [chess_1.IllegalSetup.PawnsOnBackrank]: 'pawns on back rank',
        [chess_1.IllegalSetup.Kings]: 'king(s) missing',
        [chess_1.IllegalSetup.Variant]: 'invalid Variant header',
    }[error]) !== null && _a !== void 0 ? _a : error}`;
};
exports.renderPgnError = renderPgnError;
