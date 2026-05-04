const ClassSlot = require("../models/Classslot");
const ExtraClassRequest = require("../models/ExtraClassRequest");
const SlotOverride = require("../models/SlotOverride");
const User = require("../models/User");
const Group = require("../models/Group"); 
const Course = require("../models/Course"); // Required for strict teacher lookup

// -------------------- Helper Functions --------------------

const emitScheduleUpdate = (req) => {
  const io = req.app.get('io');
  if (io) io.emit('schedule-updated'); 
};

const attachOverrides = async (slots, dateStr, extraRequestFilter = {}) => {
  const targetDate = dateStr ? new Date(dateStr) : new Date();
  targetDate.setHours(12, 0, 0, 0); 

  const startOfWeek = new Date(targetDate);
  startOfWeek.setDate(targetDate.getDate() - targetDate.getDay());
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const slotIds = slots.map((s) => s._id);

  const overrides = await SlotOverride.find({
    classSlot: { $in: slotIds },
    date: { $gte: startOfWeek, $lte: endOfWeek },
  })
    .populate("extraTeacher", "name")
    .populate("extraCourse", "name code")
    .populate({ path: "extraClassRequest", populate: { path: "course", populate: { path: "teacher", select: "name email" } } });

  const overrideMap = {};
  overrides.forEach((o) => { overrideMap[o.classSlot.toString()] = o; });

  // FIX: Fetch BOTH approved AND pending requests so the UI knows to lock the cell
  const allExtraRequests = await ExtraClassRequest.find({
    requestedDate: { $gte: startOfWeek, $lte: endOfWeek },
    $or: [{ status: "approved" }, { status: "pending" }],
    ...extraRequestFilter
  })
    .populate("requestedBy", "name role")
    .populate("targetGroup", "name description")
    .populate({ path: "course", select: "name code", populate: { path: "teacher", select: "name email" } }); 

  const extraReqMap = {};
  allExtraRequests.forEach(req => {
    if (req.emptySlot) {
      extraReqMap[req.emptySlot.toString()] = req;
    }
  });

  const merged = slots.map((slot) => {
    const s = slot.toObject ? slot.toObject() : { ...slot };
    const override = overrideMap[s._id.toString()];
    const pendingReq = extraReqMap[s._id.toString()];

    if (override) {
      s._override = override;
      s.status = override.type === "cancellation" ? "cancelled" : "extra";
      if (override.cancellationReason) s.cancellationReason = override.cancellationReason;
      
      if (override.type === "extra") {
         if (override.extraCourse) s.course = override.extraCourse;
         if (override.extraTeacher) s.teacher = override.extraTeacher;
         if (override.extraClassRequest?.course?.teacher) {
             s.teacher = override.extraClassRequest.course.teacher;
         }
      }
    }

    // FIX: If there is a pending request for a cancelled slot, override UI state to pending
    if (s.status === "cancelled" && pendingReq && pendingReq.status === "pending") {
       s.status = "pending";
       s.course = pendingReq.course;
       s.teacher = pendingReq.course?.teacher || pendingReq.requestedBy;
    }

    return s;
  });

  const extraSlots = allExtraRequests
    .filter(req => !req.emptySlot)
    .map((req) => ({
      _id: req._id,
      status: req.status === "pending" ? "pending" : "extra",
      isLab: false,
      group: req.targetGroup,
      classroom: req.targetGroup, 
      course: req.course,
      teacher: req.course?.teacher || req.requestedBy, 
      dayOfWeek: req.dayOfWeek,
      startTime: req.startTime,
      endTime: req.endTime || "17:00",
      room: "",
      _fromEmptyRequest: true,
    }));

  return [...merged, ...extraSlots];
};

// -------------------- GET Controllers --------------------

