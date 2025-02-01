import {
  carve,
  arraySplatIndex,
  containsKeys,
  eachKey,
  keys,
  lazyZstate,
  splatContains,
  transpose,
  contains,
  splat,
} from "lazy-z";
import { groupByPoints, pair, sortPlayers } from "./pair.js";

function initState(updateCallback) {
  this.state = new lazyZstate();

  this.state.setUpdateCallback(() => {
    if (updateCallback) updateCallback();
  });

  this.state.logs = [];

  this.state.addLog = (
    stateName,
    stateFunctionName,
    stateData,
    componentProps,
  ) => {
    this.state.logs.push({
      stateName: stateName,
      stateFunctionName: stateFunctionName,
      stateData: stateData,
      componentProps: componentProps,
    });
  };

  this.state.newField("events", {
    init: (state) => {
      state.store.events = [];
    },
    create: (state, stateData) => {
      stateData.players = [];
      stateData.rounds = [];
      state.store.events.push(stateData);
      this.state.addLog("events", "create", stateData, {});
      state.update();
    },
    save: (state, stateData, componentProps) => {
      let currentEvent = state.events.lookup(componentProps.data.id);
      transpose(stateData, currentEvent);
      this.state.addLog("events", "save", stateData, componentProps);
      state.update();
    },
    delete: (state, stateData, componentProps) => {
      carve(state.store.events, "id", componentProps.data.id);
      this.state.addLog("events", "delete", {}, componentProps);
      state.update();
    },
    subComponents: {
      players: {
        create: (state, stateData) => {
          let event = state.events.lookup(stateData.event_id);
          let newPlayerId = `${event.id}-player-${event.players.length + 1}`;
          if (splatContains(event.players, "id", newPlayerId)) {
            stateData.id = newPlayerId + "-1";
          } else {
            stateData.id = newPlayerId;
          }
          stateData.results = [];
          delete stateData.event_id;
          event.players.push(stateData);
          this.state.addLog("events.players", "create", stateData, {});
          state.update();
        },
        save: (state, stateData, componentProps) => {
          let event = state.events.lookup(componentProps.data.event_id);
          let player = event.players.find(
            (player) => player.id === componentProps.data.id,
          );
          transpose(stateData, player);
          this.state.addLog("events.players", "save", stateData, {});
          state.update();
        },
        delete: (state, stateData, componentProps) => {
          let event = state.events.lookup(componentProps.data.event_id);
          carve(event.players, "id", componentProps.data.id);
          this.state.addLog("events.players", "delete", stateData, {});
          state.update();
        },
      },
      rounds: {
        create: (state, stateData) => {
          let event = state.events.lookup(stateData.event_id);
          event.rounds.push({
            round: stateData?.round || event.rounds.length + 1,
            pairings: stateData.pairings,
          });
          this.state.addLog("events.rounds", "create", stateData, {});
          state.update();
        },
        // save: (state, stateData, componentProps) => {
        //   let event = state.events.lookup(stateData.event_id);
        //   event.rounds[componentProps.existingRoundIndex] = stateData;
        //   state.update();
        // },
      },
    },
  });

  this.state.events.lookup = (event_id) => {
    return this.state.store.events.find((event) => event.id === event_id);
  };

  this.state.events.rounds.score = (params) => {
    let { event_id, playerId, field, score, roundIndex, pairingIndex } = params;
    let event = this.state.events.lookup(event_id);
    let player = { ...event.players.find((person) => person.id === playerId) };
    let opponent = {
      ...event.players.find(
        (person) => person.id === player.results[roundIndex].opponent_id,
      ),
    };

    if (field === "drop") {
      player.results[roundIndex].drop = score;
      player.drop = score;
    } else if (field === "draws") {
      player.results[roundIndex][field] = score;
      opponent.results[roundIndex][field] = score;
    } else {
      player.results[roundIndex][field] = score;
      opponent.results[roundIndex].losses = score;
    }

    this.state.events.players.save(player, {
      data: { event_id: event_id, id: player.id },
    });
  };

  /**
   * create pairings for a round
   * @param {string} event_id
   */
  this.state.events.rounds.pair = (event_id, existingRoundIndex) => {
    let event = this.state.events.lookup(event_id);
    event.players.forEach((player) => {
      player.results.push({ wins: 0, losses: 0, draws: 0 });
    });

    let allPlayers = [...event.players].filter(
      (player) => player.drop !== true,
    );
    let matchups = pair(allPlayers, event.rounds.length === 0);
    matchups.forEach((match) => {
      if (contains([match.home, match.away], "BYE")) {
        let byeResults = event.players.find(
          (player) =>
            player.id === (match.home === "BYE" ? match.away : match.home),
        ).results[event.rounds.length];
        byeResults.wins = 2;
        byeResults.opponent_id = "BYE";
      } else {
        // set home opponent id
        event.players.find((player) => player.id === match.home).results[
          event.rounds.length
        ].opponent_id = match.away;
        // set away player id
        event.players.find((player) => player.id === match.away).results[
          event.rounds.length
        ].opponent_id = match.home;
      }
    });
    // if (existingRoundIndex) {
    //   this.state.events.rounds.save(
    //     {
    //       event_id: event_id,
    //       pairings: matchups,
    //     },
    //     {
    //       existingRoundIndex: existingRoundIndex,
    //       event_id: event_id,
    //       round: existingRoundIndex,
    //     },
    //   );
    // } else

    this.state.events.rounds.create({
      event_id: event_id,
      pairings: matchups,
    });
    this.state.update();
  };

  this.state.events.scoreTop8 = (event_id, matchId, playerId) => {
    let event = this.state.events.lookup(event_id);
    let round = matchId.split("-")[1];
    let placement = matchId.split("-")[2];
    if (round === "8") {
      if (placement === "1") {
        event.top8[1][0].home = playerId;
      } else if (placement === "2") {
        event.top8[1][0].away = playerId;
      } else if (placement === "3") {
        event.top8[1][1].home = playerId;
      } else {
        event.top8[1][1].away = playerId;
      }
    } else if (round === "4") {
      if (placement === "1") {
        event.top8[2][0].home = playerId;
      } else {
        event.top8[2][0].away = playerId;
      }
    } else {
      event.top8[3][0].winner = playerId;
    }
    this.state.update();
  };

  this.state.events.cutToTop8 = (event_id) => {
    let event = this.state.events.lookup(event_id);
    let groupedPlayers = groupByPoints(event.players);
    let playersWithStats = [];
    eachKey(groupedPlayers, (key) => {
      groupedPlayers[key].forEach((player) => {
        playersWithStats.push(player);
      });
    });
    // sort all players by score and win percentage
    let top8 = playersWithStats.sort(sortPlayers).slice(0, 8);
    let top8Matches = [];
    while (top8.length > 0) {
      top8Matches.push({
        home: top8.shift().id,
        id: "top-8-" + (top8Matches.length + 1),
        away: top8.pop().id,
      });
    }
    event.top8 = [
      top8Matches,
      [
        {
          home: undefined,
          id: "top-4-1",
          away: undefined,
        },
        {
          home: undefined,
          id: "top-4-2",
          away: undefined,
        },
      ],
      [
        {
          home: undefined,
          id: "top-2-1",
          away: undefined,
        },
      ],
      [
        {
          winner: undefined,
          id: "winner",
        },
      ],
    ];
    this.state.update();
  };

  /**
   * update an existing pairing
   * @param { string } event_id
   * @param { number } roundIndex
   * @param { number } pairingIndex
   * @param { object } stateData
   * @param { string } stateData.player_id
   * @param { string } stateData.player can be home or away
   */
  this.state.events.rounds.updatePairing = (
    event_id,
    roundIndex,
    pairingIndex,
    stateData,
  ) => {
    let { player, player_id } = stateData;
    let event = this.state.events.lookup(event_id);
    let oldPairing = event.rounds[roundIndex].pairings[pairingIndex];
    let movedPlayer = oldPairing[player];
    oldPairing[player] = player_id;

    let playerMap = {};
    event.rounds[roundIndex].pairings.forEach((pair, index) => {
      ["home", "away"].forEach((key) => {
        if (index !== pairingIndex && pair[key] === player_id) {
          pair[key] = movedPlayer;
        }
        playerMap[pair[key]] = {
          vs: key === "home" ? "away" : "home",
          pair: index,
        };
      });
    });
    event.players.forEach((person) => {
      if (person.id === player_id) {
        ["wins", "losses", "draws"].forEach((field) => {
          person.results[roundIndex][field] = 0;
        });
      }

      person.results[roundIndex].opponent_id =
        event.rounds[roundIndex].pairings[playerMap[person.id].pair][
          playerMap[person.id].vs
        ];

      if (
        event.rounds[roundIndex].pairings[playerMap[person.id].pair][
          playerMap[person.id].vs
        ] === "BYE"
      ) {
        person.results[roundIndex] = {
          wins: 2,
          losses: 0,
          draws: 0,
          opponent_id: "BYE",
        };
      }
    });
    this.state.addLog("events.rounds", "updatePairing", stateData, {
      pairingIndex: pairingIndex,
      roundIndex: roundIndex,
      event_id: event_id,
    });
    this.state.update();
  };
  return this.state;
}

export default initState;
