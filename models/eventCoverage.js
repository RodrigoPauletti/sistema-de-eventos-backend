const mongoose = require("mongoose");

const EventCoverageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    secondary_field: {
      type: String,
      enum: {
        values: [0, 1],
        message: 'Status do segundo campo inválido'
      },
      required: true,
    },
    secondary_field_name: {
      type: String,
      required: function(){
        return this.secondary_field === 1;
      }
    },
    status: {
      type: String,
      enum: {
        values: [0, 1],
        message: 'Status inválido'
      },
      required: true,
    },
  },
  {
    collection: "events_coverages",
    timestamps: true,
  }
);

const EventCoverage = mongoose.model("EventCoverage", EventCoverageSchema);

module.exports = EventCoverage;
