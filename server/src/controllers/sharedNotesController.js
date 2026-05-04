const SharedMaterial = require("../models/SharedMaterial");
const MaterialRequest = require("../models/MaterialRequest");
const User = require("../models/User");
const Group = require("../models/Group"); 
const supabase = require("../config/supabase"); 
const FirebaseService = require("../../notifications/services/firebase.service");

// Get all shared materials for the user's groups
exports.getSharedMaterials = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id; // ✅ FIX: Bulletproof ID parsing
    const user = await User.findById(userId);
    const groupIds = user.groups.map(g => g.group);

    const materials = await SharedMaterial.find({
      group: { $in: groupIds }
    })
      .populate("sharedBy", "name")
      .populate("group", "name")
      .sort({ createdAt: -1 });

    const filteredMaterials = materials.filter(mat => {
      if (!mat.targetUser) return true; 
      if (mat.targetUser.toString() === userId.toString()) return true; 
      if (mat.sharedBy && mat.sharedBy._id.toString() === userId.toString()) return true; 
      return false;
    });

    res.json(filteredMaterials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Upload to Supabase and share new material
exports.shareMaterial = async (req, res) => {
  try {
    const { groupId, targetUserId, description } = req.body;
    const userId = req.user._id || req.user.id;
    const sender = await User.findById(userId);
    const attachments = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const safeName = file.originalname.replace(/\s+/g, '-');
        const fileName = `shared-notes/${Date.now()}-${safeName}`;
        const fileBody = new Uint8Array(file.buffer);

        const { data, error } = await supabase.storage.from('uploads').upload(fileName, fileBody, {
          contentType: file.mimetype,
          upsert: false
        });

        if (error) return res.status(500).json({ message: `Supabase Error: ${error.message}` });

        const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(fileName);
        attachments.push({ url: publicUrlData.publicUrl, originalName: file.originalname, mimetype: file.mimetype });
      }
    }

    let finalTargetUser = null;
    if (targetUserId && targetUserId !== "all" && targetUserId !== "null" && targetUserId !== "undefined" && targetUserId.trim() !== "") {
        finalTargetUser = targetUserId;
    }

    const newMaterial = await SharedMaterial.create({
      group: groupId,
      sharedBy: userId,
      targetUser: finalTargetUser,
      description,
      attachments,
      viewedBy: [] 
    });

    await newMaterial.populate([{ path: "sharedBy", select: "name" }, { path: "group", select: "name" }]);

    // 🔔 NOTIFICATION SYSTEM INTEGRATION
    try {
      const group = await Group.findById(groupId);
      if (group) {
        let receivers = [];
        if (finalTargetUser) {
          receivers = [finalTargetUser];
        } else {
          // Send to everyone in the group except the sender
          receivers = group.members
            .map(m => m.user ? m.user.toString() : m.toString())
            .filter(id => id !== userId.toString());
        }

        if (receivers.length > 0) {
          await FirebaseService.sendToUsers(
            receivers,
            "New Material Shared 📚",
            `${sender.name} shared new material in ${group.name}.`,
            "/notes", // Directs to Notes Page
            "system",
            "normal",
            userId
          );
        }
      }
    } catch (notifErr) {
      console.error("Notification error:", notifErr);
    }

    res.status(201).json(newMaterial);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark material as viewed by the user
exports.markAsViewed = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const material = await SharedMaterial.findById(req.params.id);
    if (!material) return res.status(404).json({ message: "Not found" });

    if (!material.viewedBy.includes(userId)) {
      material.viewedBy.push(userId);
      await material.save();
    }
    
    res.json({ success: true, viewedBy: material.viewedBy });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get active requests
exports.getRequests = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);
    const groupIds = user.groups.map(g => g.group);

    const requests = await MaterialRequest.find({
      group: { $in: groupIds },
      status: "pending"
    })
      .populate("requester", "name")
      .populate("group", "name")
      .sort({ createdAt: -1 });

    const filteredRequests = requests.filter(req => {
      if (!req.targetUser) return true; 
      if (req.targetUser.toString() === userId.toString()) return true; 
      if (req.requester && req.requester._id.toString() === userId.toString()) return true; 
      return false;
    });

    res.json(filteredRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new request
exports.createRequest = async (req, res) => {
  try {
    const { groupId, targetUserId, description } = req.body;
    const userId = req.user._id || req.user.id;
    const sender = await User.findById(userId);
    
    let finalTargetUser = null;
    if (targetUserId && targetUserId !== "all" && targetUserId !== "null" && targetUserId !== "undefined" && targetUserId.trim() !== "") {
        finalTargetUser = targetUserId;
    }

    const newRequest = await MaterialRequest.create({
      group: groupId, requester: userId, targetUser: finalTargetUser, description
    });

    await newRequest.populate([{ path: "requester", select: "name" }, { path: "group", select: "name" }]);

    // 🔔 NOTIFICATION SYSTEM INTEGRATION
    try {
      const group = await Group.findById(groupId);
      if (group) {
        let receivers = [];
        if (finalTargetUser) {
          receivers = [finalTargetUser];
        } else {
          receivers = group.members
            .map(m => m.user ? m.user.toString() : m.toString())
            .filter(id => id !== userId.toString());
        }

        if (receivers.length > 0) {
          await FirebaseService.sendToUsers(
            receivers,
            "Material Request 📝",
            `${sender.name} is requesting material in ${group.name}.`,
            "/notes",
            "system",
            "normal",
            userId
          );
        }
      }
    } catch (notifErr) {
      console.error("Notification error:", notifErr);
    }

    res.status(201).json(newRequest);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};