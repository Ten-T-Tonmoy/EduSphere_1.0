const Course = require("../models/Course");

// ==================== GET Controllers ====================


exports.batchUpdateCourses = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { semester, classStartDate, classEndDate } = req.body;

    const updateData = {};
    if (semester) updateData.semester = semester;
    if (classStartDate) updateData.classStartDate = classStartDate;
    if (classEndDate) updateData.classEndDate = classEndDate;

    await Course.updateMany(
      { group: groupId, isActive: true },
      { $set: updateData }
    );

    res.json({ message: "All courses updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


exports.getGroupCourses = async (req, res) => {
  try {
    const targetGroup = req.params.groupId || req.params.classroomId;
    const courses = await Course.find({
      group: targetGroup,
      isActive: true,
    }).populate("teacher", "name email");
    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate(
      "teacher",
      "name",
    );
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getGroupProgress = async (req, res) => {
  try {
    const targetGroup = req.params.groupId || req.params.classroomId;
    const courses = await Course.find({
      group: targetGroup,
      isActive: true,
    });

    const progress = courses.map((c) => {
      const totalTopics = c.chapters.reduce((a, ch) => a + ch.topics.length, 0);
      const completedTopics = c.chapters.reduce(
        (a, ch) => a + ch.topics.filter((t) => t.isCompleted).length,
        0,
      );

      return {
        _id: c._id,
        name: c.name,
        code: c.code,
        totalTopics,
        completedTopics,
        percentage: totalTopics
          ? Math.round((completedTopics / totalTopics) * 100)
          : 0,
        classEndDate: c.classEndDate,
      };
    });

    res.json(progress);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllCourses = async (req, res) => {
  try {
    const { group, classroom, teacher, semester, isActive } = req.query;
    let filter = {};

    if (group || classroom) filter.group = group || classroom;
    if (teacher) filter.teacher = teacher;
    if (semester) filter.semester = parseInt(semester);
    if (isActive !== undefined) filter.isActive = isActive === "true";

    const courses = await Course.find(filter)
      .populate("teacher", "name email")
      .populate("group", "name description")
      .sort({ createdAt: -1 });

    res.json(courses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==================== POST Controllers ====================

exports.createCourse = async (req, res) => {
  try {
    const targetGroup = req.body.group || req.body.classroom;
    
    if (req.body.code) {
      const existing = await Course.findOne({
        group: targetGroup,
        code: req.body.code,
        isActive: true,
      });

      if (existing) {
        return res.status(400).json({
          message: "A course with this code already exists in this group",
        });
      }
    }

    const course = await Course.create({
      ...req.body,
      group: targetGroup,
      createdBy: req.user._id,
    });

    await course.populate([
      { path: "teacher", select: "name email" },
      { path: "group", select: "name description" },
    ]);

    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==================== PUT Controllers ====================

exports.updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) return res.status(404).json({ message: "Course not found" });

    const targetGroup = req.body.group || req.body.classroom || course.group;

    if (req.body.code && req.body.code !== course.code) {
      const existing = await Course.findOne({
        group: targetGroup,
        code: req.body.code,
        isActive: true,
        _id: { $ne: course._id },
      });

      if (existing) {
        return res.status(400).json({
          message: "A course with this code already exists in this group",
        });
      }
    }

    const updateData = { ...req.body };
    if (req.body.classroom || req.body.group) {
        updateData.group = targetGroup;
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true },
    )
      .populate("teacher", "name email")
      .populate("group", "name description");

    res.json(updatedCourse);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleTopicCompletion = async (req, res) => {
  try {
    const { courseId, chapterIdx, topicIdx } = req.params;
    const { isCompleted } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const chapter = course.chapters[chapterIdx];
    if (!chapter) return res.status(404).json({ message: "Chapter not found" });

    const topic = chapter.topics[topicIdx];
    if (!topic) return res.status(404).json({ message: "Topic not found" });

    topic.isCompleted = isCompleted;
    topic.completedAt = isCompleted ? new Date() : null;
    topic.completedBy = isCompleted ? req.user._id : null;

    chapter.isCompleted = chapter.topics.every((t) => t.isCompleted);

    if (course.chapters.every((ch) => ch.isCompleted)) {
      course.isCompleted = true;
      course.completedAt = new Date();
    } else {
      course.isCompleted = false;
      course.completedAt = null;
    }

    await course.save();

    res.json({
      message: "Topic updated successfully",
      chapter,
      topic,
      courseProgress: {
        totalChapters: course.chapters.length,
        completedChapters: course.chapters.filter((ch) => ch.isCompleted).length,
        isCourseCompleted: course.isCompleted,
      },
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addChapter = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ message: "Chapter title is required" });

    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    course.chapters.push({
      title,
      description,
      topics: [],
      order: course.chapters.length,
    });

    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.addTopic = async (req, res) => {
  try {
    const { courseId, chapterIdx } = req.params;
    const { title, description, resources } = req.body;

    if (!title) return res.status(400).json({ message: "Topic title is required" });

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const chapter = course.chapters[chapterIdx];
    if (!chapter) return res.status(404).json({ message: "Chapter not found" });

    chapter.topics.push({
      title,
      description,
      resources: resources || [],
      order: chapter.topics.length,
    });

    await course.save();
    res.status(201).json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.reorderChapters = async (req, res) => {
  try {
    const { chapterOrder } = req.body;
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    const reorderedChapters = chapterOrder.map((chapterId, index) => {
      const chapter = course.chapters.id(chapterId);
      if (chapter) chapter.order = index;
      return chapter;
    });

    course.chapters.sort((a, b) => a.order - b.order);
    await course.save();

    res.json(course);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ==================== DELETE Controllers ====================

exports.deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    course.isActive = false;
    await course.save();
    res.json({ message: "Course deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.hardDeleteCourse = async (req, res) => {
  try {
    const course = await Course.findByIdAndDelete(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });
    res.json({ message: "Course permanently deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteChapter = async (req, res) => {
  try {
    const { courseId, chapterIdx } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (chapterIdx < 0 || chapterIdx >= course.chapters.length) {
      return res.status(404).json({ message: "Chapter not found" });
    }

    course.chapters.splice(chapterIdx, 1);
    course.chapters.forEach((ch, idx) => { ch.order = idx; });

    await course.save();
    res.json({ message: "Chapter deleted successfully", course });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteTopic = async (req, res) => {
  try {
    const { courseId, chapterIdx, topicIdx } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    if (chapterIdx < 0 || chapterIdx >= course.chapters.length) return res.status(404).json({ message: "Chapter not found" });

    const chapter = course.chapters[chapterIdx];
    if (topicIdx < 0 || topicIdx >= chapter.topics.length) return res.status(404).json({ message: "Topic not found" });

    chapter.topics.splice(topicIdx, 1);
    chapter.topics.forEach((t, idx) => { t.order = idx; });

    await course.save();
    res.json({ message: "Topic deleted successfully", course });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};