const express = require("express");
const router = express.Router();
const EventCategory = require("../models/eventCategory");
const reqAuth = require("../config/safeRoutes").reqAuth;
// route /admin/eventsCategories/

router.post("/all", reqAuth, function (req, res) {
  EventCategory.find({}, function (err, eventsCategories) {
    if (err) {
      return res.status(500).json({ success: false });
    }
    eventsCategories = eventsCategories.map(function (item) {
      const x = item;
      x.__v = undefined;
      return x;
    });
    return res.json(eventsCategories);
  });
});

router.post("/allActivated", reqAuth, function (req, res) {
  EventCategory.find({ status: "1" }, function (err, eventsCategories) {
    if (err) {
      return res.status(500).json({ success: false });
    }
    return res.json(eventsCategories);
  });
});

router.post("/create", (req, res) => {
  const { name, secondary_field, secondary_field_name, status } = req.body;

  const query = { name, secondary_field, secondary_field_name, status };
  EventCategory.create(query, function (err, eventCategory) {
    if (err) {
      if (err.name === "MongoError" && err.code === 11000) {
        // Duplicate name
        return res.status(500).send({
          success: false,
          message: "A categoria de evento já existe!",
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
      eventCategoryID: eventCategory._id,
      msg: "Categoria criada com sucesso",
    });
  });
});

// TODO: Create get route

router.post("/edit/:eventCategoryID", reqAuth, function (req, res) {
  const { eventCategoryID } = req.params;
  const { name, secondary_field, secondary_field_name, status } = req.body;

  EventCategory.find({ _id: eventCategoryID }).then((eventCategory) => {
    if (eventCategory.length === 1) {
      const query = { _id: eventCategory[0]._id };
      const newvalues = {
        $set: { name, secondary_field, secondary_field_name, status },
      };
      EventCategory.updateOne(query, newvalues, function (err, cb) {
        if (err) {
          if (err.name === "MongoError" && err.code === 11000) {
            // Duplicate name
            return res.status(500).send({
              success: false,
              message: "A categoria de evento já existe!",
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
