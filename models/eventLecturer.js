const mongoose = require("mongoose");

const EventLecturerSchema = new mongoose.Schema(
  {
    event_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Events",
      required: true,
    },
    lecturer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecturers",
      required: true,
    },
    type: {
      type: String,
      enum: {
        values: ["lecturer", "guest"],
        message: "Status inválido",
      },
      required: true,
    },
  },
  {
    collection: "events_lecturers",
    timestamps: true,
  }
);

const EventLecturer = mongoose.model("EventLecturer", EventLecturerSchema);

module.exports = EventLecturer;