/* eslint-disable max-len */
/* !

=========================================================
* Argon React NodeJS - v1.0.0
=========================================================

* Product Page: https://argon-dashboard-react-nodejs.creative-tim.com/
* Copyright 2020 Creative Tim (https://https://www.creative-tim.com//)
* Copyright 2020 ProjectData (https://projectdata.dev/)
* Licensed under MIT (https://github.com/creativetimofficial/argon-dashboard-react-nodejs/blob/main/README.md)

* Coded by Creative Tim & ProjectData

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
const express = require("express");
const bodyParser = require("body-parser");
const passport = require("passport");
const mongoose = require("mongoose");
const compression = require("compression");
// const https = require("https");
const http = require("http");
// const fs = require("fs");
const cors = require("cors");
const path = require("path");
const db = require("./config/keys").mongoURI;
// const CronJob = require("cron").CronJob;
// const crons = require("./config/crons");

require("dotenv").config();

// Instantiate express
const app = express();
app.use(compression());

// Passport Config
require("./config/passport")(passport);

// DB Config

// Connect to MongoDB
mongoose
  .connect(db, {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
    useCreateIndex: true,
  })
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.log(err));

app.use(cors());
// app.use(cors({
//   "origin": "*",
//   "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
//   "preflightContinue": false,
//   "optionsSuccessStatus": 204
// }));
// app.use(cors({
//   origin: '*',
//   optionsSuccessStatus: 200
// }));

// app.use(function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*"); // update to match the domain you will make the request from
//   res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
//   next();
// });

// app.options('*', cors()) // include before other routes

// Express body parser
app.use("/public", express.static("public"));
app.use(bodyParser.urlencoded({ extended: true, limit: "25mb" }));
app.use(bodyParser.json({ limit: "25mb" }));

// REACT BUILD for production
if (process.env.NODE_ENV === "PROD") {
  app.use(express.static(path.join(__dirname, "build")));
  app.get("/*", (req, res) => {
    res.sendFile(path.join(__dirname, "build", "index.html"));
  });
}

app.get('/', function (req, res) {
  res.send('Hello World!11');
});

app.use("/files", express.static(path.resolve(__dirname, "tmp", "uploads")));

// Initialize routes middleware
app.use("/api/users", require("./routes/users"));
app.use("/api/usersTypes", require("./routes/usersTypes"));

app.use("/api/lecturers", require("./routes/lecturers"));
app.use("/api/organizers", require("./routes/organizers"));

app.use("/api/events", require("./routes/events"));
app.use("/api/eventsCoverages", require("./routes/eventsCoverages"));
app.use("/api/eventsCategories", require("./routes/eventsCategories"));
app.use("/api/eventsTypes", require("./routes/eventsTypes"));
app.use("/api/eventsExpensesTypes", require("./routes/eventsExpensesTypes"));

// run at 3:10 AM -> delete old tokens
// const tokensCleanUp = new CronJob("10 3 * * *", function () {
//   crons.tokensCleanUp();
// });
// tokensCleanUp.start();

const PORT = process.env.PORT;

http.createServer({}, app).listen(PORT, function () {
  console.log(
    "App listening on port " + PORT + "! Go to http://localhost:" + PORT + "/"
  );
});

// FOR HTTPS ONLY
// https.createServer({
//   key: fs.readFileSync(process.env.SSLKEY),
//   cert: fs.readFileSync(process.env.SSLCERT),
// }, app)
//     .listen(PORT, function() {
//       console.log('App listening on port ' + PORT + '! Go to https://localhost:' + PORT + '/');
//     });
// app.use(requireHTTPS); FOR HTTPS
// app.enable('trust proxy');
// app.use(function(req, res, next) {
//   if (req.secure) {
//     return next();
//   }
//   res.redirect('https://' + req.headers.host + req.url);
// });

// /**
//  * @param {int} req req.
//  * @param {int} res res.
//  * @param {int} next next.
//  * @return {void} none.
//  */
// function requireHTTPS(req, res, next) {
//   if (!req.secure) {
//     return res.redirect("https://" + req.get("host") + req.url);
//   }
//   next();
// }
