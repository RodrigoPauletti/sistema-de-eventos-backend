const mongoose = require("mongoose");

const EventDateSchema = new mongoose.Schema(
  {
    event_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    start_date: {
      type: Date,
      required: true,
    },
    end_date: {
      type: Date,
      required: true,
    },
  },
  {
    collection: "events_dates",
    timestamps: true,
  }
);

const EventDate = mongoose.model("EventDate", EventDateSchema);

module.exports = EventDate;
