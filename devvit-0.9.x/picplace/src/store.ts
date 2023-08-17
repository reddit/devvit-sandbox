import { KeyValueStorage } from "@devvit/public-api";
import { Metadata } from "@devvit/protos";

import { Puzzle } from "./types.js";

const kvstore = new KeyValueStorage();

export async function storePuzzle(puzzle: Puzzle, md: Metadata): Promise<void> {
  await kvstore.put(`puzzle-${puzzle.id}`, puzzle, md);
}

export async function getPuzzle(id: string, md: Metadata): Promise<Puzzle> {
  const puzzle = await kvstore.get(`puzzle-${id}`, md);
  return puzzle as Puzzle;
}
