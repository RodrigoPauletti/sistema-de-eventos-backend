const express = require("express");
const router = express.Router();
const Lecturer = require("../models/lecturer");
const reqAuth = require("../config/safeRoutes").reqAuth;
// route /admin/lecturers/

router.post("/all", reqAuth, function (req, res) {
  Lecturer.find({}, function (err, lecturers) {
    if (err) {
      return res.status(500).json({ success: false });
    }
    lecturers = lecturers.map(function (item) {
      const x = item;
      x.__v = undefined;
      return x;
    });
    return res.json(lecturers);
  });
});

router.post("/allActivated", reqAuth, function (req, res) {
  Lecturer.find({ status: "1" }, function (err, lecturers) {
    if (err) {
      return res.status(500).json({ success: false });
    }
    return res.json(lecturers);
  });
});

router.post("/create", (req, res) => {
  const { name, office, lattes, status } = req.body;

  const query = { name, office, lattes, status };
  Lecturer.create(query, function (err, lecturer) {
    if (err) {
      if (err.name === "MongoError" && err.code === 11000) {
        // Duplicate name
        return res
          .status(500)
          .send({ success: false, message: "O palestrante já existe!" });
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
      lecturerID: lecturer._id,
      msg: "Palestrante criado com sucesso",
    });
  });
});

// TODO: Create get route

router.post("/edit/:lecturerID", reqAuth, function (req, res) {
  const { lecturerID } = req.params;
  const { name, office, lattes, status } = req.body;

  Lecturer.find({ _id: lecturerID }).then((lecturer) => {
    if (lecturer.length === 1) {
      const query = { _id: lecturer[0]._id };
      const newvalues = {
        $set: { name, office, lattes, status },
      };
      Lecturer.updateOne(query, newvalues, function (err, cb) {
        if (err) {
          if (err.name === "MongoError" && err.code === 11000) {
            // Duplicate name
            return res.status(500).send({
              success: false,
              message: "O palestrante já existe!",
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
