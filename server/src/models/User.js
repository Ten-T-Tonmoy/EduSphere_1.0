const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "class_rep", "teacher", "admin"],
      default: "student",
    },
    avatar: { type: String, default: "" },
    department: { type: String, default: "" },
    studentId: { type: String, default: "" },
    employeeId: { type: String, default: "" },
    year: { type: Number },
    semester: { type: Number },
    classrooms: [{ type: mongoose.Schema.Types.ObjectId, ref: "Classroom" }],
    isActive: { type: Boolean, default: true },
    isVerified: {
      type: Boolean,
      default: false
        },
          verificationToken: String,


    // NEW: Persisted Settings for the Notification Manager
    appSettings: {
      alarmEnabled: { type: Boolean, default: true },
      muteEnabled: { type: Boolean, default: true },
      muteMode: { type: String, enum: ['silent', 'vibrate_simulated'], default: 'silent' }
    },

    groups: [{
    group: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Group'
    },
    role: {
      type: String,
      enum: ['student', 'teacher', 'cr', 'admin'],
      default: 'student'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  },
  { timestamps: true },
  
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};





module.exports = mongoose.model("User", userSchema);
