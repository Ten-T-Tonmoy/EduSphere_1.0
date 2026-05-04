const mongoose = require("mongoose");

const sharedMaterialSchema = new mongoose.Schema(
  {
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
      required: true,
    },
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", 
      default: null,
    },
    description: {
      type: String,
      required: true,
    },
    attachments: [
      {
        url: String,
        originalName: String,
        mimetype: String,
      },
    ],
    // NEW: Track who has seen the material
    viewedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.models.SharedMaterial || mongoose.model("SharedMaterial", sharedMaterialSchema);