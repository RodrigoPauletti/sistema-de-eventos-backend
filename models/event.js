const mongoose = require("mongoose");

const EventSchema = new mongoose.Schema(
  {
    event_type_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventType",
      required: true,
    },
    history: {
      type: Boolean,
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
      required: 'O campo "Modalidade" é obrigatório',
    },
    category_second_field_value: {
      type: String,
    },
    coverage_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventCoverage",
      required: 'O campo "Abrangência" é obrigatório',
    },
    coverage_second_field_value: {
      type: String,
    },
    // workload: {
    //   type: Number,
    //   required: true,
    // },
    // audience_estimate: {
    //   type: Number,
    //   required: true,
    //   validate: {
    //     validator: Number.isInteger,
    //     message: "'{VALUE}' não é um valor inteiro",
    //   },
    // },
    // online: {
    //   type: Boolean,
    //   required: true,
    // },
    // link: {
    //   type: String,
    //   required: [
    //     function () {
    //       return this.online;
    //     },
    //     'O campo "Link" é obrigatório quando o evento é online',
    //   ],
    // },
    // place: {
    //   type: String,
    //   required: true,
    // },
    // ticket: {
    //   type: String,
    //   required: true,
    // },
    objective: {
      type: String,
      required: 'O campo "Objetivo" é obrigatório',
    },
    reason: {
      type: String,
      required: 'O campo "Justificativa" é obrigatório',
    },
    // schedule: {
    //   type: String,
    // },
    // details: {
    //   type: String,
    //   required: true,
    // },
    // resources: {
    //   type: String,
    //   required: true,
    // },
    receipt_amount: {
      type: Number,
      // required: true,
    },
    total_amount: {
      type: Number,
      // required: true,
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
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  }
);

EventSchema.virtual("dates", {
  ref: "EventDate",
  localField: "_id",
  foreignField: "event_id",
});
EventSchema.virtual("lecturers", {
  ref: "EventLecturer",
  localField: "_id",
  foreignField: "event_id",
});
EventSchema.virtual("organizers", {
  ref: "EventOrganizer",
  localField: "_id",
  foreignField: "event_id",
});
EventSchema.virtual("expenses", {
  ref: "EventExpense",
  localField: "_id",
  foreignField: "event_id",
});

const Event = mongoose.model("Event", EventSchema);

module.exports = Event;
