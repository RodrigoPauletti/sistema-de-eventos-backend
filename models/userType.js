/* eslint-disable max-len */
const mongoose = require("mongoose");

const UserTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    permission: {
      type: Number,
      enum: [1, 2, 3, 4],
      required: true,
    },
    status: {
      type: Number,
      enum: [0, 1],
      required: true,
    },
  },
  {
    collection: "users_types",
    timestamps: true,
  }
);

const UserType = mongoose.model("UserType", UserTypeSchema);

module.exports = UserType;
