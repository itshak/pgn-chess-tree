export interface AnalyseData {
    game: Game;
    player: Player;
    opponent: Player;
    treeParts: Tree.Node[];
    sidelines: Tree.Node[][];
    userAnalysis: boolean;
}
export interface Game {
    fen: string;
    id: string;
    opening: any;
    player: any;
    status: {
        id: number;
        name: string;
    };
    turns: number;
    variant: {
        key: VariantKey;
        name: string;
        short: string;
    };
    result?: string;
    white?: {
        name: string;
    };
    black?: {
        name: string;
    };
    event?: string;
    site?: string;
    date?: string;
    round?: string;
    whiteElo?: string;
    blackElo?: string;
    timeControl?: string;
    termination?: string;
    tags: Record<string, string>;
}
export interface Player {
    color: string;
    name?: string;
}
export type VariantKey = 'standard' | 'chess960' | 'kingOfTheHill' | 'threeCheck' | 'antichess' | 'atomic' | 'horde' | 'racingKings' | 'crazyhouse';
export type Ply = number;
export type San = string;
export type Uci = string;
export type Square = string;
export type Eval = {
    cp: number;
    best: San;
};
declare global {
    namespace Tree {
        interface Node {
            id: string;
            ply: Ply;
            san?: San;
            fen: string;
            uci: Uci;
            children: Node[];
            eval?: Eval;
            check?: Square;
            dests?: string;
            drops?: string;
            comments?: Comment[];
            startingComments?: Comment[];
            glyphs?: Glyph[];
            clock?: Clock;
            shapes?: Shape[];
            forceVariation?: boolean;
        }
        type Path = string;
        interface Comment {
            id: string;
            text: string;
        }
        interface Glyph {
            symbol: string;
            name: string;
        }
        interface Clock {
            white: number;
            black: number;
        }
        interface Shape {
            orig: string;
            dest?: string;
            brush: string;
            piece?: string;
        }
    }
}
