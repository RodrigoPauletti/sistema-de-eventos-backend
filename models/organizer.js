const mongoose = require("mongoose");

const OrganizerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
      unique: true,
      trim: true,
      // TODO: Validate unique name
      // validate: {
      //   validator: function (v) {
      //     if (v && v.length) var re = /^[a-z]$/i;
      //     return re.test(v);
      //   },
      //   message: "O nome do organizador já está sendo utilizado",
      // },
    },
    identification: {
      type: String,
      required: true,
    },
    // office: {
    //   type: String,
    //   required: true,
    // },
    email: {
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

const Organizer = mongoose.model("Organizer", OrganizerSchema);

module.exports = Organizer;
