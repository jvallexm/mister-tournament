import { TextInput, Checkbox } from "@carbon/react";
import { contains } from "lazy-z";

export const MatchTextInput = (props) => {
  let { getRoundScore, rowIndex, scoreWins, homeOrAway, isDraws } = props;
  let home =
    props.mtState.store.events[0].rounds[props.selectedIndex - 1].pairings[
      rowIndex
    ].home;
  let away =
    props.mtState.store.events[0].rounds[props.selectedIndex - 1].pairings[
      rowIndex
    ].away;
  let hasByeMatchup = contains([home, away], "BYE");
  let scoreField = isDraws ? "draws" : "wins";
  return (
    <TextInput
      id={
        (homeOrAway === "home" ? home : away) +
        "-vs-" +
        (homeOrAway === "home" ? away : home) +
        "-vs-" +
        rowIndex
      }
      disabled={hasByeMatchup}
      value={
        getRoundScore(props, 0, rowIndex, homeOrAway, scoreField) === "0"
          ? ""
          : getRoundScore(props, 0, rowIndex, homeOrAway, scoreField)
      }
      placeholder="0"
      onChange={scoreWins}
      onFocus={(e) => e.target.select()}
    />
  );
};

export const DropPlayerCheckBox = (props) => {
  let { mtState, selectedIndex, rowIndex, event_id, isAway } = props;
  let matchupId = isAway ? "away" : "home";
  return (
    <Checkbox
      labelText=""
      disabled={
        mtState.store.events[0].rounds[selectedIndex - 1].pairings[rowIndex][
          matchupId
        ] === "BYE"
      }
      id={`drop-${
        mtState.store.events[0].rounds[selectedIndex - 1].pairings[rowIndex][
          matchupId
        ]
      }`}
      checked={
        mtState.store.events[0].rounds[selectedIndex - 1].pairings[rowIndex][
          matchupId
        ] === "BYE"
          ? false
          : mtState.store.events[0].players.find(
              (player) =>
                player.id ===
                mtState.store.events[0].rounds[selectedIndex - 1].pairings[
                  rowIndex
                ][matchupId],
            ).drop
      }
      onChange={(_, { checked }) => {
        mtState.events.players.save(
          {
            drop: checked,
          },
          {
            data: {
              event_id: event_id,
              id: mtState.store.events[0].rounds[selectedIndex - 1].pairings[
                rowIndex
              ][matchupId],
            },
          },
        );
      }}
    />
  );
};
