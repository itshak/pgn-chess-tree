# PGN Chess Tree

`pgn-chess-tree` is a lightweight and powerful JavaScript/TypeScript library for parsing, manipulating, and exporting PGN (Portable Game Notation) chess game data. It provides a comprehensive tree-based structure to manage game variations, making it ideal for applications requiring deep analysis or interactive game playback.

This library is inspired by and adapted from parts of the open-source Lichess.org project, ensuring robust and efficient handling of PGN data.

## Features

-   **PGN Parsing & Exporting**: Easily import PGN strings into a structured game tree and export game trees back into PGN format.
-   **Game Tree Manipulation**: Add, remove, promote, and navigate through game variations with a clear API.
-   **Type-Safe**: Written in TypeScript, providing strong type definitions for a more reliable development experience.
-   **Framework Agnostic**: Designed to work seamlessly with any JavaScript framework, including React, Vue, Angular, or plain JavaScript.

## Installation

Install `pgn-chess-tree` via npm or yarn:

```bash
npm install pgn-chess-tree
# or
yarn add pgn-chess-tree
```

## Usage

## Usage

### Basic PGN Import and Export

```typescript
import { pgnImport, pgnExport, buildTree } from 'pgn-chess-tree';

const pgn = `[Event "Test Game"]
[Site "Example.com"]
[Date "2025.07.14"]
[Round "1"]
[White "Player One"]
[Black "Player Two"]
[Result "1-0"]

1. e4 e5 2. Nf3 Nc6 3. Bc4 Bc5 4. b4 Bxb4 5. c3 Ba5 6. d4 exd4 7. O-O Nge7 8. cxd4 d5 9. exd5 Nxd5 10. Qb3 Nce7 11. Ba3 c6 12. Bxe7 Nxe7 13. Bxf7+ Kf8 14. Bh5 g6 15. Ne5 Kg7 16. Qf7+ Kh6 17. Ng4+ Kg5 18. f4+ Kxh5 19. Nf6+ Kh6 20. g4 g5 21. Qh5+ Kg7 22. Qxg5+ Kf7 23. Qh5+ Kg7 24. g5 Ng6 25. Qh6+ Kf7 26. Qg7+ Kxg7 27. Nh5+ Kf7 28. f5 Ne7 29. g6+ hxg6 30. fxg6+ Ke6 31. Rf6+ Kd7 32. g7 Rg8 33. Rf8 Ng6 34. Nf6+ Ke7 35. Nxg8+ Kd7 36. Nf6+ Ke7 37. g8=Q Nxf8 38. Qg7+ Ke6 39. d5+ Kd6 40. Ne4# 1-0`;

const importedData = pgnImport(pgn);

if (importedData) {
  // The root of the game tree
  const tree = buildTree(importedData.treeParts[0]);

  // Access game metadata
  console.log("White Player:", importedData.game.white?.name);
  console.log("Black Player:", importedData.game.black?.name);
  console.log("Result:", importedData.game.result);

  // Export the game tree back to PGN
  const exportedPgn = pgnExport.renderFullTxt({
    data: { game: importedData.game },
    tree,
  });

  console.log("\nExported PGN:\n", exportedPgn);
}
```

### Manipulating the Game Tree

`pgn-chess-tree` allows for detailed manipulation of the game tree, including adding moves, navigating variations, and managing comments.

```typescript
import { pgnImport, buildTree } from 'pgn-chess-tree';

const pgn = `[Event "Test"]
[Site "Test"]
[Date "2025.07.14"]
[Round "-"]
[White "Player One"]
[Black "Player Two"]
[Result "*"]

1. e4 e5`;

const importedData = pgnImport(pgn);

