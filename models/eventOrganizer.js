const mongoose = require("mongoose");

const EventOrganizerSchema = new mongoose.Schema(
  {
    event_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    organizer_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organizers",
      required: true,
    },
    workload: {
      type: Number,
      required: true,
    },
  },
  {
    collection: "events_organizers",
    timestamps: true,
  }
);

const EventOrganizer = mongoose.model("EventOrganizer", EventOrganizerSchema);

module.exports = EventOrganizer;
