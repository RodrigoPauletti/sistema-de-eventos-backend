const express = require("express");
const router = express.Router();
const Event = require("../models/event");
const reqAuth = require("../config/safeRoutes").reqAuth;
const ActiveSession = require("../models/activeSession");
// route /admin/events/

router.post("/all", reqAuth, async function (req, res) {
  try {
    // const token = String(req.headers.authorization);
    // const session = await ActiveSession.find({ token: token });
    let filter = {};
    // if(user){ /* TODO: Se usuário não for Admin ou outro cargo, deve mostrar apenas eventos relacionados à eles */
    //   filter = { user_id: session[0].userId };
    // }
    return await Event.find(filter)
      .populate([
        {
          path: "dates",
          // select: "date start_time end_time",
          select: "start_date end_date",
          options: {
            sort: {
              start_date: 1,
              end_date: 1,
              // date: 1,
              // "start_time.hours": 1,
              // "start_time.minutes": -1,
              // "end_time.hours": 1,
              // "end_time.minutes": 1,
            },
          },
        },
        {
          path: "event_type_id",
          select: "name",
        },
        {
          path: "user_id",
          select: "name",
        },
      ])
      .exec((err, events) => {
        if (err) {
          return res.json({ success: false, msg: err });
        }
        events = events.map(function (item) {
          const x = item;
          x.__v = undefined;
          return x;
        });
        return res.json({ success: true, events });
      });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err });
  }
});

router.post("/create", (req, res) => {
  const {
    event_type_id,
    user_id,
    name,
    category_id,
    category_second_field_value,
    coverage_id,
    coverage_second_field_value,
    workload,
    audience_estimate,
    online,
    link,
    place,
    ticket,
    objective,
    reason,
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
    category_second_field_value,
    coverage_id,
    coverage_second_field_value,
    workload,
    audience_estimate,
    online,
    link,
    place,
    ticket,
    objective,
    reason,
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

    return res.json({
      success: true,
      eventID: event._id,
      msg: "Evento criado com sucesso",
    });
  });
});

router.post("/get/:eventID", reqAuth, function (req, res) {
  const { eventID } = req.params;

  Event.findOne({ _id: eventID }).then((event) => {
    if (event) {
      return res.json({ success: true, event });
    }
    return res.json({ success: false });
  });
});

router.post("/edit/:eventID", reqAuth, function (req, res) {
  const { eventID } = req.params;

  const {
    event_type_id,
    user_id,
    name,
    category_id,
    category_second_field_value,
    coverage_id,
    coverage_second_field_value,
    workload,
    audience_estimate,
    online,
    link,
    place,
    ticket,
    objective,
    reason,
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
          category_second_field_value,
          coverage_id,
          coverage_second_field_value,
          workload,
          audience_estimate,
          online,
          link,
          place,
          ticket,
          objective,
          reason,
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
          return res.json({
            success: false,
            msg: "Ocorreu um erro. Favor contatar o administrador",
          });
        }
        return res.json({ success: true });
      });
    } else {
      return res.json({ success: false });
    }
  });
});

// TODO: Create delete route

module.exports = router;
