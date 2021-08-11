const express = require("express");
const router = express.Router();
const EventLecturer = require("../models/eventLecturer");
const reqAuth = require("../config/safeRoutes").reqAuth;
// route /admin/eventsLecturers/

router.post("/all", reqAuth, function (req, res) {
  EventLecturer.find({}, function (err, eventsLecturers) {
    if (err) {
      res.json({ success: false });
    }
    eventsLecturers = eventsLecturers.map(function (item) {
      const x = item;
      x.__v = undefined;
      return x;
    });
    res.json({ success: true, eventsLecturers: eventsLecturers });
  });
});

router.post("/create", (req, res) => {
  const { event_id, lecturer_id, type } = req.body;

  const query = { event_id, lecturer_id, type };
  EventLecturer.create(query, function (err, eventLecturer) {
    if (err) {
      if (err.name === "MongoError" && err.code === 11000) {
        // TODO: Validate same lecturer twice or more in the same event
        return res.status(422).send({
          success: false,
          message: "O palestrante do evento já existe!",
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
      organizerID: eventLecturer._id,
      msg: "Palestrante do evento criado com sucesso",
    });
  });
});

// TODO: Create get route

router.post("/edit", reqAuth, function (req, res) {
  const { organizerID, event_id, lecturer_id, type } = req.body;

  EventLecturer.find({ _id: organizerID }).then((eventLecturer) => {
    if (eventLecturer.length == 1) {
      const query = { _id: eventLecturer[0]._id };
      const newvalues = {
        $set: { event_id, lecturer_id, type },
      };
      EventLecturer.updateOne(query, newvalues, function (err, cb) {
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
