// ==================== GET Controllers ====================

// 1. Get classroom schedule
//    - Find all slots for given classroom ID
//    - Populate teacher, teachers, course, classroom fields
//    - Sort by day and time
//    - Attach overrides (cancellations/extra classes) for the requested date
//    - Return slots array

// 2. Get teacher schedule
//    - Find all slots where teacher is either single teacher or in teachers array
//    - Populate all related fields
//    - Sort by day and time
//    - Attach overrides for the date
//    - Return slots array

// 3. Get student schedule
//    - Find user by ID to get their classrooms
//    - Find all slots for those classrooms
//    - Populate fields
//    - Sort by day and time
//    - Attach overrides
//    - Return slots array

// 4. Get department schedule
//    - Decode department name from URL
//    - Find all active classrooms in that department
//    - Get all slots for those classrooms
//    - Populate fields
//    - Attach overrides
//    - Return both slots and classrooms array

// 5. Get empty slots (cancelled classes) for a date
//    - Parse date from query or use current date
//    - Find all cancellation overrides for that date
//    - Populate the original slot data
//    - Return array of cancelled slots

// 6. Get extra class requests
//    - Build filter based on user role:
//      - If class_rep/teacher/admin: filter by their classrooms
//      - Else: filter by requests they created
//    - Apply status filter if provided
//    - Populate all related fields
//    - Sort by creation date descending
//    - Return requests array

// 7. Get extra class requests for specific classroom
//    - Find all requests for given classroom ID
//    - Populate all fields
//    - Sort by creation date descending
//    - Return requests array

// ==================== POST Controllers ====================

// 8. Create new slot
//    - Check if slot already exists (classroom + day + time)
//    - If exists → return 400 conflict
//    - If not → create new slot with request body
//    - Populate all fields
//    - Return created slot with 201 status

// 9. Cancel a slot (create override)
//    - Find slot by ID
//    - If not found → return 404
//    - Create or update override for that date with cancellation type
//    - Set cancellation reason and cancelledBy
//    - Return created/updated override

// 10. Create extra class request
//     - Validate requestedDate is provided
//     - Create new ExtraClassRequest with all fields
//     - Set requestedBy to current user
//     - Populate all fields
//     - Return created request with 201 status

// ==================== PUT Controllers ====================

// 11. Update slot
//     - Find and update slot by ID with request body
//     - Return new: true to get updated document
//     - Populate fields
//     - Return updated slot

// 12. Review (approve/reject) extra class request
//     - Find and update request with status and reviewNote
//     - Set reviewedBy to current user
//     - If approved AND request has emptySlot (cancelled slot):
//       - Create SlotOverride for that date with type "extra"
//       - Link to the extra class request and course
//     - If approved for empty slot: no override needed (handled by attachOverrides)
//     - Return updated request

// ==================== DELETE Controllers ====================

// 13. Delete slot
//     - Find and delete slot by ID
//     - Return success message

// 14. Undo cancellation (remove override)
//     - Parse date from body or use current date
//     - Find and delete cancellation override for that slot and date
//     - Return success message