exports.getClassroomSchedule = async (req, res) => {
  try {
    let slots = await ClassSlot.find({ group: req.params.classroomId })
      .populate("teacher", "name email").populate("teachers", "name email")
      .populate("course", "name code").populate("group", "name description")
      .sort({ dayOfWeek: 1, startTime: 1 });
    slots = await attachOverrides(slots, req.query.date, { targetGroup: req.params.classroomId });
    res.json(slots);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getTeacherSchedule = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const groupIds = user.groups.map(g => g.group);

    // Deep Fix: Also find courses taught by the teacher to catch extra requests outside their direct group membership
    const teacherCourses = await Course.find({ teacher: req.user._id });
    const teacherCourseIds = teacherCourses.map(c => c._id);

    let slots = await ClassSlot.find({
      $or: [{ teacher: req.user._id }, { teachers: req.user._id }],
    }).populate("teacher", "name email").populate("teachers", "name email")
      .populate("course", "name code").populate("group", "name description")
      .sort({ dayOfWeek: 1, startTime: 1 });

    slots = await attachOverrides(slots, req.query.date, { 
      $or: [
        { targetGroup: { $in: groupIds } },
        { course: { $in: teacherCourseIds } },
        { requestedBy: req.user._id }
      ] 
    });
    res.json(slots);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getStudentSchedule = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const groupIds = user.groups.map(g => g.group);
    let slots = await ClassSlot.find({ group: { $in: groupIds } })
      .populate("teacher", "name email").populate("teachers", "name email")
      .populate("course", "name code").populate("group", "name description")
      .sort({ dayOfWeek: 1, startTime: 1 });
    slots = await attachOverrides(slots, req.query.date, { targetGroup: { $in: groupIds } });
    res.json(slots);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getDepartmentSchedule = async (req, res) => {
  try {
    const dept = decodeURIComponent(req.params.department);
    const groups = await Group.find({ name: { $regex: dept, $options: "i" } });
    const groupIds = groups.map((g) => g._id);
    let slots = await ClassSlot.find({ group: { $in: groupIds } })
      .populate("teacher", "name").populate("teachers", "name")
      .populate("course", "name code").populate("group", "name description")
      .sort({ dayOfWeek: 1, startTime: 1 });
    slots = await attachOverrides(slots, req.query.date, { targetGroup: { $in: groupIds } });
    res.json({ slots, classrooms: groups });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getEmptySlots = async (req, res) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    date.setHours(12, 0, 0, 0);
    const start = new Date(date); start.setHours(0, 0, 0, 0);
    const end = new Date(date); end.setHours(23, 59, 59, 999);
    const overrides = await SlotOverride.find({
      type: "cancellation", date: { $gte: start, $lte: end },
    }).populate({ path: "classSlot", populate: [{ path: "teacher", select: "name" }, { path: "course", select: "name code" }, { path: "group", select: "name description" }] });
    res.json(overrides.map((o) => o.classSlot));
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getExtraClassRequests = async (req, res) => {
  try {
    let filter = {};
    if (["class_rep", "teacher", "admin"].includes(req.user.role)) {
      const user = await User.findById(req.user._id);
      const groupIds = user.groups.map(g => g.group);
      filter.targetGroup = { $in: groupIds };
    } else { filter.requestedBy = req.user._id; }
    if (req.query.status) filter.status = req.query.status;
    const requests = await ExtraClassRequest.find(filter)
      .populate("requestedBy", "name role").populate("targetGroup", "name")
      .populate("emptySlot").populate("course", "name code").populate("reviewedBy", "name")
      .sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getClassroomExtraRequests = async (req, res) => {
  try {
    const requests = await ExtraClassRequest.find({ targetGroup: req.params.classroomId })
      .populate("requestedBy", "name role").populate("emptySlot")
      .populate("course", "name code").populate("reviewedBy", "name").sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// -------------------- STRICT POST Controllers --------------------

exports.createSlot = async (req, res) => {
  try {
    if (req.user.role === 'teacher') {
      if (!req.body.isLab) { req.body.teacher = req.user._id; } 
      else { if (!req.body.teachers.includes(req.user._id.toString())) req.body.teachers.push(req.user._id); }
    }
    const existing = await ClassSlot.findOne({
      group: req.body.group, dayOfWeek: req.body.dayOfWeek, startTime: req.body.startTime,
    });
    if (existing) return res.status(400).json({ message: "A class already exists in this slot for this group." });

    const slot = await ClassSlot.create(req.body);
    await slot.populate([{ path: "teacher", select: "name email" }, { path: "teachers", select: "name email" }, { path: "course", select: "name code" }, { path: "group", select: "name description" }]);
    emitScheduleUpdate(req); 
    res.status(201).json(slot);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.cancelSlot = async (req, res) => {
  try {
    const { reason, date } = req.body;
    const userId = req.user._id.toString();
    const isCR = ['class_rep', 'admin'].includes(req.user.role);
    
    const extraReq = await ExtraClassRequest.findById(req.params.id).populate('course');
    if (extraReq && !extraReq.emptySlot) {
       const isOwner = extraReq.course?.teacher?.toString() === userId || extraReq.requestedBy.toString() === userId;
       if (!isOwner && !isCR) return res.status(403).json({ message: "Unauthorized." });
       await ExtraClassRequest.findByIdAndDelete(req.params.id);
       emitScheduleUpdate(req);
       return res.json({ message: "Extra class successfully deleted." });
    }

    const slot = await ClassSlot.findById(req.params.id);
    if (!slot) return res.status(404).json({ message: "Slot not found" });

    const isOwner = slot.teacher?.toString() === userId || slot.teachers?.some(t => t.toString() === userId);
    if (!isOwner && !isCR) return res.status(403).json({ message: "Unauthorized." });

    const targetDate = date ? new Date(date) : new Date();
    targetDate.setHours(12, 0, 0, 0);

    const override = await SlotOverride.findOneAndUpdate(
      { classSlot: slot._id, date: targetDate },
      { classSlot: slot._id, group: slot.group, date: targetDate, type: "cancellation", cancellationReason: reason, cancelledBy: req.user._id, createdBy: req.user._id },
      { upsert: true, new: true }
    );
    emitScheduleUpdate(req); 
    res.json(override);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createExtraClassRequest = async (req, res) => {
  try {
    const { targetGroup, emptySlot, course, reason, requestedDate, dayOfWeek, startTime, endTime } = req.body;
    if (!requestedDate) return res.status(400).json({ message: "requestedDate is required" });

    const isAutoApprove = ['class_rep', 'admin'].includes(req.user.role);
    const requestStatus = isAutoApprove ? 'approved' : 'pending';

    const request = await ExtraClassRequest.create({
      targetGroup, emptySlot: emptySlot || null, course, reason,
      requestedDate: new Date(requestedDate), requestedBy: req.user._id, dayOfWeek, startTime, endTime,
      status: requestStatus, reviewedBy: isAutoApprove ? req.user._id : null
    });

    if (isAutoApprove && emptySlot) {
        const targetDate = new Date(requestedDate);
        targetDate.setHours(12, 0, 0, 0);
        await SlotOverride.findOneAndUpdate(
            { classSlot: emptySlot, date: targetDate },
            { classSlot: emptySlot, group: targetGroup, date: targetDate, type: "extra", extraClassRequest: request._id, extraCourse: course, createdBy: req.user._id },
            { upsert: true, new: true }
        );
    }
    await request.populate([{ path: "requestedBy", select: "name role" }, { path: "targetGroup", select: "name" }, { path: "emptySlot" }, { path: "course", select: "name code" }]);
    emitScheduleUpdate(req); 
    res.status(201).json(request);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// -------------------- STRICT PUT / DELETE Controllers --------------------

exports.updateSlot = async (req, res) => {
  try {
    const slot = await ClassSlot.findById(req.params.id);
    if (!slot) return res.status(404).json({ message: "Slot not found" });

    const userId = req.user._id.toString();
    const isOwner = slot.teacher?.toString() === userId || slot.teachers?.some(t => t.toString() === userId);
    const isCR = ['class_rep', 'admin'].includes(req.user.role);
    if (!isOwner && !isCR) return res.status(403).json({ message: "Unauthorized." });

    const updatedSlot = await ClassSlot.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("teacher", "name email").populate("teachers", "name email")
      .populate("course", "name code").populate("group", "name description");
    emitScheduleUpdate(req); 
    res.json(updatedSlot);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.reviewExtraClassRequest = async (req, res) => {
  try {
    const { status, reviewNote } = req.body;
    const request = await ExtraClassRequest.findByIdAndUpdate(
      req.params.id, { status, reviewNote, reviewedBy: req.user._id }, { new: true }
    ).populate("emptySlot");

    if (status === "approved" && request.emptySlot) {
      const targetDate = new Date(request.requestedDate);
      targetDate.setHours(12, 0, 0, 0);
      await SlotOverride.findOneAndUpdate(
        { classSlot: request.emptySlot._id, date: targetDate },
        { classSlot: request.emptySlot._id, group: request.targetGroup, date: targetDate, type: "extra", extraClassRequest: request._id, extraCourse: request.course, createdBy: req.user._id },
        { upsert: true, new: true }
      );
    }
    emitScheduleUpdate(req); 
    res.json(request);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteSlot = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const userRole = req.user.role;
    const isCR = ['class_rep', 'admin'].includes(userRole);

    const extraReq = await ExtraClassRequest.findById(req.params.id).populate('course');
    if (extraReq) {
      const isOwner = extraReq.course?.teacher?.toString() === userId || extraReq.requestedBy.toString() === userId;
      if (!isOwner && !isCR) return res.status(403).json({ message: "Unauthorized." });
      await ExtraClassRequest.findByIdAndDelete(req.params.id);
    } else {
      const slot = await ClassSlot.findById(req.params.id);
      if (slot) {
         const isOwner = slot.teacher?.toString() === userId || slot.teachers?.some(t => t.toString() === userId);
         if (!isOwner && !isCR) return res.status(403).json({ message: "Unauthorized." });
         await ClassSlot.findByIdAndDelete(req.params.id);
      }
    }
    emitScheduleUpdate(req); 
    res.json({ message: "Deleted" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.undoCancellation = async (req, res) => {
  try {
    const { date } = req.body;
    const targetDate = new Date(date || Date.now());
    targetDate.setHours(12, 0, 0, 0);

    const override = await SlotOverride.findOne({ classSlot: req.params.id, date: targetDate, type: "cancellation" }).populate('classSlot');
    if (override && override.classSlot) {
        const userId = req.user._id.toString();
        const isOwner = override.classSlot.teacher?.toString() === userId || override.classSlot.teachers?.some(t => t.toString() === userId);
        const isCR = ['class_rep', 'admin'].includes(req.user.role);
        if (!isOwner && !isCR) return res.status(403).json({ message: "Unauthorized action." });
    }

    await SlotOverride.findOneAndDelete({ classSlot: req.params.id, date: targetDate, type: "cancellation" });
    emitScheduleUpdate(req); 
    res.json({ message: "Cancellation removed" });
  } catch (err) { res.status(500).json({ message: err.message }); }
};



// -------------------- GET Controllers --------------------

exports.getClassroomSchedule = async (req, res) => {
  try {
    let slots = await ClassSlot.find({ group: req.params.classroomId })
      .populate("teacher", "name email").populate("teachers", "name email")
      .populate("course", "name code").populate("group", "name description")
      .sort({ dayOfWeek: 1, startTime: 1 });
      
    // FIX: Skip temporary overrides if CR is in Permanent Edit Mode
    if (req.query.editMode !== 'true') {
        slots = await attachOverrides(slots, req.query.date, { targetGroup: req.params.classroomId });
    }
    res.json(slots);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getTeacherSchedule = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const groupIds = user.groups.map(g => g.group);

    const teacherCourses = await Course.find({ teacher: req.user._id });
    const teacherCourseIds = teacherCourses.map(c => c._id);

    let slots = await ClassSlot.find({
      $or: [{ teacher: req.user._id }, { teachers: req.user._id }],
    }).populate("teacher", "name email").populate("teachers", "name email")
      .populate("course", "name code").populate("group", "name description")
      .sort({ dayOfWeek: 1, startTime: 1 });

    if (req.query.editMode !== 'true') {
        slots = await attachOverrides(slots, req.query.date, { 
          $or: [
            { targetGroup: { $in: groupIds } },
            { course: { $in: teacherCourseIds } },
            { requestedBy: req.user._id }
          ] 
        });
    }
    res.json(slots);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getStudentSchedule = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const groupIds = user.groups.map(g => g.group);
    let slots = await ClassSlot.find({ group: { $in: groupIds } })
      .populate("teacher", "name email").populate("teachers", "name email")
      .populate("course", "name code").populate("group", "name description")
      .sort({ dayOfWeek: 1, startTime: 1 });

    if (req.query.editMode !== 'true') {
        slots = await attachOverrides(slots, req.query.date, { targetGroup: { $in: groupIds } });
    }
    res.json(slots);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getDepartmentSchedule = async (req, res) => {
  try {
    const dept = decodeURIComponent(req.params.department);
    const groups = await Group.find({ name: { $regex: dept, $options: "i" } });
    const groupIds = groups.map((g) => g._id);
    let slots = await ClassSlot.find({ group: { $in: groupIds } })
      .populate("teacher", "name").populate("teachers", "name")
      .populate("course", "name code").populate("group", "name description")
      .sort({ dayOfWeek: 1, startTime: 1 });

    if (req.query.editMode !== 'true') {
        slots = await attachOverrides(slots, req.query.date, { targetGroup: { $in: groupIds } });
    }
    res.json({ slots, classrooms: groups });
  } catch (err) { res.status(500).json({ message: err.message }); }
};