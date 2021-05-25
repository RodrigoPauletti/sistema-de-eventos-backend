const express = require("express");
const router = express.Router();
const Lecturer = require("../models/lecturer");
const reqAuth = require("../config/safeRoutes").reqAuth;
// route /admin/lecturers/

router.post("/all", reqAuth, function (req, res) {
  Lecturer.find({}, function (err, lecturers) {
    if (err) {
      res.json({ success: false });
    }
    lecturers = lecturers.map(function (item) {
      const x = item;
      x.__v = undefined;
      return x;
    });
    res.json({ success: true, lecturers: lecturers });
  });
});

router.post("/create", (req, res) => {
  const { name, office, lattes, status } = req.body;

  const query = { name, office, lattes, status };
  Lecturer.create(query, function (err, lecturer) {
    if (err) {
      if (err.name === "MongoError" && err.code === 11000) {
        // Duplicate username
        return res
          .status(422)
          .send({ success: false, message: "Palestrante já existe!" });
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
      lecturerID: lecturer._id,
      msg: "Palestrante criado com sucesso",
    });
  });
});

router.post("/edit", reqAuth, function (req, res) {
  const { lecturerID, name, office, lattes, status } = req.body;

  Lecturer.find({ _id: lecturerID }).then((lecturer) => {
    if (lecturer.length == 1) {
      const query = { _id: lecturer[0]._id };
      const newvalues = {
        $set: { name, office, lattes, status },
      };
      Lecturer.updateOne(query, newvalues, function (err, cb) {
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
