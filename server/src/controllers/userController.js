const supabase = require('../config/supabase');
const User = require('../models/User');

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file.' });
    }

    const file = req.file;
    const userId = req.user._id;

    // 1. Supabase Upload
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'unilife-uploads';
    const fileExt = file.originalname.split('.').pop();
    const fileName = `avatars/${userId}_${Date.now()}.${fileExt}`;

    const { data, error } = await supabase.storage.from(bucketName).upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: true
    });

    if (error) throw new Error(`Supabase upload failed: ${error.message}`);

    // 2. Get Public URL
    const { data: urlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    const publicUrl = urlData.publicUrl;

    // 3. Save to MongoDB
    const updatedUser = await User.findByIdAndUpdate(
      userId, 
      { avatar: publicUrl }, 
      { new: true }
    ).select('-password');

    res.status(200).json({ success: true, avatarUrl: publicUrl, user: updatedUser });
  } catch (error) {
    console.error("Avatar Upload Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};