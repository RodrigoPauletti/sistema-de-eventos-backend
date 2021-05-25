const mongoose = require("mongoose");

const LecturerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
      unique: true,
      trim: true,
      validate: {
        validator: function (v) {
          if (v && v.length) var re = /^[a-z]$/i;
          return re.test(v);
        },
        message: "O nome já está sendo utilizado",
      },
    },
    office: {
      type: String,
    },
    lattes: {
      type: String,
    },
    status: {
      type: String,
      enum: {
        values: [0, 1],
        message: "Status inválido",
      },
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const Lecturer = mongoose.model("Lecturer", LecturerSchema);

module.exports = Lecturer;
