const Message = require("../models/Message");
const User = require("../models/User");
const Group = require("../models/Group");

// Get contacts based on STRICT Group Isolation
exports.getContacts = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.json({ groups: [], users: [] });
    }

    const user = await User.findById(req.user._id).populate({
      path: "groups.group",
      populate: { path: "members.user", select: "name email role avatar" } 
    });
    
    if (!user) {
      return res.json({ groups: [], users: [] });
    }

    let contacts = { groups: [], users: [] };
    const allGroups = Array.isArray(user.groups) 
      ? user.groups.map((g) => g && g.group).filter(Boolean)
      : [];

    let dmUsers = new Map();

    allGroups.forEach(group => {
      if (group && Array.isArray(group.members)) {
        group.members.forEach(member => {
          if (!member || !member.user) return;
          
          const memberUser = member.user;
          const memberId = memberUser._id ? String(memberUser._id) : null;
          
          if (!memberId || memberId === String(req.user._id)) return;

          const memberRole = memberUser.role || '';

          if (req.user.role === 'teacher' || req.user.role === 'admin') {
            if (memberRole === 'cr' || memberRole === 'class_rep') {
              if (!dmUsers.has(memberId)) {
                const userObj = memberUser.toObject ? memberUser.toObject() : JSON.parse(JSON.stringify(memberUser));
                userObj.groupName = group.name || 'Group'; 
                dmUsers.set(memberId, userObj);
              }
            }
          } else if (req.user.role === 'cr' || req.user.role === 'class_rep') {
            if (memberRole === 'teacher' || memberRole === 'admin') {
              if (!dmUsers.has(memberId)) {
                const userObj = memberUser.toObject ? memberUser.toObject() : JSON.parse(JSON.stringify(memberUser));
                userObj.groupName = group.name || 'Group'; 
                dmUsers.set(memberId, userObj);
              }
            }
          }
        });
      }
    });

    if (req.user.role === 'teacher' || req.user.role === 'admin') {
      contacts.groups = [];
    } else {
      contacts.groups = allGroups; 
    }
    
    contacts.users = Array.from(dmUsers.values());

    return res.json(contacts);
  } catch (error) {
    console.error("Backend Contacts Error:", error);
    return res.json({ groups: [], users: [] });
  }
};

// Get Messages
exports.getMessages = async (req, res) => {
  try {
    const { targetId, type } = req.query;
    let query = {};

    if (type === "group") {
      query = { group: targetId };
    } else if (type === "private") {
      query = {
        $or: [
          { sender: req.user._id, receiver: targetId },
          { sender: targetId, receiver: req.user._id },
        ],
      };
    }

    const messages = await Message.find(query)
      .populate("sender", "name role avatar") 
      .sort({ createdAt: 1 });

    return res.json(messages);
  } catch (error) {
    console.error("Backend Get Messages Error:", error);
    return res.json([]); 
  }
};

// Send a message, emit via Socket.io, trigger Notification
exports.sendMessage = async (req, res) => {
  try {
    const { targetId, type, text } = req.body;

    const message = new Message({
      sender: req.user._id,
      text,
      group: type === "group" ? targetId : null,
      receiver: type === "private" ? targetId : null,
    });

    await message.save();
    
    // ✅ CRASH FIX: .lean() rips out Mongoose Infinite Loops
    const rawPopulatedMessage = await Message.findById(message._id)
      .populate("sender", "name role avatar")
      .lean();

    // ✅ CRASH FIX: Deep clone creates a pure, safe JSON object for the Socket network
    const safePayload = JSON.parse(JSON.stringify(rawPopulatedMessage));

    const io = req.app.get("io");
    const roomId = type === "group" 
      ? String(targetId)
      : [String(req.user._id), String(targetId)].sort().join("_");
      
    if (io) {
      io.to(roomId).emit("receive_message", safePayload);
    }

    // FIREBASE TRIGGER
    try {
      const FirebaseService = require('../../notifications/services/firebase.service');
      if (type === "group") {
        const group = await Group.findById(targetId);
        if (group && Array.isArray(group.members)) {
          const receivers = group.members
            .map(member => member.user ? String(member.user) : String(member))
            .filter(id => id !== String(req.user._id)); 

          await FirebaseService.sendToUsers(receivers, `${req.user.name} in ${group.name}`, text, `/chat?activeGroup=${targetId}`, "chat", "normal", req.user._id);
        }
      } else if (type === "private") {
        let senderTitle = req.user.role === 'class_rep' ? `CR ${req.user.name}` : `Teacher ${req.user.name}`;
        await FirebaseService.sendToUsers([targetId], `Private Message from ${senderTitle}`, text, `/chat?activePrivate=${req.user._id}`, "chat", "normal", req.user._id);
      }
    } catch (fbError) {
      console.error("Firebase Notification Skipped:", fbError.message);
    }

    return res.status(201).json(safePayload);
  } catch (error) {
    console.error("Backend Send Message Error:", error);
    return res.status(500).json({ message: error.message });
  }
};