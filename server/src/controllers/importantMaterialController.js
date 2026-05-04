const ImportantMaterial = require("../models/ImportantMaterial");
const User = require("../models/User");
const supabase = require("../config/supabase");

// Get materials for a specific group
exports.getGroupMaterials = async (req, res) => {
  try {
    const { groupId } = req.params;

    // Verify user is in the group
    const user = await User.findById(req.user._id);
    const isMember = user.groups.some(g => g.group.toString() === groupId);
    if (!isMember) return res.status(403).json({ message: "Access denied." });

    const materials = await ImportantMaterial.find({ group: groupId })
      .populate("sharedBy", "name role avatar")
      .sort({ createdAt: -1 });

    res.json(materials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create new important material
exports.createMaterial = async (req, res) => {
  try {
    const { groupId, content } = req.body;

    // STRICT CHECK: Only Teachers, CRs, and Admins can post
    const user = await User.findById(req.user._id);
    const groupMembership = user.groups.find(g => g.group.toString() === groupId);
    
    if (!groupMembership || !['teacher', 'class_rep', 'admin'].includes(groupMembership.role)) {
      return res.status(403).json({ message: "Only Teachers and CRs can post important materials." });
    }

    const attachments = [];

    // Supabase Upload Logic
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const safeName = file.originalname.replace(/\s+/g, '-');
        const fileName = `important-materials/${Date.now()}-${safeName}`;
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

    const newMaterial = await ImportantMaterial.create({
      group: groupId,
      sharedBy: req.user._id,
      content,
      attachments,
      viewedBy: []
    });

    await newMaterial.populate("sharedBy", "name role avatar");
    res.status(201).json(newMaterial);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark as viewed
exports.markAsViewed = async (req, res) => {
  try {
    const material = await ImportantMaterial.findById(req.params.id);
    if (!material) return res.status(404).json({ message: "Material not found" });

    if (!material.viewedBy.includes(req.user._id)) {
      material.viewedBy.push(req.user._id);
      await material.save();
    }
    res.json({ success: true, viewedBy: material.viewedBy });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete material
exports.deleteMaterial = async (req, res) => {
  try {
    const material = await ImportantMaterial.findById(req.params.id);
    if (!material) return res.status(404).json({ message: "Not found" });

    // Only the creator or an admin can delete it
    if (material.sharedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Permission denied" });
    }

    await ImportantMaterial.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};