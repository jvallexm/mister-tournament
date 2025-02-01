import { assert } from "chai";
import { groupByPoints, splatAdd, pair } from "../client/src/lib/pair.js";

describe("pair", () => {
  describe("splatAdd", () => {
    it("should add the results of a player", () => {
      let actualData = splatAdd(
        {
          name: "player",
          results: [
            {
              wins: 1,
            },
            {
              wins: 1,
            },
            {
              wins: 1,
            },
            {
              wins: 1,
            },
            {
              wins: 1,
            },
          ],
        },
        "wins",
      );
      let expectedData = 5;
      assert.deepEqual(
        actualData,
        expectedData,
        "it should return correct data",
      );
    });
  });
  describe("groupByPoints", () => {
    it("should return a map of players in groups based on points", () => {
      let players = [
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
      let actualData = groupByPoints(players);
      let expectedData = {
        0: [
          {
            name: "player-2",
            id: "id-player-2",
            results: [
              { wins: 0, losses: 2, draws: 0, opponent_id: "id-player-1" },
            ],
            points: 0,
            gameWinPercentage: 0,
            opponents: ["id-player-1"],
          },
          { id: "BYE", points: 0, results: [{ opponent_id: "id-player-5" }] },
        ],
        1: [
          {
            name: "player-4",
            id: "id-player-4",
            results: [
              { wins: 1, losses: 2, draws: 0, opponent_id: "id-player-3" },
            ],
            points: 1,
            gameWinPercentage: 0.3333333333333333,
            opponents: ["id-player-3"],
          },
          {
            name: "player-3",
            id: "id-player-3",
            results: [
              { wins: 2, losses: 1, draws: 0, opponent_id: "id-player-4" },
            ],
            points: 2,
            gameWinPercentage: 0.6666666666666666,
            opponents: ["id-player-4"],
          },
        ],
        2: [
          {
            name: "player-1",
            id: "id-player-1",
            results: [
              { wins: 2, losses: 0, draws: 0, opponent_id: "id-player-2" },
            ],
            points: 2,
            gameWinPercentage: 1,
            opponents: ["id-player-2"],
          },
          {
            name: "player-5",
            id: "id-player-5",
            results: [{ opponent_id: "BYE", wins: 2, losses: 0, draws: 0 }],
            points: 2,
            gameWinPercentage: 1,
            opponents: ["BYE"],
          },
        ],
      };
      assert.deepEqual(actualData, expectedData, "it should group by points");
    });
  });
  describe("pair", () => {
    it("should pair players with those of similar standing within a group", () => {
      let players = [
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
      let actualData = pair(players);
      let expectedData = [
        {
          home: "id-player-1",
          away: "id-player-5",
          id: "match-0",
        },
        {
          away: "BYE",
          home: "id-player-3",
          id: "match-1",
        },
        {
          home: "id-player-4",
          away: "id-player-2",
          id: "match-2",
        },
      ];
      assert.deepEqual(actualData, expectedData, "it should pair by points");
    });
    it("should not pair players who have already played within a group", () => {
      let players = [
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
            {
              wins: 2,
              losses: 0,
              draws: 0,
              opponent_id: "id-player-3",
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
            {
              wins: 2,
              losses: 0,
              draws: 0,
              opponent_id: "BYE",
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
            {
              wins: 0,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-1",
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
            {
              wins: 2,
              losses: 0,
              draws: 0,
              opponent_id: "id-player-5",
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
            {
              wins: 0,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-4",
            },
          ],
        },
      ];
      let actualData = pair(players);
      let expectedData = [
        {
          home: "id-player-1",
          away: "id-player-4",
          id: "match-0",
        },
        {
          home: "BYE",
          away: "id-player-3",
          id: "match-1",
        },
        {
          home: "id-player-2",
          away: "id-player-5",
          id: "match-2",
        },
      ];
      assert.deepEqual(actualData, expectedData, "it should pair by points");
    });
    it("should not pair players who have already played within a group", () => {
      let players = [
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
            {
              wins: 2,
              losses: 0,
              draws: 0,
              opponent_id: "id-player-3",
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
            {
              wins: 2,
              losses: 0,
              draws: 0,
              opponent_id: "BYE",
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
            {
              wins: 0,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-1",
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
            {
              wins: 2,
              losses: 0,
              draws: 0,
              opponent_id: "id-player-5",
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
            {
              wins: 0,
              losses: 2,
              draws: 0,
              opponent_id: "id-player-4",
            },
          ],
        },
      ];
      let actualData = pair(players);
      let expectedData = [
        {
          home: "id-player-1",
          away: "id-player-4",
          id: "match-0",
        },
        {
          home: "BYE",
          away: "id-player-3",
          id: "match-1",
        },
        {
          away: "id-player-5",
          home: "id-player-2",
          id: "match-2",
        },
      ];
      assert.deepEqual(actualData, expectedData, "it should pair by points");
    });
    it("should create initial random pairings", () => {
      let players = [
        {
          name: "player-1",
          id: "id-player-1",
          results: [],
        },
        {
          name: "player-2",
          id: "id-player-2",
          results: [],
        },
        {
          name: "player-3",
          id: "id-player-3",
          results: [],
        },
        {
          name: "player-4",
          id: "id-player-4",
          results: [],
        },
        {
          name: "player-5",
          id: "id-player-5",
          results: [],
        },
      ];
      let actualData = pair(players, true);
      assert.deepEqual(actualData.length, 3, "it should pair by points");
    });
    it("should pair randomly when creating a round where each possible matchup has been played", () => {
      let players = [
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
            {
              wins: 2,
              losses: 0,
              draws: 0,
              opponent_id: "id-player-3",
            },
            {
              wins: 2,
              losses: 0,
              draws: 0,
              opponent_id: "BYE",
            },
          ],
          points: 4,
          opponents: ["id-player-2", "id-player-3", "BYE"],
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
            {
              wins: 2,
              losses: 0,
              draws: 0,
              opponent_id: "BYE",
            },
            {
              wins: 2,
              losses: 0,
              draws: 0,
              opponent_id: "id-player-3",
            },
          ],
          points: 2,
          opponents: ["id-player-1", "BYE", "id-player-3"],
        },
        {
          name: "player-3",
          id: "id-player-3",
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
              opponent_id: "id-player-2",
            },
          ],
          points: 2,
          opponents: ["BYE", "id-player-1", "id-player-2"],
        },
      ];
      let actualData = pair(players);
      assert.deepEqual(actualData.length, 2, "it should pair by points");
    });
    it("should pair players with an equal number of wins with other players who have similar win percentages", () => {
      let players = [
        {
          name: "player-1",
          id: "id-player-1",
          results: [
            {
              wins: 2,
              losses: 1,
            },
          ],
        },
        {
          name: "player-2",
          id: "id-player-2",
          results: [
            {
              wins: 2,
            },
          ],
        },
        {
          name: "player-3",
          id: "id-player-3",
          results: [
            {
              wins: 2,
            },
          ],
        },
        {
          name: "player-4",
          id: "id-player-4",
          results: [
            {
              wins: 2,
              losses: 1,
            },
          ],
        },
      ];
      let actualData = pair(players);
      let expectedData = [
        {
          home: "id-player-2",
          away: "id-player-3",
          id: "match-0",
        },
        {
          home: "id-player-1",
          away: "id-player-4",
          id: "match-1",
        },
      ];
      assert.deepEqual(actualData, expectedData, "it should pair by points");
    });
  });
});
