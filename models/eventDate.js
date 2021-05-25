const mongoose = require("mongoose");

const EventDateSchema = new mongoose.Schema(
  {
    event_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Events",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    start_time: {
      hours: { type: Number, required: true },
      minutes: { type: Number, required: true },
    },
    end_time: {
      hours: { type: Number, required: true },
      minutes: { type: Number, required: true },
    },
  },
  {
    collection: "events_dates",
    timestamps: true,
  }
);

const EventDate = mongoose.model("EventDate", EventDateSchema);

module.exports = EventDate;
