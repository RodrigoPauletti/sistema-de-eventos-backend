/* eslint-disable max-len */
/* !

=========================================================
* Argon React NodeJS - v1.0.0
=========================================================

* Product Page: https://argon-dashboard-react-nodejs.creative-tim.com/
* Copyright 2020 Creative Tim (https://https://www.creative-tim.com//)
* Copyright 2020 ProjectData (https://projectdata.dev/)
* Licensed under MIT (https://github.com/creativetimofficial/argon-dashboard-react-nodejs/blob/main/README.md)

* Coded by Creative Tim & ProjectData

=========================================================

* The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

*/
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt-nodejs");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const config = require("../config/keys");
const User = require("../models/user");
const ActiveSession = require("../models/activeSession");
const reqAuth = require("../config/safeRoutes").reqAuth;
const { smtpConf } = require("../config/config");
// route /admin/users/

router.post("/all", reqAuth, async function (req, res) {
  try {
    let users = await User.find()
      .populate("user_type_id", "name")
      .select("name email");
    users = users.map(function (item) {
      const x = item;
      x.password = undefined;
      x.__v = undefined;
      return x;
    });
    return res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, msg: err });
  }
});

router.post("/edit", reqAuth, function (req, res) {
  const { userID, name, email } = req.body;

  User.find({ _id: userID }).then((user) => {
    if (user.length == 1) {
      const query = { _id: user[0]._id };
      const newvalues = { $set: { name, email } };
      User.updateOne(query, newvalues, function (err, cb) {
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

router.post("/check/resetpass/:id", (req, res) => {
  const userID = req.params.id;
  User.find({ _id: userID }).then((user) => {
    if (user.length == 1 && user[0].resetPass == true) {
      return res.json({ success: true }); // reset password was made for this user
    } else {
      return res.json({ success: false });
    }
  });
});

router.post("/resetpass/:id", (req, res) => {
  const errors = [];
  const userID = req.params.id;

  let { password } = req.body;

  if (password.length < 6) {
    errors.push({ msg: "A senha deve conter, no mínimo, 6 caracteres" });
  }
  if (errors.length > 0) {
    return res.json({ success: false, msg: errors });
  } else {
    const query = { _id: userID };
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, null, (err, hash) => {
        if (err) throw err;
        password = hash;
        const newvalues = { $set: { resetPass: false, password: password } };
        User.updateOne(query, newvalues, function (err, usr) {
          if (err) {
            return res.json({ success: false, msg: err });
          }
          return res.json({ success: true });
        });
      });
    });
  }
});

router.post("/forgotpassword", (req, res) => {
  const { email } = req.body;
  const errors = [];

  if (!email) {
    errors.push({ msg: "Preencha todos os campos" });
  }
  User.find({ email }).then((user) => {
    if (user.length != 1) {
      errors.push({ msg: "E-mail não existe" });
    }
    if (errors.length > 0) {
      return res.json({ success: false, errors: errors });
    } else {
      // create reusable transporter object using the default SMTP transport
      const transporter = nodemailer.createTransport(smtpConf);

      const query = { _id: user[0]._id };
      const newvalues = { $set: { resetPass: true } };
      User.updateOne(query, newvalues, function (err, usr) {});

      // don't send emails if it is in demo mode
      if (process.env.DEMO != "yes") {
        // send mail with defined transport object
        transporter.sendMail({
          from: '"Creative Tim" <' + smtpConf.auth.user + ">", // sender address
          to: email, // list of receivers
          subject: "Creative Tim Reset Password", // Subject line
          html:
            '<h1>Hey,</h1><br><p>If you want to reset your password, please click on the following link:</p><p><a href="' +
            "http://localhost:3000/auth/confirm-password/" +
            user._id +
            '">"' +
            "http://localhost:3000/auth/confirm-email/" +
            user._id +
            +'"</a><br><br>If you did not ask for it, please let us know immediately at <a href="mailto:' +
            smtpConf.auth.user +
            '">' +
            smtpConf.auth.user +
            "</a></p>", // html body
        });
        return res.json({ success: true });
      }
      return res.json({ success: true, userID: user[0]._id });
    }
  });
});

router.post("/register", (req, res) => {
  const { name, email, password } = req.body;

  User.findOne({ email }).then((user) => {
    if (user) {
      return res.json({ success: false, msg: "E-mail já existente" });
    } else if (password.length < 6) {
      return res.json({
        success: false,
        msg: "A senha deve conter, no mínimo, 6 caracteres",
      });
    } else {
      bcrypt.genSalt(10, (err, salt) => {
        bcrypt.hash(password, salt, null, (err, hash) => {
          if (err) throw err;
          const query = { name, email, password: hash };
          User.create(query, function (err, user) {
            if (err) throw err;

            const transporter = nodemailer.createTransport(smtpConf);

            // don't send emails if it is in demo mode
            if (process.env.DEMO != "yes") {
              // send mail with defined transport object
              transporter.sendMail({
                from: '"Creative Tim" <' + smtpConf.auth.user + ">",
                to: email, // list of receivers
                subject: "Creative Tim Confirm Account", // Subject line
                html:
                  '<h1>Hey,</h1><br><p>Confirm your new account </p><p><a href="' +
                  "http://localhost:3000/auth/confirm-email/" +
                  user._id +
                  '">"' +
                  "http://localhost:3000/auth/confirm-email/" +
                  user._id +
                  '"</a><br><br>If you did not ask for it, please let us know immediately at <a href="mailto:' +
                  smtpConf.auth.user +
                  '">' +
                  smtpConf.auth.user +
                  "</a></p>", // html body
              });
              return res.json({
                success: true,
                msg: "Usuário criado com sucesso",
              });
            }
            return res.json({
              success: true,
              userID: user._id,
              msg: "Usuário criado com sucesso",
            });
          });
        });
      });
    }
  });
});

router.post("/confirm/:id", (req, res) => {
  const userID = req.params.id;

  const query = { _id: userID };

  const newvalues = { $set: { accountConfirmation: true } };
  User.updateOne(query, newvalues, function (err, usr) {
    if (err) {
      return res.json({ success: false });
    }
    return res.json({ success: true });
  });
});

router.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  User.findOne({ email }, (err, user) => {
    if (err) throw err;

    if (!user) {
      return res.json({ success: false, msg: "Credenciais incorretas" });
    }

    if (!user.accountConfirmation) {
      return res.json({ success: false, msg: "Usuário não confirmado" });
    }

    bcrypt.compare(password, user.password, function (err, isMatch) {
      if (isMatch) {
        const token = jwt.sign(user, config.secret, {
          expiresIn: 86400, // 1 week
        });
        // Don't include the password in the returned user object
        const query = { userId: user._id, token: "JWT " + token };
        ActiveSession.create(query, function (err, cd) {
          user.password = null;
          user.__v = null;
          return res.json({
            success: true,
            token: "JWT " + token,
            user,
          });
        });
      } else {
        return res.json({ success: false, msg: "Credenciais incorretas" });
      }
    });
  });
});

router.post("/checkSession", reqAuth, function (req, res) {
  return res.json({ success: true });
});

router.post("/logout", reqAuth, function (req, res) {
  const token = req.body.token;
  ActiveSession.deleteMany({ token }, function (err, item) {
    if (err) {
      return res.json({ success: false });
    }
    return res.json({ success: true });
  });
});

module.exports = router;
