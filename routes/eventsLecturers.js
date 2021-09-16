const express = require("express");
const router = express.Router();
const EventLecturer = require("../models/eventLecturer");
const reqAuth = require("../config/safeRoutes").reqAuth;
// route /admin/eventsLecturers/

// router.post("/all", reqAuth, function (req, res) {
//   EventLecturer.find({}, function (err, eventsLecturers) {
//     if (err) {
//       return res.status(500).json({ success: false });
//     }
//     eventsLecturers = eventsLecturers.map(function (item) {
//       const x = item;
//       x.__v = undefined;
//       return x;
//     });
//     return res.json({ success: true, eventsLecturers });
//   });
// });

// router.post("/create", (req, res) => {
//   const { event_id, lecturer_id, type } = req.body;

//   const query = { event_id, lecturer_id, type };
//   EventLecturer.create(query, function (err, eventLecturer) {
//     if (err) {
//       if (err.name === "MongoError" && err.code === 11000) {
//         // TODO: Validate same lecturer twice or more in the same event
//         return res.status(500).send({
//           success: false,
//           message: "O palestrante do evento já existe!",
//         });
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
//       lecturerID: eventLecturer._id,
//       msg: "Palestrante do evento criado com sucesso",
//     });
//   });
// });

// // TODO: Create get route

// router.post("/edit/:lecturerID", reqAuth, function (req, res) {
//   const { lecturerID } = req.params;
//   const { event_id, lecturer_id, type } = req.body;

//   EventLecturer.find({ _id: lecturerID }).then((eventLecturer) => {
//     if (eventLecturer.length === 1) {
//       const query = { _id: eventLecturer[0]._id };
//       const newvalues = {
//         $set: { event_id, lecturer_id, type },
//       };
//       EventLecturer.updateOne(query, newvalues, function (err, cb) {
//         if (err) {
//           if (err.name === "MongoError" && err.code === 11000) {
//             // TODO: Validate same lecturer twice or more in the same event
//             return res.status(500).send({
//               success: false,
//               message: "O palestrante do evento já existe!",
//             });
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
