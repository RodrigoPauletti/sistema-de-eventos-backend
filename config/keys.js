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
// dbPasswordDev = "mongodb://localhost/sistema-de-eventos";

// for PRODUCTION
const MONGO_USERNAME = "sistemaDeEventosUser";
const MONGO_PASSWORD = "bhnCkdiaxW5h4h42";
const MONGO_HOSTNAME = "cluster0.3o6py.mongodb.net";
const MONGO_DB = "sistema-eventos";

const url = `mongodb+srv://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}/${MONGO_DB}?retryWrites=true&w=majority`;

module.exports = {
  // mongoURI: dbPasswordDev,
  mongoURI: url,
  secret: "wpuJxLWvAkm1lccmXz0XCsn5HWwVGj0j5EGigZDJGk8zoVXmoYRWNWYCl9lNDMWj",
};
