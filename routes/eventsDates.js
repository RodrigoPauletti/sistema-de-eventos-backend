const express = require("express");
const router = express.Router();
const EventDate = require("../models/eventDate");
const reqAuth = require("../config/safeRoutes").reqAuth;
// route /admin/eventsDates/

router.post("/all", reqAuth, function (req, res) {
  EventDate.find({}, function (err, eventsDates) {
    if (err) {
      res.json({ success: false });
    }
    eventsDates = eventsDates.map(function (item) {
      const x = item;
      x.__v = undefined;
      return x;
    });
    res.json({ success: true, eventsDates: eventsDates });
  });
});

router.post("/create", (req, res) => {
  const { event_id, date, start_time, end_time, status } = req.body;

  const query = { event_id, date, start_time, end_time, status };
  EventDate.create(query, function (err, eventDate) {
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
      eventDateID: eventDate._id,
      msg: "Tipo de evento criado com sucesso",
    });
  });
});

router.post("/edit", reqAuth, function (req, res) {
  const { eventDateID, event_id, date, start_time, end_time, status } =
    req.body;

  EventDate.find({ _id: eventDateID }).then((eventDate) => {
    if (eventDate.length == 1) {
      const query = { _id: eventDate[0]._id };
      const newvalues = {
        $set: { event_id, date, start_time, end_time, status },
      };
      EventDate.updateOne(query, newvalues, function (err, cb) {
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
