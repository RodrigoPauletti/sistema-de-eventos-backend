const mongoose = require("mongoose");

const UserTypeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true
    },
    permission: {
      type: String,
      enum: {
        values: [1, 2, 3, 4],
        message: 'Permissão inválida'
      },
      required: true
    },
    status: {
      type: String,
      enum: {
        values: [0, 1],
        message: 'Status inválido'
      },
      required: true,
      default: 1
    },
  },
  {
    collection: "users_types",
    timestamps: true,
  }
);

const UserType = mongoose.model("UserType", UserTypeSchema);

module.exports = UserType;
