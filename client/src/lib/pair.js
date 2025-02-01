import {
  splat,
  eachKey,
  splatContains,
  arraySplatIndex,
  containsKeys,
} from "lazy-z";

// sort players by points in descending order
// add bye if odd
// group players by points. for groups with an odd number move the last player from the current group
// to the next one
// for each group, find a paiting among them with a new opponent
// - if there is no validset of pairings, merge this group with next
// - unmatch and merge groups if no further matches
// - next try rematch

/**
 * add the sum of score for a player based on field
 * @param {*} player
 * @param {*} field
 * @returns
 */
function splatAdd(player, field) {
  let sum = 0;
  player.results.forEach((obj) => {
    if (obj[field]) sum += obj[field];
  });
  return sum;
}

/**
 * sort by points
 * @param {*} home
 * @param {*} away
 * @returns -1 or 1
 */
function sortPlayers(home, away) {
  if (home.points > away.points) return -1;
  else if (home.points < away.points) return 1;
  else if (
    home.points === away.points &&
    home.gameWinPercentage > away.gameWinPercentage
  )
    return -1;
  else if (
    home.points === away.points &&
    home.gameWinPercentage < away.gameWinPercentage
  )
    return 1;
}

/**
 * group players by points
 * @param {*} players
 * @returns
 */
function groupByPoints(players) {
  let newPlayers = [...players];

  // add points for each player
  newPlayers.forEach((player) => {
    player.points = 0;
    player.results.forEach((round) => {
      if(round.wins === 2) player.points += 3;
    })
    player.gameWinPercentage =
      splatAdd(player, "wins") /
      (splatAdd(player, "losses") +
        splatAdd(player, "wins") +
        splatAdd(player, "draws"));
    if (player.results.length > 0)
      player.opponents = splat(player.results, "opponent_id").filter(
        (id) => id,
      );
  });

  let sortedPlayers = newPlayers.sort(sortPlayers);

  // add bye for uneven nuber
  if (sortedPlayers.length % 2 !== 0) {
    sortedPlayers.push({ id: "BYE", points: 0, results: [] });
    players.forEach((player) => {
      if (splatContains(player.results, "opponent_id", "BYE")) {
        sortedPlayers[sortedPlayers.length - 1].results.push({
          opponent_id: player.id,
        });
      }
    });
  }

  let groupMap = {};

  // create a group for each number of wins
  sortedPlayers.forEach((player) => {
    if (groupMap[player.points]) {
      groupMap[player.points].push(player);
    } else {
      groupMap[player.points] = [player];
    }
  });

  // for each unique number among spread
  let pointSpread = Object.keys(groupMap).reverse();

  // for each item in points
  pointSpread.forEach((score, spreadArrayIndex) => {
    // if the group is not last and the group has an uneven number, move the last item
    // from the current score group into the next score group
    if (
      groupMap[score].length % 2 !== 0 &&
      spreadArrayIndex !== pointSpread.length - 1
    ) {
      groupMap[pointSpread[spreadArrayIndex + 1]].push(groupMap[score].pop());
    }
  });

  return groupMap;
}
/**
 * get random int
 * @param {*} max
 * @returns {number}
 */
function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