if (importedData) {
  const tree = buildTree(importedData.treeParts[0]);

  // Navigate to a specific node (e.g., after 1. e4 e5)
  // Node IDs are generated based on the UCI move, e.g., 'e2e4' for 1. e4
  const firstMoveNode = tree.root.children[0]; // 1. e4
  const secondMoveNode = firstMoveNode.children[0]; // 1... e5
  const pathToE5 = firstMoveNode.id + secondMoveNode.id;

  console.log("Current path:", pathToE5);
  const currentNode = tree.nodeAtPath(pathToE5);
  console.log("Current SAN:", currentNode?.san);

  // Add a comment to the current node
  tree.setCommentAt({ id: 'my-comment', text: 'This is a great move!' }, pathToE5);
  console.log("Comment added:", tree.nodeAtPath(pathToE5)?.comments);

  // Add a new variation (e.g., 2. d4 after 1. e4)
  // You would typically get this new node from parsing a new PGN snippet
  // For demonstration, we'll create a dummy node.
  const dummyNewNode: Tree.Node = {
    id: 'd2d4', // UCI for d4
    ply: 3, // Ply after 1. e4 e5
    san: 'd4',
    fen: '', // Actual FEN would be calculated
    uci: 'd2d4',
    children: [],
  };
  const newPath = tree.addNode(dummyNewNode, firstMoveNode.id); // Add after 1. e4
  console.log("New variation added at path:", newPath);
  console.log("Children of 1. e4:", tree.root.children[0].children.map(n => n.san));

  // Promote a variation to the mainline
  // Let's say we want to make 1. d4 the mainline instead of 1. e4
  // This is a more complex operation and usually involves re-ordering children
  // For simplicity, we'll promote the dummy node we just added.
  if (newPath) {
    tree.promoteAt(newPath, true);
    console.log("New mainline after promotion:", tree.root.children[0].san);
  }
}
```





## API Reference

### `pgnImport(pgn: string): AnalyseData | undefined`

Parses a PGN string and returns an `AnalyseData` object containing the game's metadata and the root of the game tree. Returns `undefined` if parsing fails.

PGN comments are preserved:
- Root comments before the first move are stored on `tree.root.comments`.
- Comments after a move are stored on that move node's `comments`.
- Comments before a move, such as comments at the start of a variation, are stored on that move node's `startingComments`.

**Parameters**:
- `pgn`: The PGN string to parse.

**Returns**:
- `AnalyseData | undefined`: An object containing game data and the tree, or `undefined`.

### `pgnExport.renderFullTxt(ctrl: { data: { game: Game }, tree: TreeWrapper }): string`

Exports a game tree and its associated game data into a PGN string.
Root comments, move comments, and starting comments are rendered back into PGN with comment escaping.

**Parameters**:
- `ctrl`: An object containing:
  - `data.game`: The `Game` object with metadata.
  - `tree`: The `TreeWrapper` instance representing the game tree.

**Returns**:
- `string`: The PGN string representation of the game.

### `buildTree(rootNode: Tree.Node): TreeWrapper`

Constructs a `TreeWrapper` instance from a root `Tree.Node`, providing methods for navigating and manipulating the game tree.

**Parameters**:
- `rootNode`: The root node of the game tree, typically obtained from `pgnImport`'s `treeParts[0]`.

**Returns**:
- `TreeWrapper`: An object with methods to interact with the game tree.

### `TreeWrapper` Methods

The `TreeWrapper` object returned by `buildTree` provides the following key methods:

-   `nodeAtPath(path: Tree.Path): Tree.Node | undefined`:
    Retrieves a node at a specific path in the tree. A `Tree.Path` is a string concatenation of node IDs (UCI moves).

-   `getNodeList(path: Tree.Path): Tree.Node[]`:
    Returns an array of nodes from the root to the node at the specified path.

-   `addNode(node: Tree.Node, parentPath: Tree.Path): Tree.Path | undefined`:
    Adds a new node (move) to the tree at the given parent path. Returns the new node's full path if successful.

-   `setCommentAt(comment: Tree.Comment, path: Tree.Path): void`:
    Adds or updates a comment at a specific node.

-   `deleteCommentAt(id: string, path: Tree.Path): void`:
    Deletes a comment from a specific node by its ID.

-   `promoteAt(path: Tree.Path, toMainline: boolean): void`:
    Promotes a variation at the given path. If `toMainline` is `true`, it attempts to make the variation the new mainline.

-   `deleteNodeAt(path: Tree.Path): void`:
    Deletes the node at the specified path and all its children.

### Type Definitions

Key interfaces and types used throughout the library:

```typescript
// src/types.ts

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
  status: { id: number; name: string };
  turns: number;
  variant: { key: VariantKey; name: string; short: string };
  result?: string;
  white?: { name: string };
  black?: { name: string };
}

export interface Player {
  color: string;
  name?: string;
}

export type VariantKey =
  | 'standard'
  | 'chess960'
  | 'kingOfTheHill'
  | 'threeCheck'
  | 'antichess'
  | 'atomic'
  | 'horde'
  | 'racingKings'
  | 'crazyhouse';

export type Ply = number;
export type San = string;
export type Uci = string;
export type Square = string;
export type Eval = { cp: number, best: San };

declare global {
  namespace Tree {
    interface Node {
      id: string; // UCI move, e.g., 'e2e4'
      ply: Ply;
      san?: San; // Standard Algebraic Notation
      fen: string; // FEN after the move
      uci: Uci; // Universal Chess Interface move
      children: Node[]; // Variations
      eval?: Eval; // Evaluation data
      check?: Square; // Square of the king if in check
      dests?: string; // Possible destinations for pieces (Lichess specific)
      drops?: string; // Possible drops for pieces (Crazyhouse specific)
      comments?: Comment[];
      startingComments?: Comment[];
      glyphs?: Glyph[];
      clock?: Clock;
      shapes?: Shape[];
      forceVariation?: boolean; // Indicates a forced variation
    }

    type Path = string; // Concatenation of node IDs

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
```
