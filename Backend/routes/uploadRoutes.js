const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const { auth } = require('../middleware/auth');

// Set up Multer with Memory Storage for Cloudinary
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif|mp4|webm|webp/;
        const mimetypes = /image\/jpeg|image\/jpg|image\/png|image\/gif|video\/mp4|video\/webm|image\/webp/;

        // We only check mimetype to be more forgiving with base64/blob uploads from frontend
        if (mimetypes.test(file.mimetype)) {
            return cb(null, true);
        }
        cb(new Error("Error: Images and Videos Only!"));
    }
});

// Single file upload route (Uploads to Cloudinary)
router.post('/', auth(), upload.single('media'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Determine resource type
        const isVideo = req.file.mimetype.startsWith('video/');
        const resourceType = isVideo ? 'video' : 'image';

        // Upload to Cloudinary via stream from memory buffer
        const uploadPromise = new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                { folder: "senses_feed_media", resource_type: resourceType },
                (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                }
            );
            // Convert buffer to stream and pipe to cloudinary
            require('stream').Readable.from(req.file.buffer).pipe(stream);
        });

        const uploadResult = await uploadPromise;

        res.status(200).json({
            success: true,
            url: uploadResult.secure_url,
            message: 'File uploaded successfully'
        });
    } catch (error) {
        console.error('Cloudinary Upload error:', error);
        res.status(500).json({ message: 'File upload failed', error: error.message });
    }
});

module.exports = router;
