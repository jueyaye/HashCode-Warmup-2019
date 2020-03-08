// @flow
// @todo: Add check to determine if a puzzle is possible or not

"use strict";

import Board from "./board";
import Slice from "./slice";
import Tile from "./tile";

import fs from "fs";

export default class Solver {
  /** The starting board we are solving for */
  board: Board;
  possibleSlices: Slice[];
  orderOfSlices: Slice[];

  constructor(initial: Board) {
    this.board = initial;
    this.possibleSlices = this.getPossibleSlices();
    this.orderOfSlices = [];
  }

  /**
   * Get all the available slices for the current configuiration.
   */
  getPossibleSlices() {
    const minSliceArea = this.board.minIngredient * 2;

    var possibleSlices = [];
    for (var i = 1; i <= this.board.maxSliceSize; i++) {
      // i as in width
      for (var j = 1; j <= this.board.maxSliceSize; j++) {
        // j as in height

        var sliceArea = i * j;

        if (sliceArea >= minSliceArea && sliceArea <= this.board.maxSliceSize) {
          possibleSlices.push(new Slice(null, null, i, j));
        }
      }
    }

    return possibleSlices;
  }

  // ------------------------- START PREFILL STEP -------------------------

  /**
   * Validate the slice is valid; min ingredients, within bounds, etc.
   */
  validateSlice(slice: Slice, newSlices: Array<Slice>) {
    var score = 0;
    var mushiesCount = 0;
    var tommiesCount = 0;
    var overlap = false;
    var bounded = true;

    for (var j = slice.pos.y; j < slice.pos.y + slice.height; j++) {
      for (var i = slice.pos.x; i < slice.pos.x + slice.width; i++) {
        if (
          slice.pos.x + slice.width <= this.board.width &&
          slice.pos.y + slice.height <= this.board.height &&
          slice.pos.x >= 0 &&
          slice.pos.y >= 0
        ) {
          var inspectee = this.board.getPos({ x: i, y: j });
          // console.log(inspectee);
          if (inspectee.ingredientType === "M") {
            mushiesCount++;
          } else {
            tommiesCount++;
          }

          slice.score += inspectee.diversityScore;

          if (inspectee.sliceIndex != null) {
            overlap = true;
          }
        } else {
          bounded = false;
        }
      }
    }

    // if valid... update board
    if (
      mushiesCount >= this.board.minIngredient &&
      tommiesCount >= this.board.minIngredient &&
      !overlap &&
      bounded
    ) {
      slice.score += Math.abs(slice.height - slice.width); // weight the solver to pick not squares
      slice.score /= slice.width * slice.height; // weight score to pick smaller blocks
      newSlices.push(slice);
    }
  }

  /**
   * Get the possible slices at this possition.
   */
  getValidSlices(current: TileCoord) {
    var newSlices = [];

    // score possible slices
    for (var i = 0; i < this.possibleSlices.length; i++) {
      var slice = this.possibleSlices[i];

      for (var yShift = 0; yShift < slice.height; yShift++) {
        // translate vertical... up
        for (var xShift = 0; xShift < slice.width; xShift++) {
          // translat horizontal... left

          var sliceOrigin = {
            x: current.pos.x - xShift,
            y: current.pos.y - yShift
          };

          // slice = this.possibleSlices[1];
          var slice = new Slice(sliceOrigin, 0, slice.width, slice.height);
          // scan slice (minIngredients, no overlaps);

          this.validateSlice(slice, newSlices, this.board);
        }
      }
    }

    return newSlices;
  }

  /**
   * Initially attempt to group the hardest to fit pieces whilst consuming the minimum
   * amount of space.
   */
  runPreFillStep(priorityToFill: Array<Slice>) {
    while (priorityToFill.length > 0) {
      var current = priorityToFill.shift();

      if (current.sliceIndex == null) {
        // unassigned

        var validSlices = this.getValidSlices(current);
        validSlices.sort((a, b) => b.score - a.score);

        if (validSlices.length > 0) {
          // no new slices

          // greedily just add the highest weighted slice from the pile
          this.board.addSlice(validSlices[0], this.orderOfSlices.length);
          this.orderOfSlices.push(validSlices[0]);
        } else {
          // no slice possible at this possition... skipping
        }
      } else {
        // ingredient in slice skip
      }

      // ---  logging ---
      var percentage =
        ((this.board.width * this.board.height - priorityToFill.length) /
          (this.board.width * this.board.height)) *
        100;
      if (percentage % 10 == 0)
        process.stdout.write(
          "Assigning priority slices:  " + percentage + "%\r"
        );
    }

    process.stdout.write("\n");
  }

