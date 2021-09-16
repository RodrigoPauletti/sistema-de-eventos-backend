const express = require("express");
const router = express.Router();
const EventDate = require("../models/eventDate");
const reqAuth = require("../config/safeRoutes").reqAuth;
// route /admin/eventsDates/

// router.post("/all", reqAuth, function (req, res) {
//   EventDate.find({}, function (err, eventsDates) {
//     if (err) {
//       return res.status(500).json({ success: false });
//     }
//     eventsDates = eventsDates.map(function (item) {
//       const x = item;
//       x.__v = undefined;
//       return x;
//     });
//     return res.json({ success: true, eventsDates });
//   });
// });

// router.post("/create", (req, res) => {
//   const { event_id, start_date, end_date, status } = req.body;

//   const query = { event_id, start_date, end_date, status };
//   EventDate.create(query, function (err, eventDate) {
//     if (err) {
//       if (err.name === "MongoError" && err.code === 11000) {
//         // Duplicate name
//         return res
//           .status(500)
//           .send({ success: false, message: "A data do evento já existe!" });
//       }

//       const firstErrorKey = Object.keys(err.errors).shift();
//       if (firstErrorKey) {
//         return res.status(500).json({
//           success: false,
//           msg: err.errors[firstErrorKey].message,
//         });
//       }

//       return res.status(500).send(err);
//     }

//     return res.json({
//       success: true,
//       eventDateID: eventDate._id,
//       msg: "Data do evento criada com sucesso",
//     });
//   });
// });

// router.post("/get/:eventID", reqAuth, function (req, res) {
//   const { eventID } = req.params;

//   EventDate.findOne({ event_id: eventID }).then((eventDate) => {
//     if (eventDate) {
//       return res.json({ success: true, eventDate });
//     } else {
//       return res.status(500).json({ success: false });
//     }
//   });
// });

// router.post("/edit/:eventDateID", reqAuth, function (req, res) {
//   const { eventDateID } = req.params;
//   const { event_id, start_date, end_date, status } = req.body;

//   EventDate.find({ _id: eventDateID }).then((eventDate) => {
//     if (eventDate.length === 1) {
//       const query = { _id: eventDate[0]._id };
//       const newvalues = {
//         $set: { event_id, start_date, end_date, status },
//       };
//       EventDate.updateOne(query, newvalues, function (err, cb) {
//         if (err) {
//           if (err.name === "MongoError" && err.code === 11000) {
//             // Duplicate name
//             return res
//               .status(500)
//               .send({ success: false, message: "A data do evento já existe!" });
//           }

//           return res.status(500).json({
//             success: false,
//             msg: "Ocorreu um erro. Favor contatar o administrador",
//           });
//         }
//         return res.json({ success: true });
//       });
//     } else {
//       return res.status(500).json({ success: false });
//     }
//   });
// });

// TODO: Create delete route

module.exports = router;
