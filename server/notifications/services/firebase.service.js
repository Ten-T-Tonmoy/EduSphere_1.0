const admin = require("firebase-admin");
const serviceAccount = require("../config/firebase-service-account.json");
const NotificationToken = require("../models/NotificationToken");
const NotificationLog = require("../models/NotificationLog");
const serviceAccount = process.env.process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

class FirebaseService {
  async sendToUsers(
    userIds,
    title,
    body,
    actionUrl = "/",
    type = "system",
    priority = "normal",
    senderId = null,
  ) {
    try {
      if (!userIds || userIds.length === 0) return;

      // 1. Log notifications to database
      const logEntries = userIds.map((id) => ({
        recipient: id,
        sender: senderId,
        title,
        body,
        actionUrl,
        type,
        priority,
      }));
      await NotificationLog.insertMany(logEntries);
      console.log(
        `[FCM] Successfully logged ${logEntries.length} notifications to database.`,
      );

      // 2. Find tokens for the specified users
      const tokensDoc = await NotificationToken.find({
        user: { $in: userIds },
      });
      const tokens = tokensDoc.map((doc) => doc.token);

      if (tokens.length === 0) {
        console.log(
          "[FCM] ❌ Failed: No notification tokens found in database for these users.",
        );
        return;
      }

      console.log(
        `[FCM] Found ${tokens.length} active device tokens. Sending message...`,
      );

      const message = {
        tokens,
        notification: { title, body },
        data: { click_action: actionUrl, type, priority },
        webpush: { fcmOptions: { link: actionUrl } },
      };

      const response = await admin.messaging().sendEachForMulticast(message);

      console.log(
        `[FCM] ✅ Success! Messages sent: ${response.successCount}, Failed: ${response.failureCount}`,
      );

      // ✅ FIX: Automatically cleanup dead tokens from the database
      if (response.failureCount > 0) {
        const failedTokens = [];

        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.log(
              `[FCM] Invalid token detected, preparing to remove:`,
              tokens[idx],
            );
            failedTokens.push(tokens[idx]);
          }
        });

        // Delete all failed tokens in one database query
        if (failedTokens.length > 0) {
          await NotificationToken.deleteMany({ token: { $in: failedTokens } });
          console.log(
            `[FCM] Successfully deleted ${failedTokens.length} dead tokens from the database.`,
          );
        }
      }
    } catch (error) {
      // ✅ FIX: Gracefully handle server offline/network errors without a massive crash log
      if (
        error.code === "messaging/app/network-error" ||
        error.message.includes("ENOTFOUND")
      ) {
        console.log(
          "[FCM] ⚠️ Network Error: Server is currently offline. Push notification skipped, but safely logged to database.",
        );
      } else {
        console.error(
          "[FCM] ❌ Critical Error sending push notification:",
          error,
        );
      }
    }
  }
}

module.exports = new FirebaseService();