  // ------------------------- END PREFILL STEP -------------------------

  // ------------------------- START OPTIMISATION STEP -------------------------

  /**
   * Create a set of single row/col expansions which cover the remaining missing ingredients...
   *
   *  ->  In a super suboptimal way this method looks at everything missing ingredient and builds
   *      possible slices around the ingredient. There, therefore is a lot of redundancy introduced
   *      when comparing the expansion set against pre-filled set especially when the number of
   *      missing ingredients increases and the max size of the slices expands
   *  ->  A perhaps better attempt at this solution would look to build expansions from the slices
   *      Instead of from the missing ingredients...
   */
  createExpansionSet(missed: Array<TileCoord>) {
    var missingSlices = [];

    while (missed.length > 0) {
      var homelessBoy = missed.shift();
      var fillers = [];
      for (var fillerH = 1; fillerH < this.board.maxSliceSize; fillerH++) {
        fillers.push(new Slice(homelessBoy.pos, fillerH, 1, fillerH));
      }
      for (var fillerW = 2; fillerW < this.board.maxSliceSize; fillerW++) {
        fillers.push(new Slice(homelessBoy.pos, fillerW, fillerW, 1));
      }

      for (var i = 0; i < fillers.length; i++) {
        var slice = fillers[i];
        var valid = true;

        for (var j = slice.pos.y; j < slice.pos.y + slice.height; j++) {
          for (var i = slice.pos.x; i < slice.pos.x + slice.width; i++) {
            if (
              slice.pos.x + slice.width <= this.board.width &&
              slice.pos.y + slice.height <= this.board.height &&
              slice.pos.x >= 0 &&
              slice.pos.y >= 0
            ) {
              var inspectee = this.board.getPos({ x: i, y: j });
              // console.log(inspectee);
              if (inspectee.sliceIndex != null) {
                valid = false;
                break;
              }
            } else {
              valid = false;
              break;
            }
          }
          if (!valid) {
            break;
          }
        }

        if (valid) {
          missingSlices.push(slice);
        }
      }
    }

    return missingSlices;
  }

  /**
   * Attempt to attach missing slice to the left/right
   */
  lookAlongHeight(match: String, search: Number, child: Slice) {
    var valid = true;

    for (
      var filterY = child.pos.y + 1;
      filterY < child.pos.y + child.height;
      filterY++
    ) {
      if (match !== this.board.getPos({ x: search, y: filterY }).sliceIndex) {
        valid = false;
        break;
      }
    }

    var parent = this.orderOfSlices[match - 1];
    if (
      valid &&
      match != null &&
      this.orderOfSlices[match - 1].height == child.height &&
      parent.height * parent.width + child.height * child.width <=
        this.board.maxSliceSize
    ) {
      return true;
    }

    return false;
  }

  /**
   * Attempt to attach missing slice to the up/down
   */
  lookAlongWidth(match: String, search: Number, child: Slice) {
    var valid = true;

    for (
      var filterX = child.pos.x + 1;
      filterX < child.pos.x + child.wdith;
      filterX++
    ) {
      if (match !== this.board.getPos({ x: filterX, y: search }).sliceIndex) {
        valid = false;
        break;
      }
    }

    var parent = this.orderOfSlices[match - 1];
    if (
      valid &&
      match != null &&
      this.orderOfSlices[match - 1].width == child.width &&
      parent.height * parent.width + child.height * child.width <=
        this.board.maxSliceSize
    ) {
      return true;
    }

    return false;
  }

