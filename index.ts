console.log('hi');
import {RESULTS} from './scrape_results/results';

import {swingStates, CandidateResult, SwingState, CandidatePoll} from './constants';

const POLL_ORDER =
    ['A+', 'A', 'A-', 'B+', 'A/B', 'B', 'B-', 'B/C', 'C', 'C/D', ''];

let sortType: 'date'|'rating' = 'date';

// Populate results with 50/50 splits.
const results = populate5050(RESULTS);

const bydate = document.getElementById('bydate');
bydate.addEventListener('click', () => {
  sortType = 'date';
  bydate.className = 'selected';
  byrating.className = '';
  main();
});
const byrating = document.getElementById('byrating');
byrating.addEventListener('click', () => {
  sortType = 'rating';
  bydate.className = '';
  byrating.className = 'selected';
  main();
});

async function main() {
  const candidateScores: {[candidate: string]: number} = {};

  const bestPolls: Array<{name: string, state: string, poll: CandidatePoll}> =
      [];

  // Go through each candidate to compute a score.
  Object.keys(results).forEach(candidate => {
    for (const statePollRaw of results[candidate]) {
      const statePoll = statePollRaw as CandidateResult;
      const swingState = getSwingState(statePoll.state);

      // Sort the polls by the poll order.
      if (sortType === 'rating') {
        statePoll.polls.sort((a: CandidatePoll, b: CandidatePoll) => {
          return POLL_ORDER.indexOf(a.grade) - POLL_ORDER.indexOf(b.grade);
        });
      }
      if (sortType === 'date') {
        statePoll.polls.sort((a: CandidatePoll, b: CandidatePoll) => {
          return compareDates(a.date, b.date);
        });
      }

      const bestPoll = statePoll.polls[0];
      bestPolls.push({name: candidate, state: statePoll.state, poll: bestPoll});

      const delegatesCandidate =
          swingState.delegates * bestPoll.candidatePercentage / 100;
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

  document.getElementById('swingstates').innerText =
      swingStates
          .map(swingState => `${swingState.name} (${swingState.delegates})`)
          .join(', ');

  const pollText = [];
  pollText.push(
      `<div class='tr'>` +
      `<div class='tc'><b>candidate</b></div>` +
      `<div class='tc'><b>state</b></div>` +
      `<div class='tc'><b>poll name</b></div>` +
      `<div class='tc'><b>candidate</b></div>` +
      `<div class='tc'><b>trump</b></div>` +
      `<div class='tc'><b>grade</b></div>` +
      `<div class='tc'><b>date</b></div>` +
      `</div>`);
  bestPolls.forEach(poll => {
    pollText.push(
        `<div class='tr'>` +
        `<div class='tc'>${poll.name}</div>` +
        `<div class='tc'>${poll.state}</div>` +
        `<div class='tc'>${poll.poll.pollName}</div>` +
        `<div class='tc'>${poll.poll.candidatePercentage}%</div>` +
        `<div class='tc'>${poll.poll.trumpPercentage}%</div>` +
        `<div class='tc'>${poll.poll.grade}</div>` +
        `<div class='tc'>${poll.poll.date}</div>` +
        `</div>`);
  });
  document.getElementById('polls').innerHTML = pollText.join('');
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
              date: 'N/A -- 50/50',
              grade: '',
              pollName: '50/50'
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
function compareDates(a: string, b: string) {
  const parsedA = parseDate(a);
  const parsedB = parseDate(b);

  const RECENT = -1;
  const OLD = 1;
  if (parsedA.year > parsedB.year) {
    return RECENT;
  } else if (parsedA.year < parsedB.year) {
    return OLD
  }

  if (parsedA.month > parsedB.month) {
    return RECENT;
  } else if (parsedA.month < parsedB.month) {
    return OLD;
  }

  if (parsedA.day > parsedA.day) {
    return RECENT;
  } else if (parsedA.day < parsedA.day) {
    return OLD;
  }
  return 0;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov',
  'Dec'
];
function parseDate(date: string): {month: number, day: number, year: number} {
  const split = date.split(',');

  const modaysplit = split[0].split(' ');

  const month = MONTHS.indexOf(modaysplit[0]);
  let day = parseInt(modaysplit[1]);
  if (Number.isNaN(day)) {
    day = -1;
  }
  let year = parseInt(split[1]);
  if (Number.isNaN(year)) {
    year = -1;
  }

  return {month, day, year};
}
main();
