const express = require('express');
const router = express.Router();
const {
  createGroup, requestToJoin, getJoinRequests, reviewJoinRequest,
  getMyGroups, addMember, removeMember, updateMemberRole, getGroupMembers
} = require('../controllers/groupController');

// REQUIRED FIX: Using your project's Auth Middleware
const { auth } = require('../middleware/Auth'); 

router.use(auth);

router.post('/create', createGroup);
router.post('/join-request', requestToJoin);
router.get('/join-requests', getJoinRequests);
router.put('/join-request/:requestId', reviewJoinRequest);
router.get('/my-groups', getMyGroups);
router.get('/:groupId/members', getGroupMembers);
router.post('/:groupId/members', addMember);
router.delete('/:groupId/members/:userId', removeMember);
router.put('/:groupId/members/:userId/role', updateMemberRole);

module.exports = router;