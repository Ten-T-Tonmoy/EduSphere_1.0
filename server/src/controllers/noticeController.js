const Notice = require('../models/Notice');
const Group = require('../models/Group');
const mongoose = require('mongoose');
const supabase = require('../config/supabase');
const FirebaseService = require('../../notifications/services/firebase.service');

let io;
const setIo = (socketIo) => { io = socketIo; };

const uploadToSupabase = async (file, userId, bucketName) => {
  const timestamp = Date.now();
  const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
  const fileName = `${timestamp}_${safeName}`;

  const { data, error } = await supabase.storage.from(bucketName).upload(fileName, file.buffer, {
    contentType: file.mimetype,
    cacheControl: '3600',
    upsert: false
  });

  if (error) throw new Error(`Upload failed: ${error.message}`);
  const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
  return { publicUrl: urlData.publicUrl, supabasePath: fileName };
};

exports.createNotice = async (req, res) => {
  try {
    const userId = req.user._id;
    const { title, content, priority, expiresAt, groupId } = req.body;

    // Strict Group ID validation (Classroom references removed)
    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ success: false, message: 'A valid Group ID is required' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const isMember = group.members?.some(m => m.user?.toString() === userId.toString());
    if (!isMember) return res.status(403).json({ success: false, message: 'Not a member of this group' });

    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'unilife-uploads';
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploadResult = await uploadToSupabase(file, userId, bucketName);
        attachments.push({
          fileName: file.originalname,      
          fileUrl: uploadResult.publicUrl,  
          fileType: file.mimetype,
          fileSize: file.size
        });
      }
    }

    const notice = new Notice({
      group: groupId,         // Matches new Schema field
      createdBy: userId,       // Matches new Schema field
      title, 
      content,
      priority: priority || 'normal', 
      expiresAt: expiresAt || null, 
      attachments,
      readBy: [] 
    });

    const savedNotice = await notice.save();
    await savedNotice.populate('createdBy', 'name role email avatar');

    if (io) io.to(`group-${groupId}`).emit('new-notice', { notice: savedNotice });

    // ✅ FIREBASE NOTIFICATION TRIGGER ADDED HERE
   if (group && group.members) {
      const memberIds = group.members
        .map(member => member.user ? member.user.toString() : member.toString())
        .filter(id => id !== userId.toString()); 

      await FirebaseService.sendToUsers(
        memberIds,
        `Notice from ${req.user.name} (${group.name})`, // ✅ Explicitly shows the Teacher/CR name
        `[${priority.toUpperCase()}] ${savedNotice.title}`,
        `/notices/${groupId}`, // ✅ Directly redirects to the standalone NoticeBoard Page
        "notice",
        priority,
        req.user._id
      );
    }

    res.status(201).json({ success: true, notice: savedNotice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGroupNotices = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { groupId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ success: false, message: 'Invalid Group ID' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    // ✅ STRICT SECURITY LOCK: Validate membership before returning any notices
    const isMember = group.members?.some(m => m.user?.toString() === userId);
    if (!isMember) {
      return res.status(403).json({ success: false, message: 'Access denied. You are not a member of this group.' });
    }

    const query = { group: groupId };

    const notices = await Notice.find(query)
      .populate('createdBy', 'name role email avatar') 
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Notice.countDocuments(query);

    // Safe parsing of the readBy array
    const unreadNoticeIds = notices
      .filter(n => {
        if (!n.readBy) return true;
        return !n.readBy.some(id => id.toString() === userId);
      })
      .map(n => n._id);

    if (unreadNoticeIds.length > 0) {
      await Notice.updateMany(
        { _id: { $in: unreadNoticeIds } },
        { $addToSet: { readBy: userId } }
      );
    }

    res.json({ success: true, notices, totalPages: Math.ceil(total / parseInt(limit)), currentPage: parseInt(page), total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getGroupNotices = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { groupId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!groupId || !mongoose.Types.ObjectId.isValid(groupId)) {
      return res.status(400).json({ success: false, message: 'Invalid Group ID' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    // THE FIX: ONLY query by group to prevent Mongoose StrictQuery crashes
    const query = { group: groupId };

    const notices = await Notice.find(query)
      .populate('createdBy', 'name role email avatar') 
      .sort('-createdAt')
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await Notice.countDocuments(query);

    // THE FIX: Safe parsing of the readBy array
    const unreadNoticeIds = notices
      .filter(n => {
        if (!n.readBy) return true;
        return !n.readBy.some(id => id.toString() === userId);
      })
      .map(n => n._id);

    if (unreadNoticeIds.length > 0) {
      await Notice.updateMany(
        { _id: { $in: unreadNoticeIds } },
        { $addToSet: { readBy: userId } }
      );
    }

    res.json({ success: true, notices, totalPages: Math.ceil(total / parseInt(limit)), currentPage: parseInt(page), total });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateNotice = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { noticeId } = req.params;
    const { title, content, priority, expiresAt } = req.body;

    const notice = await Notice.findById(noticeId);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });

    const group = await Group.findById(notice.group);
    let isAdmin = group && group.members?.some(m => m.user?.toString() === userId && ['admin', 'cr', 'class_rep'].includes(m.role));

    if (notice.createdBy.toString() !== userId && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }

    if (title) notice.title = title;
    if (content) notice.content = content;
    if (priority) notice.priority = priority === 'medium' ? 'normal' : priority;
    if (expiresAt) notice.expiresAt = expiresAt;

    await notice.save();
    await notice.populate('createdBy', 'name role email avatar');

    if (io && group) io.to(`group-${notice.group}`).emit('update-notice', { notice });
    res.json({ success: true, notice });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteNotice = async (req, res) => {
  try {
    const userId = req.user._id.toString();
    const { noticeId } = req.params;

    const notice = await Notice.findById(noticeId);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });

    const group = await Group.findById(notice.group);
    let isAdmin = group && group.members?.some(m => m.user?.toString() === userId && ['admin', 'cr', 'class_rep'].includes(m.role));

    if (notice.postedBy.toString() !== userId && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }

    for (const att of notice.attachments || []) {
      if (att.fileUrl) {
        const filePath = att.fileUrl.split('/').pop(); 
        await supabase.storage.from(process.env.SUPABASE_STORAGE_BUCKET || 'unilife-uploads').remove([filePath]);
      }
    }

    await Notice.findByIdAndDelete(noticeId);
    if (io && group) io.to(`group-${notice.group}`).emit('delete-notice', { noticeId });
    res.json({ success: true, message: 'Notice deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getUnreadCount = async (req, res) => { res.json({ success: true, unreadCount: 0 }); };

exports.markAsViewed = async (req, res) => {
  try {
    await Notice.findByIdAndUpdate(
      req.params.noticeId, 
      { $addToSet: { readBy: req.user._id } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getFile = async (req, res) => { res.json({ success: true }); };

module.exports = {
  createNotice: exports.createNotice,
  getGroupNotices: exports.getGroupNotices,
  updateNotice: exports.updateNotice,
  deleteNotice: exports.deleteNotice,
  markAsViewed: exports.markAsViewed,
  getUnreadCount: exports.getUnreadCount,
  getFile: exports.getFile,
  setIo
};