import React, { useEffect, useState } from "react";
import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  TextInput,
  Button,
} from "@carbon/react";
import { CloseFilled, Edit, TrashCan } from "@carbon/icons-react";
import { splatContains } from "lazy-z";

class MtPlayers extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentlyEditingPlayer: -1,
      currentlyEditingPlayerName: "",
      newPlayerName: "",
    };
    this.editPlayerButtonClick = this.editPlayerButtonClick.bind(this);
    this.editPlayerNameChange = this.editPlayerNameChange.bind(this);
    this.handleKeyPress = this.handleKeyPress.bind(this);
    this.newPlayerNameChange = this.newPlayerNameChange.bind(this);
    this.newPlayerHasDuplicateName = this.newPlayerHasDuplicateName.bind(this);
    this.onDeleteClick = this.onDeleteClick.bind(this);
  }

  onDeleteClick(index) {
    return () => {
      this.props.mtState.events.players.delete(
        {},
        {
          data: {
            id: this.props.mtState.store.events[this.props.eventIndex].players[
              index
            ].id,
            event_id: this.props.eventId,
          },
        },
      );
      // lol otherwise won't reset
      this.setState(
        this.state.currentlyEditingPlayer === index
          ? {
              currentlyEditingPlayer: -1,
              currentlyEditingPlayerName: "",
            }
          : {},
      );
    };
  }

  editingPlayerHasDuplicateName() {
    if (this.state.currentlyEditingPlayer > -1) {
      return splatContains(
        this.props.mtState.store.events[this.props.eventIndex].players.filter(
          (player, index) => index !== this.state.currentlyEditingPlayer,
        ),
        "name",
        this.state.currentlyEditingPlayerName,
      );
    } else return false;
  }

  newPlayerHasDuplicateName() {
    return splatContains(
      this.props.mtState.store.events[this.props.eventIndex].players,
      "name",
      this.state.newPlayerName,
    );
  }

  handleKeyPress(event) {
    let key = event.key;
    document.getElementById("new-player").focus();
    if (
      key === "Enter" &&
      this.state.currentlyEditingPlayerName.length > 1 &&
      this.state.currentlyEditingPlayer !== -1 &&
      !this.editingPlayerHasDuplicateName()
    ) {
      let player =
        this.props.mtState.store.events[this.props.eventIndex].players[
          this.state.currentlyEditingPlayer
        ];
      this.props.mtState.events.players.save(
        {
          event_id: this.props.eventId,
          name: this.state.currentlyEditingPlayerName,
        },
        {
          data: {
            id: player.id,
            event_id: this.props.eventId,
          },
        },
      );
      this.setState({
        currentlyEditingPlayer: -1,
      });
    } else if (
      key === "Enter" &&
      this.state.newPlayerName.length > 1 &&
      !this.newPlayerHasDuplicateName()
    ) {
      this.props.mtState.events.players.create({
        event_id: this.props.eventId,
        name: this.state.newPlayerName,
      });
      this.setState(
        {
          newPlayerName: "",
        },
        () => {
          console.log("focus")
          document.getElementById("new-player").focus();
        },
      );
    }
  }

  newPlayerNameChange(event) {
    this.setState({
      newPlayerName: event.target.value,
    });
  }

  editPlayerNameChange(event) {
    this.setState({
      currentlyEditingPlayerName: event.target.value,
    });
  }

  editPlayerButtonClick(index) {
    this.setState(
      {
        currentlyEditingPlayer: index,
        currentlyEditingPlayerName:
          index > -1
            ? this.props.mtState.store.events[this.props.eventIndex].players[
                index
              ].name
            : "",
      },
      () => {
        if (index > -1) {
          // set cursor to clicked element
          document.getElementById("editing-player-" + index).focus();
          // select all
          document.getElementById("editing-player-" + index).select();
        }
      },
    );
  }

  render() {
    document.addEventListener("keypress", this.handleKeyPress);

    return (
      <>
        <DataTable
          rows={this.props.mtState.store.events[this.props.eventIndex].players}
          headers={[{ key: "name", header: "Name" }]}
          key={JSON.stringify(
            this.props.mtState.store.events[this.props.eventIndex].players,
          )}
        >
          {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
            <Table {...getTableProps()}>
              <TableHead>
                <TableRow>
                  {headers.map((header) => (
                    <TableHeader
                      {...getHeaderProps({ header })}
                      key={"header" + header.header}
                    >
                      {header.header}
                    </TableHeader>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row, rowIndex) => (
                  <TableRow
                    {...getRowProps({ row })}
                    key={"player-row-" + rowIndex}
                  >
                    {row.cells.map((cell) => (
                      <TableCell key={cell.id} className="alignButtons">
                        <div style={{ marginLeft: "-0.5rem" }}>
                          <Button
                            hasIconOnly
                            kind="ghost"
                            iconDescription="Edit player"
                            renderIcon={
                              this.state.currentlyEditingPlayer === rowIndex
                                ? CloseFilled
                                : Edit
                            }
                            onClick={() => {
                              this.editPlayerButtonClick(
                                this.state.currentlyEditingPlayer === rowIndex
                                  ? -1
                                  : rowIndex,
                              );
                            }}
                          />
                          <Button
                            hasIconOnly
                            kind="ghost"
                            renderIcon={TrashCan}
                            onClick={this.onDeleteClick(rowIndex)}
                            iconDescription="Delete player"
                          />
                        </div>
                        {rowIndex === this.state.currentlyEditingPlayer ? (
                          <div
                            style={{
                              paddingTop: "1rem",
                              paddingBottom: "1rem",
                              width: "100%",
                            }}
                          >
                            <TextInput
                              style={{ width: "100%" }}
                              labelText={
                                "Editing player: " +
                                this.props.mtState.store.events[
                                  this.props.eventIndex
                                ].players[rowIndex].name
                              }
                              id={`editing-player-${rowIndex}`}
                              value={this.state.currentlyEditingPlayerName}
                              helperText="Press Enter to Save"
                              onChange={this.editPlayerNameChange}
                              invalid={
                                this.state.currentlyEditingPlayerName.length <
                                  1 || this.editingPlayerHasDuplicateName()
                              }
                              invalidText={
                                this.state.currentlyEditingPlayerName.length < 1
                                  ? "Enter a player name"
                                  : `Duplicate player name ${this.state.currentlyEditingPlayerName}`
                              }
                            />
                          </div>
                        ) : (
                          <p style={{ marginLeft: "1rem" }}>{cell.value}</p>
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell style={{ padding: "1rem" }}>
                    <TextInput
                      id="new-player"
                      labelText="New Player"
                      helperText={
                        this.state.newPlayerName === ""
                          ? "Enter a name to add a new player"
                          : "Press Enter to Confirm"
                      }
                      value={this.state.newPlayerName}
                      onChange={this.newPlayerNameChange}
                      disabled={this.state.currentlyEditingPlayer !== -1}
                      invalid={this.newPlayerHasDuplicateName()}
                      invalidText={`Duplicate player name ${this.state.newPlayerName}`}
                      onFocus={(e) => e.target.select()}
                    />
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </DataTable>
      </>
    );
  }
}

export default MtPlayers;
