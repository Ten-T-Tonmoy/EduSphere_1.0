const mongoose = require("mongoose");

const importantMaterialSchema = new mongoose.Schema(
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
    content: {
      type: String, // Rich Text HTML
      required: true,
    },
    attachments: [
      {
        url: String,
        originalName: String,
        mimetype: String,
      },
    ],
    viewedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.models.ImportantMaterial || mongoose.model("ImportantMaterial", importantMaterialSchema);