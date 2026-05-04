const Group = require('../models/Group');
const User = require('../models/User');
const JoinRequest = require('../models/JoinRequest');
const FirebaseService = require('../../notifications/services/firebase.service');

// @desc    Create a new group
exports.createGroup = async (req, res) => {
  try {
    const { name, pin, description } = req.body;
    const userId = req.user._id;

    const existingGroup = await Group.findOne({ name });
    if (existingGroup) {
      return res.status(400).json({ success: false, message: 'Group with this name already exists' });
    }

    const group = await Group.create({
      name,
      pin,
      description,
      createdBy: userId,
      members: [{ user: userId, role: 'admin', joinedAt: Date.now() }]
    });

    await User.findByIdAndUpdate(userId, {
      $push: {
        groups: {
          group: group._id,
          role: 'admin',
          joinedAt: Date.now()
        }
      }
    });

    const populatedGroup = await Group.findById(group._id).populate('members.user', 'name email');
    res.status(201).json({ success: true, group: populatedGroup });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Request to join a group
exports.requestToJoin = async (req, res) => {
  try {
    const { groupName, pin, requestedRole } = req.body;
    const userId = req.user._id;
    const user = await User.findById(userId);

    const group = await Group.findOne({ name: groupName });
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    
    if (group.pin !== pin) return res.status(401).json({ success: false, message: 'Invalid group PIN' });

    const isMember = group.members.some(m => m.user.toString() === userId.toString());
    if (isMember) return res.status(400).json({ success: false, message: 'You are already a member of this group' });

    let finalRequestedRole = requestedRole || 'student';
    if (user.role === 'student' && finalRequestedRole !== 'student') finalRequestedRole = 'student';

    // ✅ SMART FIX: Do not throw an error if stuck. Update the timestamp and ping the CR again!
    let joinRequest = await JoinRequest.findOne({ user: userId, group: group._id, status: 'pending' });
    
    if (joinRequest) {
      joinRequest.requestedAt = Date.now();
      joinRequest.requestedRole = finalRequestedRole;
      await joinRequest.save();
    } else {
      joinRequest = await JoinRequest.create({
        user: userId,
        group: group._id,
        groupName: group.name,
        pin,
        requestedRole: finalRequestedRole,
        status: 'pending'
      });
    }

    // ✅ FIX: Find all CRs, Teachers, and Admins in the group to receive the notification
    const adminsToNotify = group.members
      .filter(m => ['admin', 'teacher', 'cr', 'class_rep'].includes(m.role))
      .map(m => m.user.toString());

    // Trigger Interactive Notification to CR/Teacher
    if (adminsToNotify.length > 0) {
      await FirebaseService.sendToUsers(
        adminsToNotify,
        "New Join Request 🔔",
        `${user.name} wants to join ${group.name} as a ${finalRequestedRole}.`,
        "/manage-groups",
        "system",
        "high",
        user._id
      );
    }

    res.status(201).json({ success: true, message: 'Join request sent successfully', request: joinRequest });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get pending join requests for group admins
exports.getJoinRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Group.find({
      'members': { 
        $elemMatch: { 
          user: userId, 
          role: { $in: ['admin', 'teacher', 'cr', 'class_rep'] } 
        } 
      }
    });

    if (groups.length === 0) return res.status(200).json({ success: true, requests: [] });

    const groupIds = groups.map(g => g._id);

    // ✅ FIX: Force the DB to extract the 'studentId' so it is visible to the Teacher/CR on the frontend!
    let requests = await JoinRequest.find({ group: { $in: groupIds }, status: 'pending' })
      .populate('user', 'name email role studentId') 
      .populate('group', 'name members') 
      .sort('-requestedAt');

    requests = requests.filter(request => {
      return !request.group.members.some(m => m.user.toString() === request.user._id.toString());
    });

    res.status(200).json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Approve or reject join request
exports.reviewJoinRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const { status, assignRole } = req.body;
    const adminId = req.user._id.toString();

    if (!['approved', 'rejected'].includes(status)) return res.status(400).json({ success: false, message: 'Invalid status' });

    const joinRequest = await JoinRequest.findById(requestId).populate('group').populate('user');
    if (!joinRequest) return res.status(404).json({ success: false, message: 'Join request not found' });

    const isAdmin = joinRequest.group.members.some(m => 
      m.user.toString() === adminId && ['admin', 'teacher', 'cr', 'class_rep'].includes(m.role)
    );
    if (!isAdmin) return res.status(403).json({ success: false, message: 'Permission denied' });

    await JoinRequest.deleteMany({ user: joinRequest.user._id, group: joinRequest.group._id, status: status });

    joinRequest.status = status;
    joinRequest.reviewedBy = req.user._id;
    joinRequest.reviewedAt = Date.now();
    await joinRequest.save();

    if (status === 'approved') {
      const roleToAssign = assignRole || joinRequest.requestedRole || 'student';
      const isAlreadyMember = joinRequest.group.members.some(m => m.user.toString() === joinRequest.user._id.toString());

      if (!isAlreadyMember) {
        await Group.findByIdAndUpdate(joinRequest.group._id, {
          $push: { members: { user: joinRequest.user._id, role: roleToAssign, joinedAt: Date.now() } }
        });

        await User.findByIdAndUpdate(joinRequest.user._id, {
          $push: { groups: { group: joinRequest.group._id, role: roleToAssign, joinedAt: Date.now() } }
        });

        // ✅ Trigger notification to student that they were accepted
        await FirebaseService.sendToUsers(
          [joinRequest.user._id.toString()],
          "Group Request Approved ✅",
          `You have been added to ${joinRequest.group.name}!`,
          `/manage-groups`
        );
      }
    }

    res.status(200).json({ success: true, message: `Join request ${status} successfully` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's groups
exports.getMyGroups = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId).populate({
      path: 'groups.group',
      select: 'name description members createdBy',
      populate: { path: 'members.user', select: 'name email' }
    });

    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (!user.groups || user.groups.length === 0) return res.status(200).json({ success: true, groups: [] });

    const validGroups = user.groups.filter(item => item.group !== null);
    res.status(200).json({ success: true, groups: validGroups });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add member directly to group
exports.addMember = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId, role } = req.body; 
    const adminId = req.user._id.toString();

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const adminMember = group.members.find(m => m.user.toString() === adminId);
    if (!adminMember || !['admin', 'teacher', 'cr', 'class_rep'].includes(adminMember.role)) {
       return res.status(403).json({ success: false, message: 'Permission denied' });
    }

    const userToAdd = await User.findOne({ email: userId });
    if (!userToAdd) return res.status(404).json({ success: false, message: 'User not found' });

    const isMember = group.members.some(m => m.user.toString() === userToAdd._id.toString());
    if (isMember) return res.status(400).json({ success: false, message: 'User is already a member' });

    group.members.push({ user: userToAdd._id, role: role || 'student', joinedAt: Date.now() });
    await group.save();

    await User.findByIdAndUpdate(userToAdd._id, {
      $push: { groups: { group: groupId, role: role || 'student', joinedAt: Date.now() } }
    });

    await FirebaseService.sendToUsers(
      [userToAdd._id.toString()],
      "Added to a Group 👥",
      `You have been manually added to ${group.name} as a ${role || 'student'}.`,
      `/manage-groups`
    );

    const updatedGroup = await Group.findById(groupId).populate('members.user', 'name email');
    res.status(200).json({ success: true, message: 'Member added successfully', group: updatedGroup });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Remove member from group
exports.removeMember = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const adminId = req.user._id.toString();

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const adminMember = group.members.find(m => m.user.toString() === adminId);
    if (!adminMember || !['admin', 'teacher', 'cr'].includes(adminMember.role)) return res.status(403).json({ success: false, message: 'Permission denied' });

    if (userId === adminId) return res.status(400).json({ success: false, message: 'Cannot remove yourself' });

    group.members = group.members.filter(m => m.user.toString() !== userId);
    await group.save();

    await User.findByIdAndUpdate(userId, { $pull: { groups: { group: groupId } } });
    res.status(200).json({ success: true, message: 'Member removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update member role
exports.updateMemberRole = async (req, res) => {
  try {
    const { groupId, userId } = req.params;
    const { role } = req.body;
    const adminId = req.user._id.toString();

    if (!['student', 'teacher', 'cr', 'admin', 'class_rep'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    const group = await Group.findById(groupId);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const adminMember = group.members.find(m => m.user.toString() === adminId);
    if (!adminMember || !['admin', 'teacher', 'cr', 'class_rep'].includes(adminMember.role)) {
      return res.status(403).json({ success: false, message: 'Permission denied' });
    }

    const memberIndex = group.members.findIndex(m => m.user.toString() === userId);
    if (memberIndex === -1) return res.status(404).json({ success: false, message: 'Member not found' });

    group.members[memberIndex].role = role;
    await group.save();

    await User.updateOne({ _id: userId, 'groups.group': groupId }, { $set: { 'groups.$.role': role } });
    res.status(200).json({ success: true, message: 'Member role updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all members of a group
exports.getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = req.user._id.toString();

    const group = await Group.findById(groupId).populate('members.user', 'name email role');
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });

    const validMembers = group.members.filter(m => m.user !== null);
    const currentUser = validMembers.find(m => m.user._id.toString() === userId);
    
    if (!currentUser) return res.status(403).json({ success: false, message: 'You are not a member of this group' });

    const isCurrentUserAdmin = ['admin', 'teacher', 'cr', 'class_rep'].includes(currentUser.role);
    const members = {
      admins: validMembers.filter(m => ['admin', 'teacher', 'cr', 'class_rep'].includes(m.role)),
      students: validMembers.filter(m => m.role === 'student'),
      all: validMembers,
      currentUserRole: currentUser.role,
      isCurrentUserAdmin,
      totalMembers: validMembers.length
    };

    res.status(200).json({ success: true, members });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};