
/** Coordinate reference for the empty tile in a board. */
export type TileCoord = {
  x: number;
  y: number;
};

/**
 * Board class.
 */
export default class Tile {
	/** Reference to the goal board */
  pos: TileCoord;

  /** Ingredient type */
  ingredientType: string;

  /** Diversity score -> mushies to tommies */
  diversityScore: number;

  /** Slice assignment*/
  sliceIndex: number;

  constructor(pos: TileCoord, type: string) {
    this.pos = pos;
    this.ingredientType = type;
    this.diversityScore = null;
    this.sliceIndex = null;
  }

  setDiversityScore(ds: number): boolean{
  	this.diversityScore = ds;
  }

  toString(){
  	return this.ingredientType;
  }
}