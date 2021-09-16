const express = require("express");
const router = express.Router();
const Organizer = require("../models/organizer");
const reqAuth = require("../config/safeRoutes").reqAuth;
// route /admin/organizers/

router.post("/all", reqAuth, function (req, res) {
  Organizer.find({}, function (err, organizers) {
    if (err) {
      return res.status(500).json({ success: false });
    }
    organizers = organizers.map(function (item) {
      const x = item;
      x.__v = undefined;
      return x;
    });
    return res.json({ success: true, organizers });
  });
});

router.post("/allActivated", reqAuth, function (req, res) {
  Organizer.find({ status: "1" }, function (err, organizers) {
    if (err) {
      return res.status(500).json({ success: false });
    }
    return res.json(organizers);
  });
});

router.post("/create", (req, res) => {
  const { name, identification, status } = req.body;

  const query = { name, identification, status };
  Organizer.create(query, function (err, organizer) {
    if (err) {
      if (err.name === "MongoError" && err.code === 11000) {
        // Duplicate name
        return res
          .status(500)
          .send({ success: false, message: "O organizador já existe!" });
      }

      const firstErrorKey = Object.keys(err.errors).shift();
      if (firstErrorKey) {
        return res.status(500).json({
          success: false,
          msg: err.errors[firstErrorKey].message,
        });
      }

      return res.status(500).send(err);
    }

    return res.json({
      success: true,
      organizerID: organizer._id,
      msg: "Organizador criado com sucesso",
    });
  });
});

// TODO: Create get route

router.post("/edit/:organizerID", reqAuth, function (req, res) {
  const { organizerID } = req.params;
  const { name, identification, status } = req.body;

  Organizer.find({ _id: organizerID }).then((organizer) => {
    if (organizer.length === 1) {
      const query = { _id: organizer[0]._id };
      const newvalues = {
        $set: { name, identification, status },
      };
      Organizer.updateOne(query, newvalues, function (err, cb) {
        if (err) {
          if (err.name === "MongoError" && err.code === 11000) {
            // Duplicate name
            return res.status(500).send({
              success: false,
              message: "O organizador já existe!",
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
