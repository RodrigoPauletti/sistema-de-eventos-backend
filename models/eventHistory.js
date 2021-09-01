const mongoose = require("mongoose");

const EventHistorySchema = new mongoose.Schema(
  {
    event_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    event_type_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventType",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
    },
    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventCategory",
      required: true,
    },
    category_second_field_value: {
      type: String,
    },
    coverage_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventCoverage",
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
      type: Boolean,
      required: true,
    },
    link: {
      type: String,
      required: function () {
        return this.online;
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
        values: [
          "created",
          "revision",
          "correct",
          "refused",
          "approved",
          "finished",
        ],
        message: "Status inválido",
      },
      required: true,
    },
  },
  {
    collection: "events_histories",
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

EventHistorySchema.virtual("dates", {
  ref: "EventDate",
  localField: "_id",
  foreignField: "event_id",
});
EventHistorySchema.virtual("lecturers", {
  ref: "EventLecturer",
  localField: "_id",
  foreignField: "event_id",
});
EventHistorySchema.virtual("organizers", {
  ref: "EventOrganizer",
  localField: "_id",
  foreignField: "event_id",
});
EventHistorySchema.virtual("expenses", {
  ref: "EventExpense",
  localField: "_id",
  foreignField: "event_id",
});

const EventHistory = mongoose.model("EventHistory", EventHistorySchema);

module.exports = EventHistory;
