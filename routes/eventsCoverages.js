const express = require("express");
const router = express.Router();
const EventCoverage = require("../models/eventCoverage");
const reqAuth = require("../config/safeRoutes").reqAuth;
// route /admin/eventsCoverages/

router.post("/all", reqAuth, function (req, res) {
  EventCoverage.find({}, function (err, eventsCoverages) {
    if (err) {
      return res.status(500).json({ success: false });
    }
    eventsCoverages = eventsCoverages.map(function (item) {
      const x = item;
      x.__v = undefined;
      return x;
    });
    return res.json(eventsCoverages);
  });
});

router.post("/allActivated", reqAuth, function (req, res) {
  EventCoverage.find({ status: "1" }, function (err, eventsCoverages) {
    if (err) {
      return res.status(500).json({ success: false });
    }
    return res.json(eventsCoverages);
  });
});

router.post("/create", (req, res) => {
  const { name, secondary_field, secondary_field_name, status } = req.body;

  const query = { name, secondary_field, secondary_field_name, status };
  EventCoverage.create(query, function (err, eventCoverage) {
    if (err) {
      if (err.name === "MongoError" && err.code === 11000) {
        // Duplicate name
        return res.status(500).send({
          success: false,
          message: "A abrangência de evento já existe!",
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
      eventCoverageID: eventCoverage._id,
      msg: "Abrangência criada com sucesso",
    });
  });
});

// TODO: Create get route

router.post("/edit/:eventCoverageID", reqAuth, function (req, res) {
  const { eventCoverageID } = req.params;
  const { name, secondary_field, secondary_field_name, status } = req.body;

  EventCoverage.find({ _id: eventCoverageID }).then((eventCoverage) => {
    if (eventCoverage.length === 1) {
      const query = { _id: eventCoverage[0]._id };
      const newvalues = {
        $set: { name, secondary_field, secondary_field_name, status },
      };
      EventCoverage.updateOne(query, newvalues, function (err, cb) {
        if (err) {
          if (err.name === "MongoError" && err.code === 11000) {
            // Duplicate name
            return res.status(500).send({
              success: false,
              message: "A abrangência de evento já existe!",
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
