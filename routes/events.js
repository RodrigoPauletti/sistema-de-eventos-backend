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
    return Event.find(filter)
      .populate([
        {
          path: "dates",
          select: "start_date end_date",
          options: {
            sort: {
              start_date: 1,
              end_date: 1,
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
          const x = item.toJSON();
          x.__v = undefined;
          x.date = "";
          if (item.dates && item.dates.length) {
            if (item.dates.length === 1) {
              // Event has just one date
              const startDate = toDateFormatted(item.dates[0].start_date);
              const endDate = toDateFormatted(item.dates[0].end_date);
              if (
                endDateIsBiggerAndAnotherDayFromStartDate(startDate, endDate)
              ) {
                // If end_date is bigger then and another day of start_date
                x.date = `${startDate} até ${endDate}`;
              } else {
                x.date = startDate;
              }
            } else {
              // Event has more than one date
              const startDate = toDateFormatted(
                findMinStartDateOnObject(item.dates).start_date
              );
              const endDate = toDateFormatted(
                findMaxEndDateOnObject(item.dates).end_date
              );
              if (
                endDateIsBiggerAndAnotherDayFromStartDate(startDate, endDate)
              ) {
                // If end_date is bigger then and another day of start_date
                x.date = `${startDate} até ${endDate}`;
              } else {
                x.date = startDate;
              }
            }
          }
          x.dates = undefined;
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

  try {
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
  } catch (err) {
    return res.status(500).json({ success: false, msg: err });
  }
});

router.post("/get/:eventID", reqAuth, function (req, res) {
  const { eventID } = req.params;

  try {
    return Event.findOne({ _id: eventID })
      .populate([{ path: "dates", select: "start_date end_date" }])
      .then((event) => {
        if (event) {
          if (event.dates && event.dates.length) {
            event.dates = event.dates.map(function (date) {
              const x = date.toJSON();
              x.date = toDateFormatted(date.start_date, true);
              x.start = transformDateToTime(date.start_date);
              x.end = transformDateToTime(date.end_date);
              x.start_date = undefined;
              x.end_date = undefined;
              return x;
            });
            return res.json({ success: true, event });
          }
          return res.json({ success: true, event });
        }
        return res.json({ success: false });
      });
  } catch (err) {
    return res.status(500).json({ success: false, msg: err });
  }
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

  try {
    Event.find({ _id: eventID }).then((event) => {
      if (event.length === 1) {
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
  } catch (err) {
    return res.status(500).json({ success: false, msg: err });
  }
});

// TODO: Create delete route

module.exports = router;

function toDateFormatted(dateToFormat, ymdFormat = false) {
  const date = new Date(dateToFormat).toISOString().replace(/T(\S+)$/, ""); // Replacing the 'T00:00:00.000Z' part of the date
  const dateSplitted = date.split("-");
  if (ymdFormat) {
    return date;
  }
  return `${dateSplitted[2]}/${dateSplitted[1]}/${dateSplitted[0]}`;
}

function transformDateToTime(dateToTransform) {
  const date = new Date(dateToTransform);
  const hours =
    date.getUTCHours() < 10 ? `0${date.getUTCHours()}` : date.getUTCHours();
  const minutes =
    date.getUTCMinutes() < 10
      ? `0${date.getUTCMinutes()}`
      : date.getUTCMinutes();
  return `${hours}:${minutes}`;
}

function findMinStartDateOnObject(object) {
  return object.reduce(function (a, b) {
    return new Date(a.start_date).getTime() < new Date(b.start_date).getTime()
      ? a
      : b;
  });
}

function findMaxEndDateOnObject(object) {
  return object.reduce(function (a, b) {
    return new Date(a.end_date).getTime() > new Date(b.end_date).getTime()
      ? a
      : b;
  });
}

function endDateIsBiggerAndAnotherDayFromStartDate(startDate, endDate) {
  return (
    new Date(endDate).getTime() > new Date(startDate).getTime() &&
    new Date(endDate).getDay() !== new Date(startDate).getDay()
  );
}
