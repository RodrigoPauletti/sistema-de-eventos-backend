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
    workload: {
      type: Number,
      required: true,
    },
    audience_estimate: {
      type: Number,
      required: true,
      validate: {
        validator: Number.isInteger,
        message: "'{VALUE}' não é um valor inteiro",
      },
    },
    online: {
      type: Boolean,
      required: true,
    },
    link: {
      type: String,
      required: [
        function () {
          return this.online;
        },
        'O campo "Link" é obrigatório quando o evento é online',
      ],
    },
    place: {
      type: String,
      required: true,
    },
    ticket: {
      type: String,
      required: true,
    },
    schedule: {
      type: String,
    },
    details: {
      type: String,
      required: true,
    },
    resources: {
      type: String,
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
