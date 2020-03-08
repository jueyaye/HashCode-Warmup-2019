
/**
 * Slices class.
 */
export default class Slice {
	/** Reference to the goal board */
  pos: TileCoord;

  width: number;

  height: number;

  score: number;

  constructor(pos: TileCoord, score: number, width: number, height: number) {
    this.pos = pos;
    this.width = width;
    this.height = height;
    this.score = score;
  }
}