const express = require("express");
const router = express.Router();
const EventExpense = require("../models/eventExpense");
const reqAuth = require("../config/safeRoutes").reqAuth;
// route /admin/eventExpenses/

router.post("/all", reqAuth, function (req, res) {
  EventExpense.find({}, function (err, eventExpenses) {
    if (err) {
      res.json({ success: false });
    }
    eventExpenses = eventExpenses.map(function (item) {
      const x = item;
      x.__v = undefined;
      return x;
    });
    res.json({ success: true, eventExpenses: eventExpenses });
  });
});

router.post("/create", (req, res) => {
  const { event_id, event_expense_type_id, provider, amount, comments } =
    req.body;

  const query = { event_id, event_expense_type_id, provider, amount, comments };
  EventExpense.create(query, function (err, eventExpense) {
    if (err) {
      if (err.name === "MongoError" && err.code === 11000) {
        // Duplicate name
        return res.status(422).send({
          success: false,
          message: "A despesa de evento já existe!",
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
      organizerID: eventExpense._id,
      msg: "Despesa de evento criada com sucesso",
    });
  });
});

router.post("/edit", reqAuth, function (req, res) {
  const {
    organizerID,
    event_id,
    event_expense_type_id,
    provider,
    amount,
    comments,
  } = req.body;

  EventExpense.find({ _id: organizerID }).then((eventExpense) => {
    if (eventExpense.length == 1) {
      const query = { _id: eventExpense[0]._id };
      const newvalues = {
        $set: { event_id, event_expense_type_id, provider, amount, comments },
      };
      EventExpense.updateOne(query, newvalues, function (err, cb) {
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
