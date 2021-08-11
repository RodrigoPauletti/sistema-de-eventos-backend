const express = require("express");
const router = express.Router();
const EventOrganizer = require("../models/eventOrganizer");
const reqAuth = require("../config/safeRoutes").reqAuth;
// route /admin/eventsOrganizers/

router.post("/all", reqAuth, function (req, res) {
  EventOrganizer.find({}, function (err, eventsOrganizers) {
    if (err) {
      res.json({ success: false });
    }
    eventsOrganizers = eventsOrganizers.map(function (item) {
      const x = item;
      x.__v = undefined;
      return x;
    });
    res.json({ success: true, eventsOrganizers: eventsOrganizers });
  });
});

router.post("/create", (req, res) => {
  const { event_id, organizer_id, workload } = req.body;

  const query = { event_id, organizer_id, workload };
  EventOrganizer.create(query, function (err, eventOrganizer) {
    if (err) {
      if (err.name === "MongoError" && err.code === 11000) {
        // TODO: Validate same organizer twice or more in the same event
        return res.status(422).send({
          success: false,
          message: "O organizador do evento já existe!",
        });
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
      organizerID: eventOrganizer._id,
      msg: "Organizador do evento criado com sucesso",
    });
  });
});

// TODO: Create get route

router.post("/edit", reqAuth, function (req, res) {
  const { organizerID, event_id, organizer_id, workload } = req.body;

  EventOrganizer.find({ _id: organizerID }).then((eventOrganizer) => {
    if (eventOrganizer.length == 1) {
      const query = { _id: eventOrganizer[0]._id };
      const newvalues = {
        $set: { event_id, organizer_id, workload },
      };
      EventOrganizer.updateOne(query, newvalues, function (err, cb) {
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
