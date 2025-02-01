const express = require("express");
const path = require("path");
const app = express();
const port = process.env.PORT || 8080;
const guiBuild = path.join(__dirname, "build");

app.get("/", (req, res) => {
  app.use(express.static(guiBuild));

  res.sendFile(path.join(guiBuild, "index.html"));
});

app.listen(port, () => console.log(`Listening on port ${port}`));
