const mongoose = require("mongoose");

const EventExpenseSchema = new mongoose.Schema(
  {
    event_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Events",
      required: true,
    },
    event_expense_type_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "EventsExpensesTypes",
      required: true,
    },
    provider: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    comments: {
      type: String,
    },
  },
  {
    collection: "events_expenses",
    timestamps: true,
  }
);

const EventExpense = mongoose.model("EventExpense", EventExpenseSchema);

module.exports = EventExpense;
