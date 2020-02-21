console.log('hi');
import {RESULTS} from './scrape_results/results';

import {swingStates, CandidateResult, SwingState, CandidatePoll} from './constants';

const POLL_ORDER =
    ['A+', 'A', 'A-', 'B+', 'A/B', 'B', 'B-', 'B/C', 'C', 'C/D', ''];

const candidateScores: {[candidate: string]: number} = {};
async function main() {
  console.log(RESULTS);

  // Populate results with 50/50 splits.
  const results = populate5050(RESULTS);

  // Go through each candidate to compute a score.
  Object.keys(results).forEach(candidate => {
    console.log('length', results[candidate].length);
    for (const statePollRaw of results[candidate]) {
      const statePoll = statePollRaw as CandidateResult;
      const swingState = getSwingState(statePoll.state);

      // Sort the polls by the poll order.
      statePoll.polls.sort((a: CandidatePoll, b: CandidatePoll) => {
        return POLL_ORDER.indexOf(a.grade) - POLL_ORDER.indexOf(b.grade);
      });
      const bestPoll = statePoll.polls[0];

      const delegatesCandidate =
          swingState.delegates * bestPoll.candidatePercentage / 100;
      // const delegatesTrump =
      //    swingState.delegates * bestPoll.trumpPercentage / 100;
      // console.log(statePoll.state, candidate, delegatesCandidate);
      if (candidateScores[candidate] == null) {
        candidateScores[candidate] = 0;
      }
      candidateScores[candidate] += delegatesCandidate;
    }
  });
  const tuples = [];
  Object.keys(candidateScores).forEach(candidate => {
    tuples.push([candidate, candidateScores[candidate]]);
  });
  tuples.sort((a, b) => b[1] - a[1]);
  console.log(tuples[0]);
  document.getElementById('winner').innerText =
      `#1: ${tuples[0][0]} (${formatNum(tuples[0][1])})`;

  const runnerUps = [];
  tuples.slice(1).forEach((runnerUp, i) => {
    runnerUps.push(`<div class='runnerup'>#${i + 2}: ${runnerUp[0]} (${
        formatNum(runnerUp[1])})</div>`);
  });
  document.getElementById('winners').innerHTML = runnerUps.join('');
}

function getSwingState(state: string): SwingState {
  for (let i = 0; i < swingStates.length; i++) {
    if (swingStates[i].name == state) {
      return swingStates[i];
    }
  }
  throw new Error(`Can't find state ${state}.`);
}

export function populate5050(results: {[name: string]: CandidateResult[]}):
    {[name: string]: CandidateResult[]} {
  console.log('swing states', swingStates.length);
  Object.keys(results).forEach(candidate => {
    if (candidate.length != swingStates.length) {
      swingStates.forEach(swingState => {
        // Check if this state exists in this candidate.
        let exists = false;
        for (const candidateResult of results[candidate]) {
          if (candidateResult.state == swingState.name) {
            exists = true;
          }
        }
        if (!exists) {
          results[candidate].push({
            state: swingState.name,
            polls: [{
              candidatePercentage: 50,
              trumpPercentage: 50,
              date: 'N/A -- fake',
              grade: ''
            }]
          })
        }
      });
    }
  });
  return results;
}
function formatNum(value: number): string {
  return Number(value.toFixed(2)).toString();
}

main();
