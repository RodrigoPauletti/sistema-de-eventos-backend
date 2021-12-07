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
      ref: "Organizer",
      required: true,
    },
    office: {
      type: String,
      required: true,
    },
    workload: {
      type: Number,
      required: true,
    },
    dates: {
      type: Array,
    },
  },
  {
    collection: "events_organizers",
    timestamps: true,
  }
);

const EventOrganizer = mongoose.model("EventOrganizer", EventOrganizerSchema);

module.exports = EventOrganizer;
