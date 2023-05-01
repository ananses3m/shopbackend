import asyncHandler from 'express-async-handler';
import cloudinary from '../config/cloudinary.js';
import express from 'express';
const router = express.Router();

router.post('/', asyncHandler(async (req, res) => {
    const fileStr = req.body.imageString;
    const uploadResponse = await cloudinary.uploader.upload(fileStr, {
        upload_preset: 'dev_setups',
    });

    if (uploadResponse) {
        res.status(200).json({
            public_id: uploadResponse.public_id,
            secure_url: uploadResponse.secure_url
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
}))

export default router
