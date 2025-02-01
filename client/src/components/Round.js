import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Select,
  SelectItem,
  Button,
  TabPanel,
} from "@carbon/react";
import { ArrowLeft, ArrowRight, Cut } from "@carbon/icons-react";
import { splat } from "lazy-z";
import { DropPlayerCheckBox, MatchTextInput } from "./Utils";

function getRoundScore(props, eventIndex, rowIndex, playerKey, scoreKey) {
  let value =
    props.mtState.store.events[eventIndex].rounds[props.selectedIndex - 1]
      .pairings[rowIndex][playerKey] === "BYE"
      ? 0
      : props.mtState.store.events[eventIndex].players.find(
          (player) =>
            player.id ===
            props.mtState.store.events[eventIndex].rounds[
              props.selectedIndex - 1
            ].pairings[rowIndex][playerKey],
        ).results[props.selectedIndex - 1][scoreKey];
  return String(value);
}

export const Round = (props) => {
  return (
    <TabPanel>
      <DataTable
        rows={
          props.mtState?.store?.events[0]?.rounds[props.selectedIndex - 1]
            ?.pairings || [{ id: "loading" }]
        }
        headers={[
          { key: "test", header: "Pairings" },
          { key: "Wins", header: "Wins" },
          { key: "Draws", header: "Draws" },
          { key: "Drop", header: "Drop" },
        ]}
        key={JSON.stringify(props.mtState.store.events[0])}
      >
        {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
          <Table {...getTableProps()}>
            <TableHead>
              <TableRow>
                {headers.map((header, headerIndex) => (
                  <TableHeader
                    {...getHeaderProps({ header })}
                    key={"header-" + headerIndex}
                    style={
                      header.header === "Wins" ||
                      header.header === "Draws" ||
                      header.header === "Drop"
                        ? { width: "8vw" }
                        : {}
                    }
                  >
                    {header.header}
                  </TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row, rowIndex) => (
                <TableRow {...getRowProps({ row })} key={"row-" + rowIndex}>
                  <TableCell
                    key={"matchup-row-" + rowIndex}
                    style={{ width: "50vw" }}
                  >
                    <h5
                      style={{
                        paddingTop: "1rem",
                        paddingBottom: "0.5rem",
                      }}
                    >
                      Table {rowIndex + 1}
                    </h5>
                    <div style={{ paddingBottom: "1rem" }}>
                      <Select
                        hideLabel
                        id={`matchup-${rowIndex}-select`}
                        value={
                          props.mtState.store.events[0].players.find(
                            (player) =>
                              player.id ===
                              props.mtState.store.events[0].rounds[
                                props.selectedIndex - 1
                              ].pairings[rowIndex].home,
                          )?.name || "BYE"
                        }
                        items={splat(
                          props.mtState.store.events[0].players,
                          "name",
                        )}
                        onChange={props.updateSelectedPlayer(rowIndex, "home")}
                      >
                        {props
                          .getAllPlayerNamesExcluding(
                            props.mtState.store.events[0].players.find(
                              (player) =>
                                player.id ===
                                props.mtState.store.events[0].rounds[
                                  props.selectedIndex - 1
                                ].pairings[rowIndex].away,
                            )?.name || "BYE",
                          )
                          .map((player) => {
                            return (
                              <SelectItem
                                key={
                                  "matchup-" +
                                  rowIndex +
                                  "-player-1-select-" +
                                  player
                                }
                                value={player}
                                text={player}
                              />
                            );
                          })}
                      </Select>
                      <Select
                        hideLabel
                        id={`matchup-${rowIndex}-select`}
                        value={
                          props.mtState.store.events[0].players.find(
                            (player) =>
                              player.id ===
                              props.mtState.store.events[0].rounds[
                                props.selectedIndex - 1
                              ].pairings[rowIndex].away,
                          )?.name || "BYE"
                        }
                        items={splat(
                          props.mtState.store.events[0].players,
                          "name",
                        )}
                        onChange={props.updateSelectedPlayer(rowIndex, "home")}
                      >
                        {props
                          .getAllPlayerNamesExcluding(
                            props.mtState.store.events[0].players.find(
                              (player) =>
                                player.id ===
                                props.mtState.store.events[0].rounds[
                                  props.selectedIndex - 1
                                ].pairings[rowIndex].home,
                            )?.name || "BYE",
                          )
                          .map((player) => {
                            return (
                              <SelectItem
                                key={
                                  "matchup-" +
                                  rowIndex +
                                  "-player-2-select-" +
                                  player
                                }
                                value={player}
                                text={player}
                              />
                            );
                          })}
                      </Select>
                    </div>
                  </TableCell>
                  <TableCell style={{ width: "8vw" }}>
                    <div style={{ marginTop: "2rem" }} />
                    <MatchTextInput
                      getRoundScore={getRoundScore}
                      mtState={props.mtState}
                      selectedIndex={props.selectedIndex}
                      homeOrAway={"home"}
                      scoreWins={props.scoreWins}
                      rowIndex={rowIndex}
                    />
                    <MatchTextInput
                      getRoundScore={getRoundScore}
                      mtState={props.mtState}
                      selectedIndex={props.selectedIndex}
                      homeOrAway={"away"}
                      scoreWins={props.scoreWins}
                      rowIndex={rowIndex}
                    />
                  </TableCell>
                  <TableCell style={{ width: "8vw" }}>
                    <div style={{ marginTop: "2rem" }} />
                    <MatchTextInput
                      getRoundScore={getRoundScore}
                      mtState={props.mtState}
                      selectedIndex={props.selectedIndex}
                      homeOrAway={"home"}
                      scoreWins={props.scoreDraws}
                      rowIndex={rowIndex}
                      isDraws
                    />
                    <MatchTextInput
                      getRoundScore={getRoundScore}
                      mtState={props.mtState}
                      selectedIndex={props.selectedIndex}
                      homeOrAway={"away"}
                      scoreWins={props.scoreDraws}
                      rowIndex={rowIndex}
                      isDraws
                    />
                  </TableCell>
                  <TableCell>
                    <div style={{ paddingTop: "1rem" }}>
                      <div style={{ marginTop: "1rem" }} />
                      <DropPlayerCheckBox
                        mtState={props.mtState}
                        selectedIndex={props.selectedIndex}
                        rowIndex={rowIndex}
                        event_id={props.event_id}
                      />
                      <div style={{ marginTop: "1rem" }} />
                      <DropPlayerCheckBox
                        mtState={props.mtState}
                        selectedIndex={props.selectedIndex}
                        rowIndex={rowIndex}
                        event_id={props.event_id}
                        isAway
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataTable>
      <div style={{ paddingTop: "2rem" }}>
        <Button
          onClick={() => {
            props.back();
          }}
          renderIcon={ArrowLeft}
        >
          Players
        </Button>
        <Button
          style={{ marginLeft: "1rem" }}
          onClick={() => {
            props.next();
          }}
          renderIcon={props.selectedIndex === 5 ? Cut : ArrowRight}
        >
          {props.selectedIndex === 5
            ? "Cut to Top 8"
            : `Round ${props.selectedIndex + 1}`}
        </Button>
      </div>
    </TabPanel>
  );
};
