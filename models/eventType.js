const mongoose = require("mongoose");

const EventTypeSchema = new mongoose.Schema(
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
    collection: "events_types",
    timestamps: true,
  }
);

const EventType = mongoose.model("EventType", EventTypeSchema);

module.exports = EventType;
