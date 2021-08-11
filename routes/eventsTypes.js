const express = require("express");
const router = express.Router();
const EventType = require("../models/eventType");
const reqAuth = require("../config/safeRoutes").reqAuth;
// route /admin/eventsTypes/

router.post("/all", reqAuth, function (req, res) {
  EventType.find({}, function (err, eventsTypes) {
    if (err) {
      res.json({ success: false });
    }
    eventsTypes = eventsTypes.map(function (item) {
      const x = item;
      x.__v = undefined;
      return x;
    });
    res.json(eventsTypes);
  });
});

router.post("/create", (req, res) => {
  const { name, office, func, status } = req.body;

  const query = { name, office, func, status };
  EventType.create(query, function (err, eventType) {
    if (err) {
      if (err.name === "MongoError" && err.code === 11000) {
        // Duplicate name
        return res
          .status(422)
          .send({ success: false, message: "O tipo de evento já existe!" });
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
      eventTypeID: eventType._id,
      msg: "Tipo de evento criado com sucesso",
    });
  });
});

// TODO: Create get route

router.post("/edit", reqAuth, function (req, res) {
  const { eventTypeID, name, office, func, status } = req.body;

  EventType.find({ _id: eventTypeID }).then((eventType) => {
    if (eventType.length == 1) {
      const query = { _id: eventType[0]._id };
      const newvalues = {
        $set: { name, office, func, status },
      };
      EventType.updateOne(query, newvalues, function (err, cb) {
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
