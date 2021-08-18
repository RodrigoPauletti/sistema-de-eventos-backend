const express = require("express");
const router = express.Router();
const Organizer = require("../models/organizer");
const reqAuth = require("../config/safeRoutes").reqAuth;
// route /admin/organizers/

router.post("/all", reqAuth, function (req, res) {
  Organizer.find({}, function (err, organizers) {
    if (err) {
      res.json({ success: false });
    }
    organizers = organizers.map(function (item) {
      const x = item;
      x.__v = undefined;
      return x;
    });
    res.json({ success: true, organizers: organizers });
  });
});

router.post("/create", (req, res) => {
  const { name, identification, /* office, */ status } = req.body;

  const query = { name, identification, /* office, */ status };
  Organizer.create(query, function (err, organizer) {
    if (err) {
      if (err.name === "MongoError" && err.code === 11000) {
        // Duplicate name
        return res
          .status(422)
          .send({ success: false, message: "O organizador já existe!" });
      }

      const firstErrorKey = Object.keys(err.errors).shift();
      if (firstErrorKey) {
        return res.status(422).json({
          success: false,
          msg: err.errors[firstErrorKey].message,
        });
      }

      return res.status(422).send(err);
    }

    res.json({
      success: true,
      organizerID: organizer._id,
      msg: "Organizador criado com sucesso",
    });
  });
});

// TODO: Create get route

router.post("/edit", reqAuth, function (req, res) {
  const { organizerID, name, identification, /* office, */ status } = req.body;

  Organizer.find({ _id: organizerID }).then((organizer) => {
    if (organizer.length == 1) {
      const query = { _id: organizer[0]._id };
      const newvalues = {
        $set: { name, identification, /* office, */ status },
      };
      Organizer.updateOne(query, newvalues, function (err, cb) {
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

// TODO: Create delete route

module.exports = router;
