const multer = require("multer");

const storage = multer.diskStorage({});

const chatUpload = multer({
  storage,

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      // Images
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",

      // Videos
      "video/mp4",
      "video/mpeg",
      "video/quicktime",
      "video/webm",

      // Audio
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/webm",
      "audio/ogg",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only image, video and audio files allowed"));
    }
  },

  limits: {
    fileSize: 100 * 1024 * 1024,
  },
});

module.exports = chatUpload;