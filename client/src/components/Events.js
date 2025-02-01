import React, { useEffect, useState } from "react";

import initState from "../lib/utils";
import MtPlayers from "./Players";
import {
  Tab,
  TabPanel,
  TabPanels,
  Tabs,
  TabList,
  Button,
  Checkbox,
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
} from "@carbon/react";
import { ArrowRight } from "@carbon/icons-react";
import { Round } from "./Round";

const mtState = new initState(() => {});
mtState.events.create({
  name: "event",
  id: "id",
});

const PRETEND_PROPS = {
  event_id: "id",
};

class MtEvent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedIndex: 0,
      store: mtState.store,
    };
    this.setSelectedIndex = this.setSelectedIndex.bind(this);
    this.updateSelectedPlayer = this.updateSelectedPlayer.bind(this);
    this.pair = this.pair.bind(this);
    this.getAllPlayerNamesExcluding =
      this.getAllPlayerNamesExcluding.bind(this);
    this.scoreWins = this.scoreWins.bind(this);
    this.scoreDraws = this.scoreDraws.bind(this);
  }
  componentDidMount() {
    mtState.setUpdateCallback(() => {
      // save state
      this.setState({});
    });
  }

  scoreDraws(event) {
    let selectId = event.target.id.split("-vs-");
    mtState.events.rounds.score({
      event_id: PRETEND_PROPS.event_id,
      roundIndex: this.state.selectedIndex - 1,
      field: "draws",
      score: parseInt(event.target.value),
      playerId: selectId[0],
      pairingIndex: selectId[2],
    });
    this.setState({});
  }

  scoreWins(event) {
    let selectId = event.target.id.split("-vs-");
    mtState.events.rounds.score({
      event_id: PRETEND_PROPS.event_id,
      roundIndex: this.state.selectedIndex - 1,
      field: "wins",
      score:
        event.target.value.length === 0 ? 0 : parseInt(event.target.value[0]),
      playerId: selectId[0],
      pairingIndex: selectId[2],
    });
    this.setState({});
  }

  getAllPlayerNamesExcluding(name) {
    let allNames = [];
    mtState.store.events[0].players.forEach((player) => {
      if (player.name !== name) allNames.push(player.name);
    });
    if (mtState.store.events[0].players.length % 2 !== 0) {
      allNames.push("BYE");
    }
    return allNames;
  }

  pair() {
    mtState.events.rounds.pair(PRETEND_PROPS.event_id);
    this.setState({ selectedIndex: 1 });
  }

  setSelectedIndex(event) {
    this.setState({
      selectedIndex: event.selectedIndex,
    });
  }

  updateSelectedPlayer(pairingIndex, player) {
    return (event) => {
      let playerId =
        [...mtState.store.events[0].players].find(
          (player) => player.name === event.target.value,
        )?.id || "BYE";
      mtState.events.rounds.updatePairing(
        PRETEND_PROPS.event_id,
        0,
        pairingIndex,
        {
          player: player,
          player_id: playerId,
        },
      );
      this.setState({});
    };
  }

  render() {
    // console.log(JSON.stringify(mtState.store.events[0].top8, null, 2));
    // console.log(JSON.stringify(mtState.store.events[0], null, 2));
    return (
      <Tabs
        onChange={this.setSelectedIndex}
        selectedIndex={this.state.selectedIndex}
        key={JSON.stringify(mtState.store.events[0])}
      >
        <TabList contained aria-label="hello">
          <Tab>Players</Tab>
          {mtState.events
            .lookup(PRETEND_PROPS.event_id)
            .rounds.map((round, roundIndex) => (
              <Tab key={"round-" + (roundIndex + 1)}>
                Round {roundIndex + 1}
              </Tab>
            ))}
          {mtState.events.lookup(PRETEND_PROPS.event_id).top8 && (
            <Tab key={"top-8"}>Top 8</Tab>
          )}
        </TabList>
        <TabPanels>
          <TabPanel>
            <MtPlayers
              mtState={mtState}
              eventId={PRETEND_PROPS.event_id}
              eventIndex={0}
            />
            <div style={{ paddingTop: "2rem" }}>
              {mtState.store.events[0].rounds.length > 1 ? (
                <Button onClick={this.pair} renderIcon={ArrowRight}>
                  Generate Pairings
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    this.pair();
                    this.setState({ selectedIndex: 1 });
                  }}
                  renderIcon={ArrowRight}
                >
                  Round 1
                </Button>
              )}
            </div>
          </TabPanel>
          {mtState.events.lookup(PRETEND_PROPS.event_id).rounds.map(
            (round, roundIndex) =>
              this.state.selectedIndex > 0 &&
              this.state.selectedIndex <= 5 && (
                <TabPanel key={"round" + roundIndex}>
                  <Round
                    event_id={PRETEND_PROPS.event_id}
                    mtState={mtState}
                    key={"round" + roundIndex}
                    selectedIndex={this.state.selectedIndex}
                    updateSelectedPlayer={this.updateSelectedPlayer}
                    getAllPlayerNamesExcluding={this.getAllPlayerNamesExcluding}
                    scoreWins={this.scoreWins}
                    set={() => this.setState({})}
                    scoreDraws={this.scoreDraws}
                    back={() =>
                      this.setState({
                        selectedIndex: this.state.selectedIndex - 1,
                      })
                    }
                    next={() => {
                      if (this.state.selectedIndex === 5) {
                        mtState.events.cutToTop8(PRETEND_PROPS.event_id);
                        this.setState({
                          selectedIndex: this.state.selectedIndex + 1,
                        });
                      } else {
                        mtState.events.rounds.pair(PRETEND_PROPS.event_id);
                        this.setState({
                          selectedIndex: this.state.selectedIndex + 1,
                        });
                      }
                    }}
                  />
                </TabPanel>
              ),
          )}
          {
            <TabPanel key={"round" + "top8"}>
              {this.state.selectedIndex === 6 &&
                mtState.store.events[0].top8 && (
                  <TabPanel>
                    <DataTable
                      rows={[{ id: "1" }]}
                      headers={[
                        { key: "8", header: "Top 8" },
                        { key: "4", header: "Top 4" },
                        { key: "2", header: "Top 2" },
                        { key: "1", header: "Winner" },
                      ]}
                      key={JSON.stringify(mtState.store.events[0].top8)}
                    >
                      {({
                        rows,
                        headers,
                        getTableProps,
                        getHeaderProps,
                        getRowProps,
                      }) => (
                        <Table {...getTableProps()}>
                          <TableHead>
                            {headers.map((header, headerIndex) => (
                              <TableHeader
                                {...getHeaderProps({ header })}
                                key={"header-" + headerIndex}
                                style={{ padding: "1rem" }}
                              >
                                {header.header}
                              </TableHeader>
                            ))}
                          </TableHead>
                          <TableBody>
                            <TableRow>
                              <TableCell>
                                {mtState.store.events[0].top8[0].map(
                                  (match, matchIndex) => (
                                    <>
                                      <h5
                                        style={{
                                          paddingTop: "1rem",
                                          paddingBottom: "0.5rem",
                                        }}
                                      >
                                        Match {matchIndex + 1}
                                      </h5>
                                      <div className="alignButtons">
                                        <div>
                                          <Checkbox
                                            id={
                                              "check-match-home-8-" + matchIndex
                                            }
                                            onChange={(_, checked) => {
                                              mtState.events.scoreTop8(
                                                "id",
                                                match.id,
                                                match.home,
                                              );
                                            }}
                                            checked={
                                              matchIndex === 0
                                                ? mtState.store.events[0]
                                                    .top8[1][0].home ===
                                                  match.home
                                                : matchIndex === 1
                                                  ? mtState.store.events[0]
                                                      .top8[1][0].away ===
                                                    match.home
                                                  : matchIndex === 2
                                                    ? mtState.store.events[0]
                                                        .top8[1][1].home ===
                                                      match.home
                                                    : mtState.store.events[0]
                                                        .top8[1][1].away ===
                                                      match.home
                                            }
                                          />
                                        </div>
                                        <p
                                          style={{
                                            marginTop: "0.30rem",
                                            marginBottom: "0.30rem",
                                          }}
                                        >
                                          {
                                            mtState.store.events[0].players.find(
                                              (player) =>
                                                player.id === match.home,
                                            ).name
                                          }
                                        </p>
                                      </div>
                                      <div className="alignButtons">
                                        <div>
                                          <Checkbox
                                            id={
                                              "check-match-home-away-8-" +
                                              matchIndex
                                            }
                                            onChange={(_, checked) => {
                                              mtState.events.scoreTop8(
                                                "id",
                                                match.id,
                                                match.away,
                                              );
                                            }}
                                            checked={
                                              matchIndex === 0
                                                ? mtState.store.events[0]
                                                    .top8[1][0].home ===
                                                  match.away
                                                : matchIndex === 1
                                                  ? mtState.store.events[0]
                                                      .top8[1][0].away ===
                                                    match.away
                                                  : matchIndex === 2
                                                    ? mtState.store.events[0]
                                                        .top8[1][1].home ===
                                                      match.away
                                                    : mtState.store.events[0]
                                                        .top8[1][1].away ===
                                                      match.away
                                            }
                                          />
                                        </div>
                                        <p
                                          style={{
                                            marginTop: "0.30rem",
                                            marginBottom: "0.30rem",
                                          }}
                                        >
                                          {
                                            mtState.store.events[0].players.find(
                                              (player) =>
                                                player.id === match.away,
                                            ).name
                                          }
                                        </p>
                                      </div>
                                    </>
                                  ),
                                )}
                              </TableCell>
                              <TableCell>
                                {mtState.store.events[0].top8[1].map(
                                  (match, matchIndex) => (
                                    <>
                                      <h5
                                        style={{
                                          paddingTop: "1rem",
                                          paddingBottom: "0.5rem",
                                        }}
                                      >
                                        Match {matchIndex + 1}
                                      </h5>
                                      <div className="alignButtons">
                                        <div>
                                          {match.home && match.away && (
                                            <Checkbox
                                              id={
                                                "check-match-home-4-" +
                                                matchIndex
                                              }
                                              onChange={(_, checked) => {
                                                mtState.events.scoreTop8(
                                                  "id",
                                                  match.id,
                                                  match.home,
                                                );
                                                this.setState({});
                                              }}
                                              checked={
                                                matchIndex === 0
                                                  ? mtState.store.events[0]
                                                      .top8[2][0].home ===
                                                    match.home
                                                  : mtState.store.events[0]
                                                      .top8[2][0].away ===
                                                    match.home
                                              }
                                            />
                                          )}
                                        </div>
                                        <p
                                          style={{
                                            marginTop: "0.30rem",
                                            marginBottom: "0.30rem",
                                          }}
                                        >
                                          {match.home
                                            ? mtState.store.events[0].players.find(
                                                (player) =>
                                                  player.id === match.home,
                                              ).name
                                            : "Awaiting Match Result"}
                                        </p>
                                      </div>
                                      <div className="alignButtons">
                                        <div>
                                          {match.home && match.away && (
                                            <Checkbox
                                              id={
                                                "check-match-away-4-" +
                                                matchIndex
                                              }
                                              onChange={(_, checked) => {
                                                mtState.events.scoreTop8(
                                                  "id",
                                                  match.id,
                                                  match.away,
                                                );
                                              }}
                                              checked={
                                                matchIndex === 0
                                                  ? mtState.store.events[0]
                                                      .top8[2][0].home ===
                                                    match.away
                                                  : mtState.store.events[0]
                                                      .top8[2][0].away ===
                                                    match.away
                                              }
                                            />
                                          )}
                                        </div>
                                        <p
                                          style={{
                                            marginTop: "0.30rem",
                                            marginBottom: "0.30rem",
                                          }}
                                        >
                                          {match.away
                                            ? mtState.store.events[0].players.find(
                                                (player) =>
                                                  player.id === match.away,
                                              ).name
                                            : "Awaiting Match Result"}
                                        </p>
                                      </div>
                                    </>
                                  ),
                                )}
                              </TableCell>
                              <TableCell>
                                {mtState.store.events[0].top8[2].map(
                                  (match, matchIndex) => (
                                    <>
                                      <h5
                                        style={{
                                          paddingTop: "1rem",
                                          paddingBottom: "0.5rem",
                                        }}
                                      >
                                        Match {matchIndex + 1}
                                      </h5>
                                      <div className="alignButtons">
                                        <div>
                                          {match.home && match.away && (
                                            <Checkbox
                                              id={
                                                "check-match-home-2-" +
                                                matchIndex
                                              }
                                              checked={
                                                mtState.store.events[0]
                                                  .top8[3][0].winner ===
                                                match.home
                                              }
                                              onChange={(_, checked) => {
                                                mtState.events.scoreTop8(
                                                  "id",
                                                  match.id,
                                                  match.home,
                                                );
                                              }}
                                            />
                                          )}
                                        </div>
                                        <p
                                          style={{
                                            marginTop: "0.30rem",
                                            marginBottom: "0.30rem",
                                          }}
                                        >
                                          {match.home
                                            ? mtState.store.events[0].players.find(
                                                (player) =>
                                                  player.id === match.home,
                                              ).name
                                            : "Awaiting Match Result"}
                                        </p>
                                      </div>
                                      <div className="alignButtons">
                                        <div>
                                          {match.home && match.away && (
                                            <Checkbox
                                              id={
                                                "check-match-away-2-" +
                                                matchIndex
                                              }
                                              checked={
                                                mtState.store.events[0]
                                                  .top8[3][0].winner ===
                                                match.away
                                              }
                                              onChange={(_, checked) => {
                                                mtState.events.scoreTop8(
                                                  "id",
                                                  match.id,
                                                  match.away,
                                                );
                                              }}
                                            />
                                          )}
                                        </div>
                                        <p
                                          style={{
                                            marginTop: "0.30rem",
                                            marginBottom: "0.30rem",
                                          }}
                                        >
                                          {match.away
                                            ? mtState.store.events[0].players.find(
                                                (player) =>
                                                  player.id === match.away,
                                              ).name
                                            : "Awaiting Match Result"}
                                        </p>
                                      </div>
                                    </>
                                  ),
                                )}
                              </TableCell>
                              <TableCell>
                                <>
                                  <h5
                                    style={{
                                      paddingTop: "1rem",
                                      paddingBottom: "0.5rem",
                                    }}
                                  >
                                    Winner
                                  </h5>
                                  <p
                                    style={{
                                      marginTop: "0.30rem",
                                      marginBottom: "0.30rem",
                                    }}
                                  >
                                    {mtState.store.events[0].top8[3][0]
                                      .winner || "Awaiting Match Result"}
                                  </p>
                                </>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      )}
                    </DataTable>
                  </TabPanel>
                )}
            </TabPanel>
          }
        </TabPanels>
      </Tabs>
    );
  }
}

export default MtEvent;
