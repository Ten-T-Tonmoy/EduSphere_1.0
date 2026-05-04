const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationManager {
  async send({ recipientId, senderId, type, title, message, payload = {}, actions = [] }) {
    try {
      const user = await User.findById(recipientId);
      if (!user) return;

      // TRAINED LOGIC: Respect the Mute Setting from SettingsPage
      if (user.appSettings.muteEnabled && type !== 'ATTENDANCE_ALERT') {
        console.log(`Muting ${type} for user ${user.name}`);
        // We still save it to the DB inbox, but we don't trigger a sound/socket alert
      }

      const notify = await Notification.create({
        recipient: recipientId,
        sender: senderId,
        type,
        title,
        message,
        payload,
        actions
      });

      // Real-time emit if Socket.io is connected
      if (global.io) {
        global.io.to(recipientId.toString()).emit('new-notification', notify);
      }

      return notify;
    } catch (error) {
      console.error("Notification Manager Error:", error);
    }
  }
}

module.exports = new NotificationManager();