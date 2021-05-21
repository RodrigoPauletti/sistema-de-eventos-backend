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
// eslint-disable-next-line new-cap
const router = express.Router();
const jwt = require("jsonwebtoken");
const config = require("../config/keys");
const UserType = require("../models/userType");
const User = require("../models/user");
const reqAuth = require("../config/safeRoutes").reqAuth;
// route /admin/users/

router.post("/all", reqAuth, function (req, res) {
  UserType.find({}, function (err, usersTypes) {
    if (err) {
      res.json({ success: false });
    }
    usersTypes = usersTypes.map(function (item) {
      const x = item;
      x.__v = undefined;
      return x;
    });
    res.json({ success: true, usersTypes: usersTypes });
  });
});

router.post("/edit", reqAuth, function (req, res) {
  const { userTypeID, name, permission, status } = req.body;

  UserType.find({ _id: userTypeID }).then((userType) => {
    if (userType.length == 1) {
      const query = { _id: userType[0]._id };
      const newvalues = { $set: { name, permission, status } };
      UserType.updateOne(query, newvalues, function (err, cb) {
        if (err) {
          // eslint-disable-next-line max-len
          res.json({
            success: false,
            msg: "Ocorreu um erro. Favor contatar o administrador",
          });
        }
        res.json({ success: true });
      });
    } else {
      res.json({ success: false });
    }
  });
});

router.post("/create", (req, res) => {
  const { name, permission, status } = req.body;

  const query = { name, permission, status };
  UserType.create(query, function (err, userType) {
    if (err) throw err;

    // eslint-disable-next-line max-len
    res.json({
      success: true,
      userTypeID: userType._id,
      msg: "Tipo de usuário criado com sucesso",
    });
  });
});

// TODO: Create delete route

module.exports = router;
