const express = require("express");
const router = express.Router();
const UserType = require("../models/userType");
const reqAuth = require("../config/safeRoutes").reqAuth;
// route /admin/users/

router.post("/all", reqAuth, function (req, res) {
  UserType.find({}, function (err, usersTypes) {
    if (err) {
      return res.status(500).json({ success: false });
    }
    usersTypes = usersTypes.map(function (item) {
      const x = item;
      x.__v = undefined;
      return x;
    });
    return res.json({ success: true, usersTypes });
  });
});

router.post("/create", (req, res) => {
  const { name, permission, status } = req.body;

  const query = { name, permission, status };
  UserType.create(query, function (err, userType) {
    if (err) {
      if (err.name === "MongoError" && err.code === 11000) {
        // Duplicate name
        return res.status(500).send({
          success: false,
          message: "O tipo de usuário já existe!",
        });
      }

      const firstErrorKey = Object.keys(err.errors).shift();
      if (firstErrorKey) {
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

    return res.json({
      success: true,
      userTypeID: userType._id,
      msg: "Tipo de usuário criado com sucesso",
    });
  });
});

// TODO: Create get route

router.post("/edit/:userTypeID", reqAuth, function (req, res) {
  const { userTypeID } = req.params;
  const { name, permission, status } = req.body;

  UserType.find({ _id: userTypeID }).then((userType) => {
    if (userType.length === 1) {
      const query = { _id: userType[0]._id };
      const newvalues = { $set: { name, permission, status } };
      UserType.updateOne(query, newvalues, function (err, cb) {
        if (err) {
          if (err.name === "MongoError" && err.code === 11000) {
            // Duplicate name
            return res.status(500).send({
              success: false,
              message: "O tipo de usuário já existe!",
            });
          }

          return res.status(500).json({
            success: false,
            msg: "Ocorreu um erro. Favor contatar o administrador",
          });
        }
        return res.json({ success: true });
      });
    } else {
      return res.status(500).json({ success: false });
    }
  });
});

// TODO: Create delete route

module.exports = router;
