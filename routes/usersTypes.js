const express = require("express");
const router = express.Router();
const UserType = require("../models/userType");
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

router.post("/create", (req, res) => {
  const { name, permission, status } = req.body;

  const query = { name, permission, status };
  UserType.create(query, function (err, userType) {
    if (err) {
      const firstErrorKey = Object.keys(err.errors).shift();
      if(firstErrorKey){
        return res.status(500).json({
          success: false,
          msg: err.errors[firstErrorKey].message,
        });
      }
      return res.status(500).json({
        success: false,
        msg: err,
      });
    }

    res.json({
      success: true,
      userTypeID: userType._id,
      msg: "Tipo de usuário criado com sucesso",
    });
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

// TODO: Create update route

// TODO: Create delete route

module.exports = router;
