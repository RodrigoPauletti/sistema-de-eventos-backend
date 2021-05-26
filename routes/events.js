const express = require("express");
const router = express.Router();
const Event = require("../models/event");
const reqAuth = require("../config/safeRoutes").reqAuth;
// route /admin/events/

router.post("/all", reqAuth, function (req, res) {
  Event.find({}, function (err, events) {
    if (err) {
      res.json({ success: false });
    }
    events = events.map(function (item) {
      const x = item;
      x.__v = undefined;
      return x;
    });
    res.json({ success: true, events: events });
  });
});

router.post("/create", (req, res) => {
  const {
    event_type_id,
    user_id,
    name,
    category_id,
    coverage_id,
    workload,
    audience_estimate,
    online,
    link,
    place,
    ticket,
    objective,
    justification,
    schedule,
    details,
    resources,
    receipt_amount,
    total_amount,
    status,
  } = req.body;

  const query = {
    event_type_id,
    user_id,
    name,
    category_id,
    coverage_id,
    workload,
    audience_estimate,
    online,
    link,
    place,
    ticket,
    objective,
    justification,
    schedule,
    details,
    resources,
    receipt_amount,
    total_amount,
    status,
  };
  Event.create(query, function (err, event) {
    if (err) {
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

    res.json({
      success: true,
      eventID: event._id,
      msg: "Evento criado com sucesso",
    });
  });
});

router.post("/edit", reqAuth, function (req, res) {
  const {
    eventID,
    event_type_id,
    user_id,
    name,
    category_id,
    coverage_id,
    workload,
    audience_estimate,
    online,
    link,
    place,
    ticket,
    objective,
    justification,
    schedule,
    details,
    resources,
    receipt_amount,
    total_amount,
    status,
  } = req.body;

  Event.find({ _id: eventID }).then((event) => {
    if (event.length == 1) {
      const query = { _id: event[0]._id };
      const newvalues = {
        $set: {
          event_type_id,
          user_id,
          name,
          category_id,
          coverage_id,
          workload,
          audience_estimate,
          online,
          link,
          place,
          ticket,
          objective,
          justification,
          schedule,
          details,
          resources,
          receipt_amount,
          total_amount,
          status,
        },
      };
      Event.updateOne(query, newvalues, function (err, cb) {
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
