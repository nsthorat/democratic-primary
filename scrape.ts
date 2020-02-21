#!/usr/bin/env node

// import * as fetch from 'node-fetch';
const fetch = require('node-fetch');
import {parse} from 'node-html-parser';
import {CandidatePoll, CandidateResult, swingStates} from './constants';

import * as fs from 'fs';

export const candidates: {[name: string]: CandidateResult[]} = {
  'Biden': [],
  'Sanders': [],
  'Warren': [],
  'Bloomberg': [],
  'Buttigieg': [],
  'Klobuchar': []
};

async function main() {
  for (const swingState of swingStates) {
    let result;

    let success = false;
    let tries = 0;
    const MAX_TRIES = 20;
    while (tries < MAX_TRIES && !success) {
      console.log(
          `Making request for '${swingState.name}', try #${tries + 1}...`);

      try {
        result = await fetch(
            'https://projects.fivethirtyeight.com/polls/president-general/' +
            swingState.name + '/');
        success = true;
      } catch (e) {
        tries++;
        if (tries == MAX_TRIES) {
          console.log('Check your wifi tried too many times.');
          process.exit(1);
        }
      }
    }

    const text = await result.text();
    const root: any = parse(text);

    const polls = root.querySelectorAll('.visible-row');

    const candidatePolls: {[candidate: string]: CandidatePoll[]} = {};
    for (const poll of polls) {
      const gradeText = poll.querySelector('.gradeText');
      const grade = gradeText == null ? '' : gradeText.innerHTML;

      const percentages = poll.querySelectorAll('.value');
      const candidatePercentage =
          parseInt(percentages[0].childNodes[0].innerHTML);
      let trumpPercentage: number;
      if (percentages[1] == null) {
        // Expandable next row.
        // Get the next sibling.
        let idx: number;
        for (let i = 0; i < poll.parentNode.childNodes.length; i++) {
          if (poll.parentNode.childNodes[i] == poll) {
            idx = i + 1;
          }
        }
        const nextRow = poll.parentNode.childNodes[idx];
        const percentages = nextRow.querySelectorAll('.value');
        trumpPercentage = parseInt(percentages[0].childNodes[0].innerHTML);
      } else {
        trumpPercentage = parseInt(percentages[1].childNodes[0].innerHTML);
      }

      const dates = poll.querySelectorAll('.date-wrapper');
      const date = dates[0].innerHTML;

      const candidatesQuery = poll.querySelectorAll('.answer');
      const candidateName = candidatesQuery[0].innerHTML;
      // This is Trump
      // console.log(candidatesQuery[1].innerHTML);

      const pollsterQuery =
          poll.querySelector('.pollster-container').querySelectorAll('a');
      const pollName = pollsterQuery[pollsterQuery.length - 1].innerHTML;

      const candidatePoll: CandidatePoll =
          {candidatePercentage, trumpPercentage, grade, date, pollName};
      if (candidatePolls[candidateName] == null) {
        candidatePolls[candidateName] = [];
      }
      candidatePolls[candidateName].push(candidatePoll);
    }
    Object.keys(candidatePolls).forEach(candidateName => {
      if (candidates[candidateName] == null) {
        // No longer in the race.
        return;
      }
      candidates[candidateName].push(
          {state: swingState.name, polls: candidatePolls[candidateName]});
    });
  }

  const candidatesStr = JSON.stringify(candidates, null, 2);
  console.log('Writing results...');
  fs.writeFileSync(
      'scrape_results/results.js', 'export const RESULTS = ' + candidatesStr);
  console.log(candidatesStr);
  console.log('Done.');
}

main();
