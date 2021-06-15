const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    event_type_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventsTypes",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventsCategories",
      required: true,
    },
    category_second_field_value: {
      type: String,
    },
    coverage_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventsCoverages",
      required: true,
    },
    coverage_second_field_value: {
      type: String,
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
      type: String,
      enum: {
        values: [0, 1],
        message: "Valor 'online' inválido",
      },
      required: true,
    },
    link: {
      type: String,
      required: function () {
        return this.online == 1;
      },
    },
    place: {
      type: String,
      required: true,
    },
    ticket: {
      type: String,
      required: true,
    },
    objective: {
      type: String,
      required: true,
    },
    reason: {
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
    receipt_amount: {
      type: Number,
      required: true,
    },
    total_amount: {
      type: Number,
      required: true,
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

const Event = mongoose.model("Event", EventSchema);

module.exports = Event;
