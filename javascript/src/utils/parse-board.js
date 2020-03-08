// @flow

'use strict';

import type { BoardTiles } from '../classes/board';
import Tile from '../classes/tile';

/**
 * Parses a stringified board representation and returns a tile set. Expected format:
 *
 * 3 5 1 6
 * TTTTT
 * TMMMT
 * TTTTT
 *
 * The first number being the definition of the boards width/height.
 *
 * @param {string} board - The stringified board.
 * @returns A parsed tile set.
 */
const parseBoard = (board: string): BoardTiles => {
  const splitFile: string[] = board.split('\n');
  // As the first line in the file is the problem definition, pop that for reference
  const params: string[] = splitFile.shift().split(' ');
  const numRows: number = parseInt(params.shift(), 10);
  const numCols: number = parseInt(params.shift(), 10);
  const minIngredient: number = parseInt(params.shift(), 10);
  const maxSliceSize: number = parseInt(params.shift(), 10);

  const tiles: BoardTiles = [];
  const res = {
    minIngredient: minIngredient,
    maxSliceSize: maxSliceSize,
    tiles: tiles,
  };

  // Iterate through the file and create tiles
  for (var i = 0; i < numRows; i++) {
    tiles[i] = []; // Init empty array within current row
    var row = splitFile.shift().split('');

    for (var j = 0; j < numCols; j++) {
      tiles[i][j] = new Tile({x: j, y: i}, row.shift());
    }
  }

  return res;
};

export default parseBoard;
