const express = require("express");
const cors = require("cors");
const { createServer } = require("http");
const { Server } = require("socket.io");
const connectDB = require("./config/database.js");
require("dotenv").config();
const cookieParser = require("cookie-parser");

const matrixAttendanceRoutes = require("./routes/matrixAttendanceRoutes");

const app = express();
const httpServer = createServer(app);

// 1. Unified CORS and Socket Setup (Single Declaration)
const CLIENT_URL =
  process.env.ENVIRONMENT === "production"
    ? process.env.CLIENT_URL
    : "http://localhost:5173";

const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL,
    methods: ["GET", "POST"],
  },
});

// 2. Global instance for NotificationManager logic
global.io = io;

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("io", io);

// ------------------------- Routes ----------------------------
app.use("/api/auth", require("./routes/Auth.routes.js"));
app.use("/api/users", require("./routes/Users.routes.js"));
app.use("/api/schedules", require("./routes/Schedules.routes.js"));
app.use("/api/messages", require("./routes/Messages.routes.js"));
app.use("/api/tasks", require("./routes/Tasks.routes.js"));
app.use("/api/expenses", require("./routes/Expenses.routes2.js"));
app.use("/api/syllabus", require("./routes/Syllabus.routes.js"));
app.use("/api/calendar", require("./routes/Calendar.routes.js"));
app.use("/api/stats", require("./routes/stats.routes.js"));
app.use("/api/notes", require("./routes/noteRoutes.js"));
app.use("/api/notes", require("./routes/sharedNotesRoutes.js"));
app.use("/api/teachers", require("./routes/Users.routes.js"));
app.use("/api/groups", require("./routes/groupRoutes.js"));
app.use("/api/notices", require("./routes/noticeRoutes.js"));
app.use("/api/attendance", require("./routes/groupAttendanceRoutes.js"));
app.use(
  "/api/important-materials",
  require("./routes/importantMaterialRoutes.js"),
);
app.use(
  "/api/matrix-attendance",
  require("./routes/matrixAttendanceRoutes.js"),
);
app.use("/api/interactive-matrix", matrixAttendanceRoutes);
app.get("/api/health", (req, res) => res.status(200).json({ status: "ok" }));
app.use("/api/chat", require("./routes/chatRoutes.js"));
app.use("/api/contributors", require("./routes/Contributor.routes"));

app.use(
  "/api/notifications",
  require("../notifications/routes/notification.routes"),
);

// --------------------------- Socket.io -------------------------------
io.on("connection", (socket) => {
  // Notification Channel
  socket.on("join_user_channel", (userId) => {
    socket.join(userId.toString());
  });

  socket.on("join_group", (groupId) => {
    socket.join(`group_${groupId}`);
  });

  socket.on("join_chat_room", (roomId) => socket.join(roomId));
  socket.on("leave_chat_room", (roomId) => socket.leave(roomId));

  socket.on("send_message", (data) => {
    const target = data.groupId ? `group_${data.groupId}` : data.roomId;
    io.to(target).emit("receive_message", data);
  });

  socket.on("disconnect", () => {});
});

const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Group system active. Notifications linked to Socket.io.`);
    });
  } catch (e) {
    console.error("Failed to start server:", e);
    process.exit(1);
  }
};

startServer();
