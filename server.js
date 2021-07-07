require("dotenv").config();
const express = require("express");
const paginate = require("express-paginate");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();

var corsOptions = {
  origin: "http://localhost:8081",
};

app.use(cors(corsOptions));
app.use(paginate.middleware(10, 50));

// parse requests of content-type - application/json
app.use(express.json({ limit: "50mb" }));
// parse requests of content-type - application/x-www-form-urlencoded
app.use(express.urlencoded({ limit: "50mb", extended: true }));

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));
app.use(function (err, req, res, next) {
  console.error("dari midleware", err.stack);
  res.status(500).send({
    message: err.message || "Some error occurred!",
  });
});
const db = require("./app/models");
db.sequelize.sync();
// db.sequelize.sync({ force: true }).then(() => {
//   console.log("Drop and re-sync db.");
// });
app.get("/", (req, res) => {
  res.json({ message: "Welcome to widodopangestu application." });
});
require("./app/auth/auth");

require("./app/routes/auth.routes")(app);
require("./app/routes/user.routes")(app);
require("./app/routes/turorial.routes")(app);
require("./app/routes/comment.routes")(app);
require("./app/routes/regulasi.routes")(app);
require("./app/routes/infografi.routes")(app);

// set port, listen for requests
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});
