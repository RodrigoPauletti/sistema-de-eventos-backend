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
const MONGO_USERNAME = "dbUser";
const MONGO_PASSWORD = "5lwtwr6RbagOgLYY";
const MONGO_HOSTNAME = "cluster0.3o6py.mongodb.net";
const MONGO_PORT = "27017";
const MONGO_DB = "sistema-eventos";

const url = `mongodb://${MONGO_USERNAME}:${MONGO_PASSWORD}@${MONGO_HOSTNAME}:${MONGO_PORT}/${MONGO_DB}?authSource=admin`;

module.exports = {
  // mongoURI: dbPasswordDev,
  // secret: "yourSecretKey",
  mongoURI: url,
};