// get pairings
function pair(players, shouldBeRandom) {
  let matchups = [];
  let groupedPlayers = groupByPoints(players);

  if (shouldBeRandom) {
    while (groupedPlayers["0"].length > 0) {
      let nextMatch = {
        id: "round-1-match-" + matchups.length,
        home: groupedPlayers["0"].splice(
          getRandomInt(groupedPlayers["0"].length - 1),
          1,
        )[0].id,
      };
      nextMatch.away = groupedPlayers["0"].splice(
        getRandomInt(groupedPlayers["0"].length - 1),
        1,
      )[0].id;
      matchups.push(nextMatch);
    }
  } else {
    // add a flag to tell if the players should be grouped randomly or by results
    eachKey(groupedPlayers, (score, scoreIndex) => {
      let needsRegroup = false;
      groupedPlayers[score].forEach((player, playerIndex) => {
        let hasUnmatchedOpponentInGroup = false;
        groupedPlayers[score].forEach((otherPlayer, otherPlayerIndex) => {
          if (
            otherPlayer.id !== "BYE" &&
            playerIndex !== otherPlayerIndex &&
            !splatContains(otherPlayer.results, "opponent_id", player.id)
          ) {
            hasUnmatchedOpponentInGroup = true;
          }
        });
        if (!hasUnmatchedOpponentInGroup) needsRegroup = true;
      });
      if (needsRegroup && Object.keys(groupedPlayers)[scoreIndex + 1]) {
        groupedPlayers[Object.keys(groupedPlayers)[scoreIndex + 1]] =
          groupedPlayers[Object.keys(groupedPlayers)[scoreIndex + 1]].concat(
            groupedPlayers[score],
          );
        groupedPlayers[score] = [];
      }
    });

    let noPossibleMatches = false;

    // check to see if matches are possible
    eachKey(groupedPlayers, (key) => {
      let possibleOpponentMap = {};
      // for each grouped player
      groupedPlayers[key].forEach((player, playerIndex) => {
        // create a map of possible opponents
        possibleOpponentMap[player.id] = [];
        // for each player
        groupedPlayers[key].forEach((otherPlayer, otherPlayerIndex) => {
          if (
            playerIndex !== otherPlayerIndex && // if it is not the current player
            !splatContains(otherPlayer.results, "opponent_id", player.id) // and the possible opponent and player have not matched
          ) {
            // add the id to the possible opponent map
            possibleOpponentMap[player.id].push(otherPlayer.id);
          }
        });
      });

      // if the number of players is equal to the number of grouped players
      if (
        groupedPlayers[key].length ===
        players.length + (containsKeys(possibleOpponentMap, "BYE") ? 1 : 0)
      ) {
        // check to see if each player has no possible matchups
        let noMatches = 0;
        eachKey(possibleOpponentMap, (id) => {
          if (possibleOpponentMap[id].length === 0) {
            noMatches++;
          }
        });
        if (noMatches === groupedPlayers[key].length) {
          noPossibleMatches = true;
        }
      }
    });

    if (noPossibleMatches) {
      eachKey(groupedPlayers, (key) => {
        if (groupedPlayers[key].length > 0) {
          while (groupedPlayers[key].length > 0) {
            matchups.push({
              home: groupedPlayers[key].splice(
                getRandomInt(groupedPlayers.length),
                1,
              ).id,
              away: groupedPlayers[key].splice(
                getRandomInt(groupedPlayers.length),
                1,
              ).id,
            });
          }
        }
      });
    } else {
      Object.keys(groupedPlayers)
        .reverse()
        .forEach((key) => {
          let nextMatch = {};
          let possibleOpponentMap = {};
          // sort players in group by standing
          groupedPlayers[key].sort(sortPlayers);

          // for each grouped player
          groupedPlayers[key].forEach((player, playerIndex) => {
            // create a map of possible opponents
            possibleOpponentMap[player.id] = [];
            // for each player
            groupedPlayers[key].forEach((otherPlayer, otherPlayerIndex) => {
              if (
                playerIndex !== otherPlayerIndex && // if it is not the current player
                !splatContains(otherPlayer.results, "opponent_id", player.id) // and the possible opponent and player have not matched
              ) {
                // add the id to the possible opponent map
                possibleOpponentMap[player.id].push(otherPlayer.id);
              }
            });
          });

          // sort possible opponents by score based on index
          groupedPlayers[key].forEach((player) => {
            possibleOpponentMap[player.id].sort((home, away) => {
              if (groupedPlayers[key].id === "BYE") {
                return -1;
              } else if (
                arraySplatIndex(groupedPlayers[key], "id", home) <
                arraySplatIndex(groupedPlayers[key], "id", away)
              ) {
                return -1;
              } else if (
                arraySplatIndex(groupedPlayers[key], "id", home) >
                arraySplatIndex(groupedPlayers[key], "id", away)
              ) {
                return 1;
              } return 0;
            });
          });

          // if there are players
          if (groupedPlayers[key].length > 0) {
            // while the group still has players
            while (groupedPlayers[key].length > 0) {
              // next home player becomes first entry
              let nextHome = groupedPlayers[key].splice(
                getRandomInt(groupedPlayers.length),
                1,
              )[0];
              // set next match
              nextMatch.home = nextHome.id;
              nextMatch.id = "match-" + matchups.length;
              let nextAway;

              // for each of the home player's possible opponents
              possibleOpponentMap[nextHome.id]
                .sort((a, b) => {
                  // prioritize pairing with the bye
                  if (a === "BYE") return -1;
                  else return 0;
                })
                .forEach((possibleOpponent) => {
                  if (
                    // if the possible opponent's id is in the list of players still unmatched
                    // and there is no next away player
                    // or if there is only one remaining player
                    (splatContains(
                      groupedPlayers[key],
                      "id",
                      possibleOpponent,
                    ) &&
                      !nextAway) ||
                    groupedPlayers[key].length === 1
                  ) {
                    // remove the next player from the array and make next away
                    nextAway = groupedPlayers[key].splice(
                      arraySplatIndex(
                        groupedPlayers[key],
                        "id",
                        possibleOpponent,
                      ),
                      1,
                    )[0];
                  }
                });

              nextMatch.away = nextAway.id;

              // create matchup
              matchups.push(nextMatch);
              nextMatch = {};
            }
          }
        });
    }
  }
  return matchups;
}

export { groupByPoints, splatAdd, sortPlayers, pair };
