

export interface SwingState {
  name: string;
  delegates: number;
}
// https://www.archives.gov/electoral-college/allocation
export const swingStates: SwingState[] = [
  {name: 'colorado', delegates: 9}, {name: 'florida', delegates: 29},
  {name: 'iowa', delegates: 6}, {name: 'michigan', delegates: 16},
  {name: 'minnesota', delegates: 10}, {name: 'ohio', delegates: 18},
  {name: 'new-hampshire', delegates: 4},
  {name: 'north-carolina', delegates: 15},
  {name: 'pennsylvania', delegates: 20}, {name: 'virginia', delegates: 13},
  {name: 'wisconsin', delegates: 10}
];

export interface CandidateResult {
  state: string;
  polls: CandidatePoll[];
}
export interface CandidatePoll {
  candidatePercentage: number;
  trumpPercentage: number;
  date: string;
  grade: string;
  pollName: string;
}
