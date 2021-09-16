const express = require("express");
const router = express.Router();
const EventExpenseType = require("../models/eventExpenseType");
const reqAuth = require("../config/safeRoutes").reqAuth;
// route /admin/eventsExpensesTypes/

router.post("/all", reqAuth, function (req, res) {
  EventExpenseType.find({}, function (err, eventsExpensesTypes) {
    if (err) {
      return res.status(500).json({ success: false });
    }
    eventsExpensesTypes = eventsExpensesTypes.map(function (item) {
      const x = item;
      x.__v = undefined;
      return x;
    });
    return res.json(eventsExpensesTypes);
  });
});

router.post("/allActivated", reqAuth, function (req, res) {
  EventExpenseType.find({ status: "1" }, function (err, eventsExpensesTypes) {
    if (err) {
      return res.status(500).json({ success: false });
    }
    return res.json(eventsExpensesTypes);
  });
});

router.post("/create", (req, res) => {
  const { name, status } = req.body;

  const query = { name, status };
  EventExpenseType.create(query, function (err, eventExpenseType) {
    if (err) {
      if (err.name === "MongoError" && err.code === 11000) {
        // Duplicate name
        return res.status(500).send({
          success: false,
          message: "O tipo de despesa de evento já existe!",
        });
      }

      const firstErrorKey = Object.keys(err.errors).shift();
      if (firstErrorKey) {
        return res.status(500).json({
          success: false,
          msg: err.errors[firstErrorKey].message,
        });
      }

      return res.status(500).send(err);
    }

    return res.json({
      success: true,
      expenseTypeID: eventExpenseType._id,
      msg: "Tipo de despesa de evento criado com sucesso",
    });
  });
});

// TODO: Create get route

router.post("/edit/:expenseTypeID", reqAuth, function (req, res) {
  const { expenseTypeID } = req.params;
  const { name, status } = req.body;

  EventExpenseType.find({ _id: expenseTypeID }).then((eventExpenseType) => {
    if (eventExpenseType.length === 1) {
      const query = { _id: eventExpenseType[0]._id };
      const newvalues = {
        $set: { name, status },
      };
      EventExpenseType.updateOne(query, newvalues, function (err, cb) {
        if (err) {
          if (err.name === "MongoError" && err.code === 11000) {
            // Duplicate name
            return res.status(500).send({
              success: false,
              message: "O tipo de despesa de evento já existe!",
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
