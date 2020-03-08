// @flow

'use strict';

import Timer from './classes/timer';
import Board from './classes/board';
import Solver from './classes/solver';
import ParseBoard from './utils/parse-board';
import fs from 'fs';

import type {
  SolverState,
  SolverSolution,
  NotSolvableError,
} from './classes/solver';

// Parse File
const file: string = fs.readFileSync(process.argv[2]).toString();

// Create timer
const timer = new Timer();
console.log('Read file. Solving...');

timer.start();

const res = ParseBoard(file);
timer.save('parseBoard');

const initial = new Board(res);
initial.updateDiversityScore();

const solver = new Solver(initial, res.minIngredients, res.maxSliceSize);
var priorityToFill = solver.board.getFlatBoard()
	.sort(function(a, b){		
		if(b.diversityScore > a.diversityScore) return 1;
		if(b.diversityScore < a.diversityScore) return -1;

		if(b.pos.y < a.pos.y) return 1;
		if(b.pos.y > a.pos.y) return -1;

	});
timer.save('createSolver');

solver.runPreFillStep(priorityToFill);
timer.save('prefill');

solver.optimisationStep();
timer.save('optimisation');

solver.finalise();
const speed = timer.end();
console.log(`\tBoard parsing:\t\t${speed.parseBoard}μs`);
console.log(`\tSolver creation:\t${speed.createSolver}μs`);
console.log(`\tPre-fill step:\t\t${speed.prefill}μs`);
console.log(`\tOptimisation step:\t${speed.optimisation}μs`);

