const express = require("express");
const router = express.Router();
const EventCoverage = require("../models/eventCoverage");
const reqAuth = require("../config/safeRoutes").reqAuth;
// route /admin/eventsCoverages/

router.post("/all", reqAuth, function (req, res) {
  EventCoverage.find({}, function (err, eventsCoverages) {
    if (err) {
      res.json({ success: false });
    }
    eventsCoverages = eventsCoverages.map(function (item) {
      const x = item;
      x.__v = undefined;
      return x;
    });
    res.json(eventsCoverages);
  });
});

router.post("/create", (req, res) => {
  const { name, secondary_field, secondary_field_name, status } = req.body;

  const query = { name, secondary_field, secondary_field_name, status };
  EventCoverage.create(query, function (err, eventCoverage) {
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
      eventCoverageID: eventCoverage._id,
      msg: "Abrangência criada com sucesso",
    });
  });
});

// TODO: Create get route

router.post("/edit", reqAuth, function (req, res) {
  const {
    eventCoverageID,
    name,
    secondary_field,
    secondary_field_name,
    status,
  } = req.body;

  EventCoverage.find({ _id: eventCoverageID }).then((eventCoverage) => {
    if (eventCoverage.length == 1) {
      const query = { _id: eventCoverage[0]._id };
      const newvalues = {
        $set: { name, secondary_field, secondary_field_name, status },
      };
      EventCoverage.updateOne(query, newvalues, function (err, cb) {
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
