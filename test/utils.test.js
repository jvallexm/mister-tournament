import initState from "../client/src/lib/utils.js";
import { assert } from "chai";
import { splatContains } from "lazy-z";
import { groupByPoints } from "../client/src/lib/pair.js";

describe("state", () => {
  let testState;
  beforeEach(() => {
    testState = new initState(() => {});
    testState.events.create({
      name: "event",
      id: "id",
    });
  });
  it("should add an event", () => {
    assert.deepEqual(
      testState.store.events,
      [
        {
          name: "event",
          id: "id",
          players: [],
          rounds: [],
        },
      ],
      "it should do the thing",
    );
    assert.deepEqual(
      testState.logs,
      [
        {
          stateName: "events",
          stateFunctionName: "create",
          stateData: { name: "event", id: "id", players: [], rounds: [] },
          componentProps: {},
        },
      ],
      "it should do the thing",
    );
    assert.deepEqual();
  });
  it("should update an event", () => {
    testState.events.save({ name: "event2" }, { data: { id: "id" } });
    assert.deepEqual(
      testState.store.events,
      [
        {
          name: "event2",
          id: "id",
          players: [],
          rounds: [],
        },
      ],
      "it should do the thing",
    );
  });
  it("should delete an event", () => {
    testState.events.delete({}, { data: { id: "id" } });
    assert.deepEqual(testState.store.events, [], "it should do the thing");
  });
  describe("players", () => {
    beforeEach(() => {
      testState = new initState();
      testState.events.create({
        name: "event",
        id: "id",
      });
      testState.events.players.create({ event_id: "id", name: "player-1" });
    });
    it("should create a new player", () => {
      assert.deepEqual(
        testState.store.events[0].players,
        [{ id: "id-player-1", name: "player-1", results: [] }],
        "it should add a new player",
      );
    });
    it("should update an existing player", () => {
      testState.events.players.save(
        { event_id: "id", name: "Player 1" },
        {
          data: {
            id: "id-player-1",
            event_id: "id",
          },
        },
      );
      assert.deepEqual(
        testState.store.events[0].players,
        [{ event_id: "id", id: "id-player-1", name: "Player 1", results: [] }],
        "it should add a new player",
      );
    });
    it("should delete a player", () => {
      testState.events.players.delete(
        {},
        {
          data: {
            id: "id-player-1",
            event_id: "id",
          },
        },
      );
      assert.deepEqual(
        testState.store.events[0].players,
        [],
        "it should add a new player",
      );
    });
    it("should create a player with a unique id when adding a new player after deleting an existing one", () => {
      testState.events.players.create({ event_id: "id", name: "player-2" });
      testState.events.players.delete(
        {},
        {
          data: {
            id: "id-player-1",
            event_id: "id",
          },
        },
      );
      testState.events.players.create({ event_id: "id", name: "player-2" });
      assert.deepEqual(
        testState.store.events[0].players,
        [
          { id: "id-player-2", name: "player-2", results: [] },
          {
            id: "id-player-2-1",
            name: "player-2",
            results: [],
          },
        ],
        "it should add a new player",
      );
    });
  });
  describe("events.rounds", () => {
    describe("events.rounds.pair", () => {
      beforeEach(() => {
        testState = new initState();
        testState.events.create({
          name: "event",
          id: "id",
        });
        testState.events.players.create({ event_id: "id", name: "player-1" });
        testState.events.players.create({ event_id: "id", name: "player-2" });
        testState.events.players.create({ event_id: "id", name: "player-3" });
        testState.events.players.create({ event_id: "id", name: "player-4" });
      });
      it("should initially pair players randomly", () => {
        testState.events.rounds.pair("id");
        assert.deepEqual(
          testState.store.events[0].rounds[0].pairings.length,
          2,
          "it should set two rounds",
        );
        assert.deepEqual(
          testState.store.events[0].players.length,
          4,
          "it should not modify players",
        );
      });

      it("should initially pair players randomly with a bye", () => {
        testState.events.players.create({ event_id: "id", name: "player-5" });
        testState.events.rounds.pair("id");
        assert.deepEqual(
          testState.store.events[0].rounds[0].pairings.length,
          3,
          "it should set two rounds",
        );
        assert.deepEqual(
          testState.store.events[0].players.length,
          5,
          "it should not modify players",
        );
      });

      it("should set results for player when giving a bye at time of pairing", () => {
        [2, 3, 4].forEach((player) => {
          testState.events.players.delete(
            {},
            {
              data: {
                id: "id-player-" + player,
                event_id: "id",
              },
            },
          );
        });
        testState.events.rounds.pair("id");
        assert.deepEqual(
          testState.store.events[0].players[0].results,
          [
            {
              opponent_id: "BYE",
              wins: 2,
              losses: 0,
              draws: 0,
            },
          ],
          "it should set results",
        );
      });

      describe("subsequent rounds", () => {
        beforeEach(() => {
          testState = new initState();
          testState.events.create({
            name: "event",
            id: "id",
          });
          testState.events.players.create({ event_id: "id", name: "player-1" });
          testState.events.players.create({ event_id: "id", name: "player-2" });
        });

        it("should create pairings based on results", () => {
          testState.events.players.create({ event_id: "id", name: "player-3" });
          testState.events.players.create({ event_id: "id", name: "player-4" });
          testState.events.rounds.pair("id");
          testState.store.events[0].players[0].results[0].opponent_id =
            "id-player-2";
          testState.store.events[0].players[1].results[0].opponent_id =
            "id-player-1";
          testState.store.events[0].players[2].results[0].opponent_id =
            "id-player-4";
          testState.store.events[0].players[3].results[0].opponent_id =
            "id-player-3";
          testState.store.events[0].rounds[0] = {
            round: 1,
            pairings: [
              {
                home: {
                  event_id: "id",
                  name: "player-4",
                  id: "id-player-4",
                },
                away: {
                  event_id: "id",
                  name: "player-3",
                  id: "id-player-3",
                },
              },
              {
                home: {
                  event_id: "id",
                  name: "player-2",
                  id: "id-player-2",
                },
                away: {
                  event_id: "id",
                  name: "player-1",
                  id: "id-player-1",
                },
              },
            ],
          };
          testState.events.rounds.score({
            event_id: "id",
            playerId: "id-player-1",
            field: "wins",
            score: 2,
            roundIndex: 0,
            pairingIndex: 0,
          });
          testState.events.rounds.score({
            event_id: "id",
            playerId: "id-player-3",
            field: "wins",
            score: 2,
            roundIndex: 0,
            pairingIndex: 0,
          });
          testState.events.rounds.pair("id");
          assert.deepEqual(
            testState.store.events[0].players[0].results[0].opponent_id,
            "id-player-2",
            "it should have player 2 as opponent",
          );
          assert.deepEqual(
            testState.store.events[0].rounds[1],
            {
              round: 2,
              pairings: [
                {
                  home: "id-player-1",
                  away: "id-player-3",
                  id: "match-0",
                },
                {
                  home: "id-player-2",
                  away: "id-player-4",
                  id: "match-1",
                },
              ],
            },
            "it should create a new pairing",
          );
        });

        it("should create pairings based on results with a bye", () => {
          testState.events.players.create({ event_id: "id", name: "player-3" });
          testState.events.players.create({ event_id: "id", name: "player-4" });
          testState.events.players.create({ event_id: "id", name: "player-5" });
          testState.events.rounds.pair("id");
          testState.store.events[0].players[0].results[0].opponent_id =
            "id-player-2";
          testState.store.events[0].players[1].results[0].opponent_id =
            "id-player-1";
          testState.store.events[0].players[2].results[0].opponent_id =
            "id-player-4";
          testState.store.events[0].players[3].results[0].opponent_id =
            "id-player-3";
          testState.store.events[0].rounds[0] = {
            round: 1,
            pairings: [
              {
                home: "id-player-4",
                away: "id-player-3",
              },
              {
                home: "id-player-2",
                away: "id-player-1",
              },
              {
                home: "id-player-5",
                away: "BYE",
              },
            ],
          };
          testState.store.events[0].players = [
            {
              name: "player-1",
              id: "id-player-1",
              results: [
                {
                  wins: 2,
                  losses: 0,
                  draws: 0,
                  opponent_id: "id-player-2",
                },
              ],
            },
            {
              name: "player-2",
              id: "id-player-2",
              results: [
                {
                  wins: 0,
                  losses: 2,
                  draws: 0,
                  opponent_id: "id-player-1",
                },
              ],
            },
            {
              name: "player-3",
              id: "id-player-3",
              results: [
                {
                  wins: 2,
                  losses: 1,
                  draws: 0,
                  opponent_id: "id-player-4",
                },
              ],
            },
            {
              name: "player-4",
              id: "id-player-4",
              results: [
                {
                  wins: 1,
                  losses: 2,
                  draws: 0,
                  opponent_id: "id-player-3",
                },
              ],
            },
            {
              name: "player-5",
              id: "id-player-5",
              results: [
                {
                  opponent_id: "BYE",
                  wins: 2,
                  losses: 0,
                  draws: 0,
                },
              ],
            },
          ];
          testState.events.rounds.pair("id");

          assert.deepEqual(
            testState.store.events[0].rounds[1],
            {
              round: 2,
              pairings: [
                {
                  away: "id-player-5",
                  home: "id-player-1",
                  id: "match-0",
                },
                {
                  home: "id-player-3",
                  away: "BYE",
                  id: "match-1",
                },
                {
                  away: "id-player-2",
                  home: "id-player-4",
                  id: "match-2",
                },
              ],
            },
            "it should create a new pairing",
          );
        });

        it("should never pair a player who has already had a bye with the bye even if they have the worst score", () => {
          testState.events.players.create({ event_id: "id", name: "player-3" });
          testState.events.players.create({ event_id: "id", name: "player-4" });
          testState.events.players.create({ event_id: "id", name: "player-5" });
          testState.events.rounds.pair("id");
          testState.store.events[0].rounds[0].pairings = [
            {
              home: "id-player-1",
              away: "id-player-2",
            },
            {
              home: "id-player-3",
              away: "id-player-4",
            },
            {
              home: "id-player-5",
              away: "BYE",
            },
          ];
          testState.store.events[0].players[0].results[0] = {
            opponent_id: "id-player-2",
            wins: 2,
            losses: 1,
            draws: 0,
          };
          testState.store.events[0].players[1].results[0] = {
            opponent_id: "id-player-1",
            wins: 1,
            losses: 2,
            draws: 0,
          };
          testState.store.events[0].players[2].results[0] = {
            opponent_id: "id-player-4",
            wins: 2,
            losses: 0,
            draws: 0,
          };
          testState.store.events[0].players[3].results[0] = {
            opponent_id: "id-player-3",
            wins: 0,
            losses: 2,
            draws: 0,
          };
          testState.store.events[0].players[4].results[0] = {
            opponent_id: "BYE",
            wins: 0,
            losses: 0,
            draws: 0,
          };
          testState.events.rounds.pair("id");

          assert.isFalse(
            testState.store.events[0].players[4].results[1].opponent_id ===
              "BYE",
            "it should not pair with the bye",
          );
        });

        it("should create pairings when a player has dropped", () => {
          testState.events.players.create({ event_id: "id", name: "player-3" });
          testState.events.players.create({ event_id: "id", name: "player-4" });
          testState.events.players.create({ event_id: "id", name: "player-5" });
          testState.events.rounds.pair("id");
          testState.store.events[0].rounds[0].pairings = [
            {
              home: "id-player-1",
              away: "id-player-2",
            },
            {
              home: "id-player-3",
              away: "id-player-4",
            },
            {
              home: "id-player-5",
              away: "BYE",
            },
          ];
          testState.store.events[0].players[0].results[0] = {
            opponent_id: "id-player-2",
            wins: 2,
            losses: 1,
            draws: 0,
          };
          testState.store.events[0].players[1].results[0] = {
            opponent_id: "id-player-1",
            wins: 1,
            losses: 2,
            draws: 0,
          };
          testState.store.events[0].players[2].results[0] = {
            opponent_id: "id-player-4",
            wins: 2,
            losses: 0,
            draws: 0,
            drop: true,
          };
          testState.store.events[0].players[3].results[0] = {
            opponent_id: "id-player-3",
            wins: 0,
            losses: 2,
            draws: 0,
          };
          testState.store.events[0].players[3].drop = true;
          testState.store.events[0].players[4].results[0] = {
            opponent_id: "BYE",
            wins: 2,
            losses: 0,
            draws: 0,
          };
          testState.events.rounds.pair("id");

          // this needs to change i think the best way in the future will be to being
          // by pairing and then start swapping players within the pairings but
          // i'll work on that in the future
          assert.deepEqual(
            testState.store.events[0].rounds[1].pairings,
            [
              {
                home: "id-player-3",
                away: "id-player-5",
                id: "match-0",
              },
              {
                home: "id-player-1",
                away: "id-player-2",
                id: "match-1",
              },
            ],
            "it should setup rounds",
          );
        });
      });
    });
    describe("events.rounds.pairings.update", () => {
      beforeEach(() => {
        testState = new initState();
        testState.events.create({
          name: "event",
          id: "id",
        });
        testState.events.players.create({ event_id: "id", name: "player-1" });
        testState.events.players.create({ event_id: "id", name: "player-2" });
        testState.events.players.create({ event_id: "id", name: "player-3" });
        testState.events.players.create({ event_id: "id", name: "player-4" });
        testState.events.rounds.pair("id");
        testState.store.events[0].players[0].results[0].opponent_id =
          "id-player-2";
        testState.store.events[0].players[1].results[0].opponent_id =
          "id-player-1";
        testState.store.events[0].players[2].results[0].opponent_id =
          "id-player-4";
        testState.store.events[0].players[3].results[0].opponent_id =
          "id-player-3";
        testState.store.events[0].rounds[0] = {
          round: 1,
          pairings: [
            {
              home: "id-player-4",
              away: "id-player-3",
            },
            {
              home: "id-player-2",
              away: "id-player-1",
            },
          ],
        };
      });
      it("should update a pairing in a round", () => {
        testState.events.rounds.updatePairing("id", 0, 0, {
          player: "home",
          player_id: "id-player-1",
        });
        assert.deepEqual(
          testState.store.events[0].rounds[0].pairings,
          [
            {
              home: "id-player-1",
              away: "id-player-3",
            },
            {
              home: "id-player-2",
              away: "id-player-4",
            },
          ],
          "it should update",
        );
        assert.isFalse(
          splatContains(testState.store.events[0].players, "name", "none"),
          "it should not update player to be null",
        );
      });
      it("should update a pairing when moving the bye from one match to another", () => {
        testState = new initState();
        testState.events.create({
          name: "event",
          id: "id",
        });
        testState.events.players.create({ event_id: "id", name: "player-1" });
        testState.events.players.create({ event_id: "id", name: "player-2" });
        testState.events.players.create({ event_id: "id", name: "player-3" });
        testState.events.players.create({ event_id: "id", name: "player-4" });
        testState.events.players.create({ event_id: "id", name: "player-5" });
        testState.events.rounds.pair("id");
        testState.store.events[0].players.forEach((player) => {
          if (player.id === "player-id-5") {
            player.results[0] = {
              wins: 2,
              opponent_id: "BYE",
              losses: 0,
              draws: 0,
            };
          } else
            player.results[0] = {
              wins: 0,
              losses: 0,
              draws: 0,
            };
        });
        testState.store.events[0].rounds[0] = {
          round: 1,
          pairings: [
            {
              home: "id-player-4",
              away: "id-player-3",
            },
            {
              home: "id-player-2",
              away: "id-player-1",
            },
            {
              home: "id-player-5",
              away: "BYE",
            },
          ],
        };
        testState.events.rounds.updatePairing("id", 0, 0, {
          player: "home",
          player_id: "BYE",
        });
        assert.deepEqual(
          testState.store.events[0].rounds[0].pairings,
          [
            {
              home: "BYE",
              away: "id-player-3",
            },
            {
              home: "id-player-2",
              away: "id-player-1",
            },
            {
              home: "id-player-5",
              away: "id-player-4",
            },
          ],
          "it should update",
        );
        assert.deepEqual(
          testState.store.events[0].players[2].results[0],
          {
            wins: 2,
            losses: 0,
            opponent_id: "BYE",
            draws: 0,
          },
          "it should update results",
        );
        assert.deepEqual(
          testState.store.events[0].players[4].results[0],
          {
            wins: 0,
            losses: 0,
            draws: 0,
            opponent_id: "id-player-4",
          },
          "it should update results",
        );
        assert.isFalse(
          splatContains(testState.store.events[0].players, "name", "none"),
          "it should not update player to be null",
        );
      });
      it("should update a pairing when moving the player matched with the bye from one match to another", () => {
        testState = new initState();
        testState.events.create({
          name: "event",
          id: "id",
        });
        testState.events.players.create({ event_id: "id", name: "player-1" });
        testState.events.players.create({ event_id: "id", name: "player-2" });
        testState.events.players.create({ event_id: "id", name: "player-3" });
        testState.events.players.create({ event_id: "id", name: "player-4" });
        testState.events.players.create({ event_id: "id", name: "player-5" });
        testState.events.rounds.pair("id");
        testState.store.events[0].players.forEach((player) => {
          if (player.id === "player-id-5") {
            player.results[0] = {
              wins: 2,
              opponent_id: "BYE",
              losses: 0,
              draws: 0,
            };
          } else
            player.results[0] = {
              wins: 0,
              losses: 0,
              draws: 0,
            };
        });
        testState.store.events[0].rounds[0] = {
          round: 1,
          pairings: [
            {
              home: "id-player-4",
              away: "id-player-3",
            },
            {
              home: "id-player-2",
              away: "id-player-1",
            },
            {
              home: "id-player-5",
              away: "BYE",
            },
          ],
        };

        testState.events.rounds.updatePairing("id", 0, 0, {
          player: "home",
          player_id: "id-player-5",
        });
        assert.deepEqual(
          testState.store.events[0].rounds[0].pairings,
          [
            {
              home: "id-player-5",
              away: "id-player-3",
            },
            {
              home: "id-player-2",
              away: "id-player-1",
            },
            {
              home: "id-player-4",
              away: "BYE",
            },
          ],
          "it should update",
        );
        assert.deepEqual(testState.store.events[0].players[3].results, [
          {
            opponent_id: "BYE",
            wins: 2,
            losses: 0,
            draws: 0,
          },
        ]);
        assert.isFalse(
          splatContains(testState.store.events[0].players, "name", "none"),
          "it should not update player to be null",
        );
      });
      it("should set a player's results to 0 afer moving from one pairing to another", () => {});
    });
  });
  describe("score", () => {
    beforeEach(() => {
      testState = new initState();
      testState.events.create({
        name: "event",
        id: "id",
      });
      testState.events.players.create({ event_id: "id", name: "player-1" });
      testState.events.players.create({ event_id: "id", name: "player-2" });
      testState.events.players.create({ event_id: "id", name: "player-3" });
      testState.events.rounds.pair("id");
      testState.store.events[0].players[0].results = [
        { opponent_id: "id-player-2", wins: 0, losses: 0, draws: 0 },
      ];
      testState.store.events[0].players[1].results = [
        { opponent_id: "id-player-1", wins: 0, losses: 0, draws: 0 },
      ];
      testState.store.events[0].players[2] = {
        event_id: "id",
        name: "player-3",
        id: "id-player-3",
        results: [{ opponent_id: "BYE", wins: 2, losses: 0, draws: 0 }],
      };
      testState.store.events[0].rounds[0].pairings = [
        {
          home: "id-player-1",
          away: "id-player-2",
        },
        {
          home: "id-player-3",
          away: "BYE",
        },
      ];
    });
    it("should set wins to value when scoring wins for player", () => {
      testState.events.rounds.score({
        event_id: "id",
        playerId: "id-player-1",
        field: "wins",
        score: 2,
        roundIndex: 0,
        pairingIndex: 0,
      });
      assert.deepEqual(
        testState.store.events[0].players[0].results[0].wins,
        2,
        "it should set wins",
      );
      assert.deepEqual(
        testState.store.events[0].players[1].results[0].losses,
        2,
        "it should set losses",
      );
    });
    it("should set wins to value when scoring draws for player", () => {
      testState.events.rounds.score({
        event_id: "id",
        playerId: "id-player-1",
        field: "draws",
        score: 2,
        roundIndex: 0,
        pairingIndex: 0,
      });
      assert.deepEqual(
        testState.store.events[0].players[0].results[0].draws,
        2,
        "it should set wins",
      );
      assert.deepEqual(
        testState.store.events[0].players[1].results[0].draws,
        2,
        "it should set losses",
      );
    });
    it("should set drop when dropping a player", () => {
      testState.events.rounds.score({
        event_id: "id",
        playerId: "id-player-2",
        field: "drop",
        score: true,
        roundIndex: 0,
        pairingIndex: 0,
      });
      assert.deepEqual(
        testState.store.events[0].players[1].results[0].drop,
        true,
        "it should set wins",
      );
      assert.deepEqual(
        testState.store.events[0].players[1].drop,
        true,
        "it should set losses",
      );
    });
  });
  describe("event", () => {
    it("should add players and pair", () => {
      const mtState = new initState(() => {});
      mtState.events.create({
        name: "event",
        id: "id",
      });
      mtState.events.players.create({ event_id: "id", name: "player-1" });
      mtState.events.players.create({ event_id: "id", name: "player-2" });
      mtState.events.players.create({ event_id: "id", name: "player-3" });
      mtState.events.players.create({ event_id: "id", name: "player-4" });
      mtState.events.players.create({ event_id: "id", name: "player-5" });
      mtState.events.players.create({ event_id: "id", name: "player-6" });
      mtState.events.players.create({ event_id: "id", name: "player-7" });
      mtState.events.players.create({ event_id: "id", name: "player-8" });
      mtState.events.players.create({ event_id: "id", name: "player-9" });
      mtState.events.players.create({ event_id: "id", name: "player-10" });
      mtState.events.players.create({ event_id: "id", name: "player-11" });
      mtState.events.rounds.pair("id");
    });
    it("should pair in this case", () => {
      const mtState = new initState(() => {});

      let event = {
        name: "event",
        id: "id",
        players: [
          {
            name: "player-1",
            id: "id-player-1",
            results: [
              {
                wins: 2,
                losses: 0,
                draws: 0,
                opponent_id: "id-player-7",
              },
              {
                wins: 2,
                losses: 0,
                draws: 0,
                opponent_id: "id-player-2",
              },
              {
                wins: 2,
                losses: 0,
                draws: 0,
                opponent_id: "id-player-4",
              },
              {
                wins: 2,
                losses: 0,
                draws: 0,
                opponent_id: "id-player-6",
              },
              {
                wins: 0,
                losses: 2,
                draws: 0,
                opponent_id: "id-player-5",
              },
            ],
            points: 8,
            opponents: [
              "id-player-7",
              "id-player-2",
              "id-player-4",
              "id-player-6",
            ],
          },
          {
            name: "player-2",
            id: "id-player-2",
            results: [
              {
                wins: 2,
                losses: 0,
                draws: 0,
                opponent_id: "BYE",
              },
              {
                wins: 0,
                losses: 2,
                draws: 0,
                opponent_id: "id-player-1",
              },
              {
                wins: 0,
                losses: 2,
                draws: 0,
                opponent_id: "id-player-3",
              },
              {
                wins: 2,
                losses: 0,
                draws: 0,
                opponent_id: "id-player-10",
              },
              {
                wins: 0,
                losses: 2,
                draws: 0,
                opponent_id: "id-player-11",
              },
            ],
            points: 4,
            opponents: ["BYE", "id-player-1", "id-player-3", "id-player-10"],
          },
          {
            name: "player-3",
            id: "id-player-3",
            results: [
              {
                wins: 0,
                losses: 2,
                draws: 0,
                opponent_id: "id-player-5",
              },
              {
                wins: 2,
                losses: 0,
                draws: 0,
                opponent_id: "id-player-7",
              },
              {
                wins: 2,
                losses: 0,
                draws: 0,
                opponent_id: "id-player-2",
              },
              {
                wins: 2,
                losses: 0,
                draws: 0,
                opponent_id: "id-player-4",
              },
              {
                wins: 2,
                losses: 0,
                draws: 0,
                opponent_id: "id-player-6",
              },
            ],
            points: 6,
            opponents: [
              "id-player-5",
              "id-player-7",
              "id-player-2",
              "id-player-4",
            ],
          },
          {
            name: "player-4",
            id: "id-player-4",
            results: [
              {
                wins: 2,
                losses: 0,
                draws: 0,
                opponent_id: "id-player-11",
              },
              {
                wins: 2,
                losses: 0,
                draws: 0,
                opponent_id: "id-player-5",
              },
              {
                wins: 0,
                losses: 2,
                draws: 0,
                opponent_id: "id-player-1",
              },
              {
                wins: 0,
                losses: 2,
                draws: 0,
                opponent_id: "id-player-3",
              },
              {
                wins: 0,
                losses: 2,
                draws: 0,
                opponent_id: "id-player-9",
              },
            ],
            points: 4,
            opponents: [
              "id-player-11",
              "id-player-5",
              "id-player-1",
              "id-player-3",
            ],
          },
          {
            name: "player-5",
            id: "id-player-5",
            results: [
              {
                wins: 2,
                losses: 0,
                draws: 0,
                opponent_id: "id-player-3",
              },
              {
                wins: 0,
                losses: 2,
                draws: 0,
                opponent_id: "id-player-4",
              },
              {
                wins: 2,
                losses: 0,
                draws: 0,
                opponent_id: "id-player-8",
              },
              {
                wins: 2,
                losses: 0,
                draws: 0,
                opponent_id: "id-player-9",
              },
              {
                wins: 2,
                losses: 0,
                draws: 0,
                opponent_id: "id-player-1",
              },
            ],
            points: 6,
            opponents: [
              "id-player-3",
              "id-player-4",
              "id-player-8",
              "id-player-9",
            ],
          },
          {
            name: "player-6",
            id: "id-player-6",
            results: [
              {
                wins: 2,
                losses: 0,
                draws: 0,
                opponent_id: "id-player-10",
              },
              {
                wins: 2,
                losses: 0,
                draws: 0,
                opponent_id: "id-player-8",
              },
              {
                wins: 2,
                losses: 0,
                draws: 0,
                opponent_id: "BYE",
              },
              {
                wins: 0,
                losses: 2,
                draws: 0,
                opponent_id: "id-player-1",
              },
              {
                wins: 0,
                losses: 2,
                draws: 0,
                opponent_id: "id-player-3",
              },
            ],
            points: 6,
            opponents: ["id-player-10", "id-player-8", "BYE", "id-player-1"],
          },
          {
            name: "player-7",
            id: "id-player-7",
            results: [
              {
                wins: 0,
                losses: 2,
                draws: 0,
                opponent_id: "id-player-1",
              },
              {
                wins: 0,
                losses: 2,
                draws: 0,
                opponent_id: "id-player-3",
              },
              {
                wins: 0,
                losses: 2,
                draws: 0,
                opponent_id: "id-player-10",
              },
              {
                wins: 0,
                losses: 2,
                draws: 0,
                opponent_id: "id-player-11",
              },
              {
                wins: 2,
                losses: 0,
                draws: 0,
                opponent_id: "BYE",
              },
            ],
            points: 0,
            opponents: [
              "id-player-1",
              "id-player-3",
              "id-player-10",
              "id-player-11",
            ],
          },
          {
            name: "player-8",
            id: "id-player-8",
            results: [
              {
                wins: 2,
                losses: 0,
                draws: 0,
                opponent_id: "id-player-9",
              },
              {
                wins: 0,
                losses: 2,
                draws: 0,
                opponent_id: "id-player-6",
              },
              {
                wins: 0,
                losses: 2,
                draws: 0,
                opponent_id: "id-player-5",
              },
              {
                wins: 2,
                losses: 0,
                draws: 0,
                opponent_id: "BYE",
              },
              {
                wins: 0,
                losses: 2,
                draws: 0,
                opponent_id: "id-player-10",
              },
            ],
            points: 4,
            opponents: ["id-player-9", "id-player-6", "id-player-5", "BYE"],
          },
          {
            name: "player-9",
            id: "id-player-9",
            results: [
              {
                wins: 0,
                losses: 2,
                draws: 0,
                opponent_id: "id-player-8",
              },
              {
                wins: 2,
                losses: 0,
                draws: 0,
                opponent_id: "id-player-10",
              },
              {
                wins: 2,
                losses: 0,
                draws: 0,
                opponent_id: "id-player-11",
              },
              {
                wins: 0,
                losses: 2,
                draws: 0,
                opponent_id: "id-player-5",
              },
              {
                wins: 2,
                losses: 0,
                draws: 0,
                opponent_id: "id-player-4",
              },
            ],
            points: 4,
            opponents: [
              "id-player-8",
              "id-player-10",
              "id-player-11",
              "id-player-5",
            ],
          },
          {
            name: "player-10",
            id: "id-player-10",
            results: [
              {
                wins: 0,
                losses: 2,
                draws: 0,
                opponent_id: "id-player-6",
              },
              {
                wins: 0,
                losses: 2,
                draws: 0,
                opponent_id: "id-player-9",
              },
              {
                wins: 2,
                losses: 0,
                draws: 0,
                opponent_id: "id-player-7",
              },
              {
                wins: 0,
                losses: 2,
                draws: 0,
                opponent_id: "id-player-2",
              },
              {
                wins: 2,
                losses: 0,
                draws: 0,
                opponent_id: "id-player-8",
              },
            ],
            points: 2,
            opponents: [
              "id-player-6",
              "id-player-9",
              "id-player-7",
              "id-player-2",
            ],
          },
          {
            name: "player-11",
            id: "id-player-11",
            results: [
              {
                wins: 0,
                losses: 2,
                draws: 0,
                opponent_id: "id-player-4",
              },
              {
                wins: 2,
                losses: 0,
                draws: 0,
                opponent_id: "BYE",
              },
              {
                wins: 0,
                losses: 2,
                draws: 0,
                opponent_id: "id-player-9",
              },
              {
                wins: 2,
                losses: 0,
                draws: 0,
                opponent_id: "id-player-7",
              },
              {
                wins: 2,
                losses: 0,
                draws: 0,
                opponent_id: "id-player-2",
              },
            ],
            points: 4,
            opponents: ["id-player-4", "BYE", "id-player-9", "id-player-7"],
          },
        ],
        rounds: [
          {
            round: 1,
            pairings: [
              {
                home: "id-player-6",
                away: "id-player-10",
              },
              {
                home: "id-player-5",
                away: "id-player-3",
              },
              {
                home: "id-player-1",
                away: "id-player-7",
              },
              {
                home: "id-player-4",
                away: "id-player-11",
              },
              {
                home: "id-player-8",
                away: "id-player-9",
              },
              {
                home: "id-player-2",
                away: "BYE",
              },
            ],
          },
          {
            round: 2,
            pairings: [
              {
                home: "id-player-1",
                id: "match-0",
                away: "id-player-2",
              },
              {
                home: "id-player-4",
                id: "match-1",
                away: "id-player-5",
              },
              {
                home: "id-player-6",
                id: "match-2",
                away: "id-player-8",
              },
              {
                home: "id-player-3",
                id: "match-3",
                away: "id-player-7",
              },
              {
                home: "id-player-9",
                id: "match-4",
                away: "id-player-10",
              },
              {
                home: "id-player-11",
                id: "match-5",
                away: "BYE",
              },
            ],
          },
          {
            round: 3,
            pairings: [
              {
                home: "id-player-1",
                id: "match-0",
                away: "id-player-4",
              },
              {
                home: "id-player-3",
                id: "match-1",
                away: "id-player-2",
              },
              {
                home: "id-player-5",
                id: "match-2",
                away: "id-player-8",
              },
              {
                home: "id-player-9",
                id: "match-3",
                away: "id-player-11",
              },
              {
                home: "id-player-10",
                id: "match-4",
                away: "id-player-7",
              },
              {
                home: "id-player-6",
                id: "match-5",
                away: "BYE",
              },
            ],
          },
          {
            round: 4,
            pairings: [
              {
                home: "id-player-1",
                id: "match-0",
                away: "id-player-6",
              },
              {
                home: "id-player-5",
                id: "match-1",
                away: "id-player-9",
              },
              {
                home: "id-player-3",
                id: "match-2",
                away: "id-player-4",
              },
              {
                home: "BYE",
                id: "match-3",
                away: "id-player-8",
              },
              {
                home: "id-player-2",
                id: "match-4",
                away: "id-player-10",
              },
              {
                home: "id-player-11",
                id: "match-5",
                away: "id-player-7",
              },
            ],
          },
          {
            round: 5,
            pairings: [
              {
                home: "id-player-3",
                id: "match-0",
                away: "id-player-6",
              },
              {
                home: "id-player-5",
                id: "match-1",
                away: "id-player-1",
              },
              {
                home: "id-player-11",
                id: "match-2",
                away: "id-player-2",
              },
              {
                home: "id-player-9",
                id: "match-3",
                away: "id-player-4",
              },
              {
                home: "id-player-10",
                id: "match-4",
                away: "id-player-8",
              },
              {
                home: "BYE",
                id: "match-5",
                away: "id-player-7",
              },
            ],
          },
        ],
      };
      mtState.store.events[0] = event;
      mtState.update();
      mtState.events.rounds.pair("id");
    });
  });
  describe("cutToTop8", () => {
    let fiveRounds = {
      name: "event",
      id: "id",
      players: [
        {
          name: "player-1",
          id: "id-player-1",
          results: [
            {
              wins: 2,
              losses: 0,
              draws: 0,
              opponent_id: "id-player-6",
            },
            {
              wins: 2,
              losses: 1,
              draws: 0,
              opponent_id: "id-player-5",
            },
            {
              wins: 2,
              losses: 1,
              draws: 0,
              opponent_id: "id-player-7",
            },
            {
              wins: 2,
              losses: 0,
              draws: 0,
              opponent_id: "id-player-2",
            },
            {
              wins: 2,
              losses: 0,
              draws: 0,
              opponent_id: "id-player-8",
            },
          ],
          points: 10,
          gameWinPercentage: 0.8333333333333334,
          opponents: [
            "id-player-6",
            "id-player-5",
            "id-player-7",
            "id-player-2",
            "id-player-8",
          ],
        },
        {
          name: "player-2",
          id: "id-player-2",
          results: [
            {
              wins: 1,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-7",
            },
            {
              wins: 2,
              losses: 0,
              draws: 0,
              opponent_id: "id-player-8",
            },
            {
              wins: 2,
              losses: 1,
              draws: 0,
              opponent_id: "id-player-9",
            },
            {
              wins: 0,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-1",
            },
            {
              wins: 0,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-6",
            },
          ],
          points: 5,
          gameWinPercentage: 0.4166666666666667,
          opponents: [
            "id-player-7",
            "id-player-8",
            "id-player-9",
            "id-player-1",
            "id-player-6",
          ],
        },
        {
          name: "player-3",
          id: "id-player-3",
          results: [
            {
              wins: 0,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-5",
            },
            {
              wins: 1,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-12",
            },
            {
              wins: 0,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-11",
            },
            {
              wins: 2,
              losses: 0,
              draws: 0,
              opponent_id: "id-player-8",
            },
            {
              wins: 2,
              losses: 0,
              draws: 0,
              opponent_id: "id-player-4",
            },
          ],
          points: 5,
          gameWinPercentage: 0.45454545454545453,
          opponents: [
            "id-player-5",
            "id-player-12",
            "id-player-11",
            "id-player-8",
            "id-player-4",
          ],
        },
        {
          name: "player-4",
          id: "id-player-4",
          results: [
            {
              wins: 2,
              losses: 1,
              draws: 0,
              opponent_id: "id-player-8",
            },
            {
              wins: 0,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-11",
            },
            {
              wins: 0,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-6",
            },
            {
              wins: 1,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-10",
            },
            {
              wins: 0,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-3",
            },
          ],
          points: 3,
          gameWinPercentage: 0.25,
          opponents: [
            "id-player-8",
            "id-player-11",
            "id-player-6",
            "id-player-10",
            "id-player-3",
          ],
        },
        {
          name: "player-5",
          id: "id-player-5",
          results: [
            {
              wins: 2,
              losses: 0,
              draws: 0,
              opponent_id: "id-player-3",
            },
            {
              wins: 1,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-1",
            },
            {
              wins: 1,
              losses: 1,
              draws: 1,
              opponent_id: "id-player-12",
            },
            {
              wins: 2,
              losses: 0,
              draws: 0,
              opponent_id: "id-player-9",
            },
            {
              wins: 0,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-11",
            },
          ],
          points: 6,
          gameWinPercentage: 0.5,
          opponents: [
            "id-player-3",
            "id-player-1",
            "id-player-12",
            "id-player-9",
            "id-player-11",
          ],
        },
        {
          name: "player-6",
          id: "id-player-6",
          results: [
            {
              wins: 0,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-1",
            },
            {
              wins: 2,
              losses: 0,
              draws: 0,
              opponent_id: "id-player-10",
            },
            {
              wins: 2,
              losses: 0,
              draws: 0,
              opponent_id: "id-player-4",
            },
            {
              wins: 1,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-12",
            },
            {
              wins: 2,
              losses: 0,
              draws: 0,
              opponent_id: "id-player-2",
            },
          ],
          points: 7,
          gameWinPercentage: 0.6363636363636364,
          opponents: [
            "id-player-1",
            "id-player-10",
            "id-player-4",
            "id-player-12",
            "id-player-2",
          ],
        },
        {
          name: "player-7",
          id: "id-player-7",
          results: [
            {
              wins: 2,
              losses: 1,
              draws: 0,
              opponent_id: "id-player-2",
            },
            {
              wins: 2,
              losses: 1,
              draws: 0,
              opponent_id: "id-player-9",
            },
            {
              wins: 1,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-1",
            },
            {
              wins: 2,
              losses: 1,
              draws: 0,
              opponent_id: "id-player-11",
            },
            {
              wins: 2,
              losses: 0,
              draws: 0,
              opponent_id: "id-player-12",
            },
          ],
          points: 9,
          gameWinPercentage: 0.6428571428571429,
          opponents: [
            "id-player-2",
            "id-player-9",
            "id-player-1",
            "id-player-11",
            "id-player-12",
          ],
        },
        {
          name: "player-8",
          id: "id-player-8",
          results: [
            {
              wins: 1,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-4",
            },
            {
              wins: 0,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-2",
            },
            {
              wins: 0,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-10",
            },
            {
              wins: 0,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-3",
            },
            {
              wins: 0,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-1",
            },
          ],
          points: 1,
          gameWinPercentage: 0.09090909090909091,
          opponents: [
            "id-player-4",
            "id-player-2",
            "id-player-10",
            "id-player-3",
            "id-player-1",
          ],
        },
        {
          name: "player-9",
          id: "id-player-9",
          results: [
            {
              wins: 2,
              losses: 1,
              draws: 0,
              opponent_id: "id-player-12",
            },
            {
              wins: 1,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-7",
            },
            {
              wins: 1,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-2",
            },
            {
              wins: 0,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-5",
            },
            {
              wins: 0,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-10",
            },
          ],
          points: 4,
          gameWinPercentage: 0.3076923076923077,
          opponents: [
            "id-player-12",
            "id-player-7",
            "id-player-2",
            "id-player-5",
            "id-player-10",
          ],
        },
        {
          name: "player-10",
          id: "id-player-10",
          results: [
            {
              wins: 0,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-11",
            },
            {
              wins: 0,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-6",
            },
            {
              wins: 2,
              losses: 0,
              draws: 0,
              opponent_id: "id-player-8",
            },
            {
              wins: 2,
              losses: 1,
              draws: 0,
              opponent_id: "id-player-4",
            },
            {
              wins: 2,
              losses: 0,
              draws: 0,
              opponent_id: "id-player-9",
            },
          ],
          points: 6,
          gameWinPercentage: 0.5454545454545454,
          opponents: [
            "id-player-11",
            "id-player-6",
            "id-player-8",
            "id-player-4",
            "id-player-9",
          ],
        },
        {
          name: "player-11",
          id: "id-player-11",
          results: [
            {
              wins: 2,
              losses: 0,
              draws: 0,
              opponent_id: "id-player-10",
            },
            {
              wins: 2,
              losses: 0,
              draws: 0,
              opponent_id: "id-player-4",
            },
            {
              wins: 2,
              losses: 0,
              draws: 0,
              opponent_id: "id-player-3",
            },
            {
              wins: 1,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-7",
            },
            {
              wins: 2,
              losses: 0,
              draws: 0,
              opponent_id: "id-player-5",
            },
          ],
          points: 9,
          gameWinPercentage: 0.8181818181818182,
          opponents: [
            "id-player-10",
            "id-player-4",
            "id-player-3",
            "id-player-7",
            "id-player-5",
          ],
        },
        {
          name: "player-12",
          id: "id-player-12",
          results: [
            {
              wins: 1,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-9",
            },
            {
              wins: 2,
              losses: 1,
              draws: 0,
              opponent_id: "id-player-3",
            },
            {
              wins: 1,
              losses: 1,
              draws: 1,
              opponent_id: "id-player-5",
            },
            {
              wins: 2,
              losses: 1,
              draws: 0,
              opponent_id: "id-player-6",
            },
            {
              wins: 0,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-7",
            },
          ],
          points: 6,
          gameWinPercentage: 0.42857142857142855,
          opponents: [
            "id-player-9",
            "id-player-3",
            "id-player-5",
            "id-player-6",
            "id-player-7",
          ],
        },
      ],
      rounds: [
        {
          round: 1,
          pairings: [
            {
              home: "id-player-5",
              away: "id-player-3",
            },
            {
              home: "id-player-7",
              away: "id-player-2",
            },
            {
              home: "id-player-11",
              away: "id-player-10",
            },
            {
              home: "id-player-4",
              away: "id-player-8",
            },
            {
              home: "id-player-1",
              away: "id-player-6",
            },
            {
              home: "id-player-9",
              away: "id-player-12",
            },
          ],
        },
        {
          round: 2,
          pairings: [
            {
              home: "id-player-1",
              id: "match-0",
              away: "id-player-5",
            },
            {
              home: "id-player-11",
              id: "match-1",
              away: "id-player-4",
            },
            {
              home: "id-player-7",
              id: "match-2",
              away: "id-player-9",
            },
            {
              home: "id-player-2",
              id: "match-3",
              away: "id-player-8",
            },
            {
              home: "id-player-12",
              id: "match-4",
              away: "id-player-3",
            },
            {
              home: "id-player-6",
              id: "match-5",
              away: "id-player-10",
            },
          ],
        },
        {
          round: 3,
          pairings: [
            {
              home: "id-player-1",
              id: "match-0",
              away: "id-player-7",
            },
            {
              home: "id-player-9",
              id: "match-1",
              away: "id-player-2",
            },
            {
              home: "id-player-12",
              id: "match-2",
              away: "id-player-5",
            },
            {
              home: "id-player-6",
              id: "match-3",
              away: "id-player-4",
            },
            {
              home: "id-player-11",
              id: "match-4",
              away: "id-player-3",
            },
            {
              home: "id-player-10",
              id: "match-5",
              away: "id-player-8",
            },
          ],
        },
        {
          round: 4,
          pairings: [
            {
              home: "id-player-7",
              id: "match-0",
              away: "id-player-11",
            },
            {
              home: "id-player-1",
              id: "match-1",
              away: "id-player-2",
            },
            {
              home: "id-player-12",
              id: "match-2",
              away: "id-player-6",
            },
            {
              home: "id-player-5",
              id: "match-3",
              away: "id-player-9",
            },
            {
              home: "id-player-10",
              id: "match-4",
              away: "id-player-4",
            },
            {
              home: "id-player-3",
              id: "match-5",
              away: "id-player-8",
            },
          ],
        },
        {
          round: 5,
          pairings: [
            {
              home: "id-player-11",
              id: "match-0",
              away: "id-player-5",
            },
            {
              home: "id-player-7",
              id: "match-1",
              away: "id-player-12",
            },
            {
              home: "id-player-6",
              id: "match-2",
              away: "id-player-2",
            },
            {
              home: "id-player-10",
              id: "match-3",
              away: "id-player-9",
            },
            {
              home: "id-player-3",
              id: "match-4",
              away: "id-player-4",
            },
            {
              home: "id-player-1",
              id: "match-5",
              away: "id-player-8",
            },
          ],
        },
      ],
    };
    it("should cut to top 8", () => {
      testState.store.events = [fiveRounds];
      testState.events.cutToTop8("id");
      assert.deepEqual(
        testState.store.events[0].top8,
        [
          [
            { home: "id-player-1", id: "top-8-1", away: "id-player-12" },
            { home: "id-player-11", id: "top-8-2", away: "id-player-3" },
            { home: "id-player-7", id: "top-8-3", away: "id-player-5" },
            { home: "id-player-6", id: "top-8-4", away: "id-player-10" },
          ],
          [
            { home: undefined, id: "top-4-1", away: undefined },
            { home: undefined, id: "top-4-2", away: undefined },
          ],
          [{ home: undefined, id: "top-2-1", away: undefined }],
          [
            {
              winner: undefined,
              id: "winner",
            },
          ],
        ],
        "it should have a top 8",
      );
    });
    it("should score a top 8 match", () => {
      testState.store.events = [fiveRounds];
      testState.events.cutToTop8("id");
      testState.events.scoreTop8("id", "top-8-1", "id-player-1");
      assert.deepEqual(
        testState.store.events[0].top8,
        [
          [
            { home: "id-player-1", id: "top-8-1", away: "id-player-12" },
            { home: "id-player-11", id: "top-8-2", away: "id-player-3" },
            { home: "id-player-7", id: "top-8-3", away: "id-player-5" },
            { home: "id-player-6", id: "top-8-4", away: "id-player-10" },
          ],
          [
            { home: "id-player-1", id: "top-4-1", away: undefined },
            { home: undefined, id: "top-4-2", away: undefined },
          ],
          [{ home: undefined, id: "top-2-1", away: undefined }],
          [
            {
              winner: undefined,
              id: "winner",
            },
          ],
        ],
        "it should have a top 8",
      );
      testState.events.scoreTop8("id", "top-8-2", "id-player-11");
      assert.deepEqual(
        testState.store.events[0].top8,
        [
          [
            { home: "id-player-1", id: "top-8-1", away: "id-player-12" },
            { home: "id-player-11", id: "top-8-2", away: "id-player-3" },
            { home: "id-player-7", id: "top-8-3", away: "id-player-5" },
            { home: "id-player-6", id: "top-8-4", away: "id-player-10" },
          ],
          [
            { home: "id-player-1", id: "top-4-1", away: "id-player-11" },
            { home: undefined, id: "top-4-2", away: undefined },
          ],
          [{ home: undefined, id: "top-2-1", away: undefined }],
          [
            {
              winner: undefined,
              id: "winner",
            },
          ],
        ],
        "it should have a top 8",
      );
      testState.events.scoreTop8("id", "top-8-3", "id-player-7");
      assert.deepEqual(
        testState.store.events[0].top8,
        [
          [
            { home: "id-player-1", id: "top-8-1", away: "id-player-12" },
            { home: "id-player-11", id: "top-8-2", away: "id-player-3" },
            { home: "id-player-7", id: "top-8-3", away: "id-player-5" },
            { home: "id-player-6", id: "top-8-4", away: "id-player-10" },
          ],
          [
            { home: "id-player-1", id: "top-4-1", away: "id-player-11" },
            { home: "id-player-7", id: "top-4-2", away: undefined },
          ],
          [{ home: undefined, id: "top-2-1", away: undefined }],
          [
            {
              winner: undefined,
              id: "winner",
            },
          ],
        ],
        "it should have a top 8",
      );
      testState.events.scoreTop8("id", "top-8-4", "id-player-6");
      assert.deepEqual(
        testState.store.events[0].top8,
        [
          [
            { home: "id-player-1", id: "top-8-1", away: "id-player-12" },
            { home: "id-player-11", id: "top-8-2", away: "id-player-3" },
            { home: "id-player-7", id: "top-8-3", away: "id-player-5" },
            { home: "id-player-6", id: "top-8-4", away: "id-player-10" },
          ],
          [
            { home: "id-player-1", id: "top-4-1", away: "id-player-11" },
            { home: "id-player-7", id: "top-4-2", away: "id-player-6" },
          ],
          [{ home: undefined, id: "top-2-1", away: undefined }],
          [
            {
              winner: undefined,
              id: "winner",
            },
          ],
        ],
        "it should have a top 8",
      );
      testState.events.scoreTop8("id", "top-4-1", "id-player-1");
      assert.deepEqual(
        testState.store.events[0].top8,
        [
          [
            { home: "id-player-1", id: "top-8-1", away: "id-player-12" },
            { home: "id-player-11", id: "top-8-2", away: "id-player-3" },
            { home: "id-player-7", id: "top-8-3", away: "id-player-5" },
            { home: "id-player-6", id: "top-8-4", away: "id-player-10" },
          ],
          [
            { home: "id-player-1", id: "top-4-1", away: "id-player-11" },
            { home: "id-player-7", id: "top-4-2", away: "id-player-6" },
          ],
          [{ home: "id-player-1", id: "top-2-1", away: undefined }],
          [
            {
              winner: undefined,
              id: "winner",
            },
          ],
        ],
        "it should have a top 8",
      );
      testState.events.scoreTop8("id", "top-4-2", "id-player-7");
      assert.deepEqual(
        testState.store.events[0].top8,
        [
          [
            { home: "id-player-1", id: "top-8-1", away: "id-player-12" },
            { home: "id-player-11", id: "top-8-2", away: "id-player-3" },
            { home: "id-player-7", id: "top-8-3", away: "id-player-5" },
            { home: "id-player-6", id: "top-8-4", away: "id-player-10" },
          ],
          [
            { home: "id-player-1", id: "top-4-1", away: "id-player-11" },
            { home: "id-player-7", id: "top-4-2", away: "id-player-6" },
          ],
          [{ home: "id-player-1", id: "top-2-1", away: "id-player-7" }],
          [
            {
              winner: undefined,
              id: "winner",
            },
          ],
        ],
        "it should have a top 8",
      );
      testState.events.scoreTop8("id", "top-1-1", "id-player-7");
      assert.deepEqual(
        testState.store.events[0].top8,
        [
          [
            { home: "id-player-1", id: "top-8-1", away: "id-player-12" },
            { home: "id-player-11", id: "top-8-2", away: "id-player-3" },
            { home: "id-player-7", id: "top-8-3", away: "id-player-5" },
            { home: "id-player-6", id: "top-8-4", away: "id-player-10" },
          ],
          [
            { home: "id-player-1", id: "top-4-1", away: "id-player-11" },
            { home: "id-player-7", id: "top-4-2", away: "id-player-6" },
          ],
          [{ home: "id-player-1", id: "top-2-1", away: "id-player-7" }],
          [
            {
              winner: "id-player-7",
              id: "winner",
            },
          ],
        ],
        "it should have a top 8",
      );
    });
  });
});
