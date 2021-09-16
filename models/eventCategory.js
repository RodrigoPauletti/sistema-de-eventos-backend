const mongoose = require("mongoose");

const EventCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      index: true,
      unique: true,
      trim: true,
    },
    secondary_field: {
      type: String,
      enum: {
        values: [0, 1],
        message: "Status do segundo campo inválido",
      },
      required: true,
    },
    secondary_field_name: {
      type: String,
      required: [
        function () {
          return this.secondary_field === "1";
        },
        '"Nome do segundo campo" é obrigatório quando "Segundo campo" é 1',
      ],
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
    collection: "events_categories",
    timestamps: true,
  }
);

const EventCategory = mongoose.model("EventCategory", EventCategorySchema);

module.exports = EventCategory;
