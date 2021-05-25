const express = require("express");
const router = express.Router();
const EventCategory = require("../models/eventCategory");
const reqAuth = require("../config/safeRoutes").reqAuth;
// route /admin/eventsCategories/

router.post("/all", reqAuth, function (req, res) {
  EventCategory.find({}, function (err, eventsCategories) {
    if (err) {
      res.json({ success: false });
    }
    eventsCategories = eventsCategories.map(function (item) {
      const x = item;
      x.__v = undefined;
      return x;
    });
    res.json({ success: true, eventsCategories: eventsCategories });
  });
});

router.post("/create", (req, res) => {
  const { name, secondary_field, secondary_field_name, status } = req.body;

  const query = { name, secondary_field, secondary_field_name, status };
  EventCategory.create(query, function (err, eventCategory) {
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
      eventCategoryID: eventCategory._id,
      msg: "Categoria criada com sucesso",
    });
  });
});

router.post("/edit", reqAuth, function (req, res) {
  const {
    eventCategoryID,
    name,
    secondary_field,
    secondary_field_name,
    status,
  } = req.body;

  EventCategory.find({ _id: eventCategoryID }).then((eventCategory) => {
    if (eventCategory.length == 1) {
      const query = { _id: eventCategory[0]._id };
      const newvalues = {
        $set: { name, secondary_field, secondary_field_name, status },
      };
      EventCategory.updateOne(query, newvalues, function (err, cb) {
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