  /**
   * Attempt to combine 'missing' slices and pre-fill slices
   *
   *  -> Again in the name of sub-optimisation this method takes every
   *     missing slice and looks laterally for valid slices to attach to.
   *  -> This approach assumes that there are ~far less missing slices than
   *     there are pre-fill slices...
   */
  attachMissingSlices(missingSlices: Array<Slice>) {
    var originalHomeless = missingSlices.length;
    var loopCounter = 0;
    var arrayMoving = 0;

    while (missingSlices.length > 0) {
      if (missingSlices.length == arrayMoving) loopCounter++; // infinite loop prevention
      if (loopCounter > originalHomeless) break;

      var child = missingSlices.shift();
      var found = false;

      // look for parent the left
      if (!found && child.pos.x - 1 >= 0) {
        var searchLeft = child.pos.x - 1;
        var match = this.board.getPos({ x: searchLeft, y: child.pos.y })
          .sliceIndex;

        found = this.lookAlongHeight(match, searchLeft, child);
      }

      // look for parent the right
      if (!found && child.pos.x + child.width < this.board.width) {
        var searchRight = child.pos.x + child.width;
        var match = this.board.getPos({ x: searchRight, y: child.pos.y })
          .sliceIndex;

        found = this.lookAlongHeight(match, searchRight, child);
      }

      // look for parent up
      if (!found && child.pos.y - 1 >= 0) {
        var searchUp = child.pos.y - 1;
        var match = this.board.getPos({ x: child.pos.x, y: searchUp })
          .sliceIndex;

        found = this.lookAlongWidth(match, searchUp, child);
      }

      // look for parent down
      if (!found && child.pos.y + child.height < this.board.height) {
        var searchDown = child.pos.y + child.height;
        var match = this.board.getPos({ x: child.pos.x, y: searchDown })
          .sliceIndex;

        found = this.lookAlongWidth(match, searchDown, child);
      }

      if (found) {
        loopCounter = 0; // reset loop counter on successfuly finding a home...
        originalHomeless = missingSlices.length; // update complete lookover limit

        // Update the slice
        for (var j = child.pos.y; j < child.pos.y + child.height; j++) {
          for (var i = child.pos.x; i < child.pos.x + child.width; i++) {
            this.board.getPos({ x: i, y: j }).sliceIndex = match;
          }
        }

        // Reasign the slice dimensions
        var updatee = this.orderOfSlices[match - 1];
        if (updatee.width != child.width)
          this.orderOfSlices[match - 1] += child.width;
        // update height
        if (updatee.height != child.height)
          this.orderOfSlices[match - 1] += child.height;
        // ...should only ever update one
      } else {
        missingSlices.push(child);
        arrayMoving = missingSlices.length;
      }
    }
  }

  /**
   * Attempt to optimise the remaining space by expanding where possible.
   *
   *  -> The current implementation greedily attempts to expand with the largest
   *     available expansion.
   *  -> This could be further optimised... idk how though lmao :'(
   */
  optimisationStep() {
    // identify the ingredients which are yet to be assigned
    var filter = this.board;
    var missed = [];

    var score = 0;
    filter.board.forEach(function(row) {
      row.forEach(function(col) {
        if (col.sliceIndex != null) {
          score++;
        } else {
          missed.push(col);
        }
      });
    });

    // ---  logging ---
    console.log("pre optimisation score:", score);

    // Build expansion set...
    var missingSlices = this.createExpansionSet(missed);

    // Prioritise missing slices based on area covered
    missingSlices.sort((a, b) => b.score - a.score);

    // expand/attach missing slices to prefill slices
    this.attachMissingSlices(missingSlices);
  }

  // ------------------------- END OPTIMISATION STEP -------------------------

  // ------------------------- START FINALISATION STEP -------------------------

  finalise() {
    var final = this.board;

    var score = 0;
    final.board.forEach(function(row) {
      row.forEach(function(col) {
        if (col.sliceIndex != null) {
          score++;
        }
      });
    });

    console.log("post optimisation score:", score);

    // write to a new file named test.txt
    fs.writeFile("test.txt", this.board.toString(), err => {
      // throws an error, you could also catch it here
      if (err) throw err;

      // success case, the file was saved
      console.log("done!");
    });
  }

  // ------------------------- END FINALISATION STEP -------------------------
}
