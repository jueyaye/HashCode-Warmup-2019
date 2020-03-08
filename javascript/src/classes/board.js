// @flow

'use strict';

import Tile from './tile';
import TileCoord from './tile';

import Slice from './slice'

/** A two-dimensional array of board tiles. */
export type BoardTiles = Tile[][];

/**
 * Board class.
 */
export default class Board {

  /** Reference to the provided board */
  board: BoardTiles;

  /** The board height */
  height: number;

  /** The board width */
  width: number;

  /** Reference to the goal board */
  minIngredient: number;

  /** The current position of zero */
  maxSliceSize: number;

  constructor(res) {
    this.board = res.tiles;
    this.height = res.tiles.length;
    this.width = res.tiles[0].length;
    this.minIngredient = res.minIngredient;
    this.maxSliceSize = res.maxSliceSize;
  }

  /**
   * Returns a string representation of the board.
   * @returns {string} The board as a string.
   */
  toString(): string {

    var output = '';

    for(var y = 0; y < this.height; y++){
      for(var x = 0; x < this.width; x++){

        var temp = this.getPos({x: x, y: y});
        if(temp.sliceIndex == null) temp.sliceIndex = '--';
        output += temp.ingredientType + ' ' + temp.diversityScore + ' ' + temp.sliceIndex + '\t';
      }

      output += '\n';
    }

    return output;
  }

  isOutOfBounds(pos: TileCoord) {
    if(pos.x >= this.width 
      || pos.y >= this.height) return true;

    if(pos.x < 0 
      || pos.y < 0) return true;

    return false;
  }

  updateDiversityScore() {
    for(var y = 0; y < this.height; y++){
      for(var x =0; x < this.width; x++){  // get elem pos

        var current = this.getPos({x: x, y: y});
        var temp_ds = 0;
        var final_ds = 0;

        // console.log('current', JSON.stringify(current));
        // console.log('minIngredient', this.minIngredient);

        for(var j = (y - this.minIngredient); j <= (y + this.minIngredient); j++){
          for(var i = (x - this.minIngredient); i <= (x + this.minIngredient); i++){

            if(this.isOutOfBounds({x: i, y: j})){
              // console.log('x: ' + i + " y: " + j);
              final_ds++;

            }else{
              var neighbour = this.getPos({x: i, y: j});
              // console.log('neighbour', JSON.stringify(neighbour));

              if(neighbour.ingredientType === 'T'){
                temp_ds++;

              }else{  // ingredientType === 'M'
                temp_ds--;
              }

            }
          }
        }

        // console.log('outofbounds', final_ds);
        final_ds += Math.abs(temp_ds);
        current.setDiversityScore(final_ds); 
      }
    }
  }

  getPos(pos: TypeCoord){
    return this.board[pos.y][pos.x];
  }

  getFlatBoard() {
    return this.board.reduce((prev, cur) => prev.concat(cur));
  };

  clone() {
    return new Board({
      tiles: this.board,
      minIngredient: this.minIngredient,
      maxSliceSize: this.maxSliceSize
    });
  }

  addSlice(slice: Slice, sliceIndex: number) {
    for(var j = slice.pos.y; j < (slice.pos.y + slice.height); j++){
      for(var i = slice.pos.x; i < (slice.pos.x + slice.width); i++){
        this.getPos({x: i, y: j}).sliceIndex = sliceIndex;
      }
    }
  }
}
