import React, { useEffect, useState } from "react";
import { Route, Routes } from "react-router-dom";
import { Content, Header, HeaderName, SkipToContent } from "@carbon/react";
import "./App.css";
import "./index.scss";
import MtPlayers from "./components/Players";
import MtEvent from "./components/Events";

function App() {
  return (
    <div>
      <Header aria-label="Mister Tournament">
        <SkipToContent />
        <HeaderName href="#" prefix="Welcome To">
          Mister Tournament
        </HeaderName>
      </Header>

      <Content>
        <MtEvent />
      </Content>
    </div>
  );
}

export default App;
