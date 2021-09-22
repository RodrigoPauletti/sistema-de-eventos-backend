const express = require("express");
const router = express.Router();
const reqAuth = require("../config/safeRoutes").reqAuth;
const multer = require("multer");
const multerConfig = require("../config/multer");
const upload = multer(multerConfig);

router.post("/", reqAuth, upload.array("files"), function (req, res) {
  console.log("req", req);
  console.log("res", res);
});

module.exports = router;
