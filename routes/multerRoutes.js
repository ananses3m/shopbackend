import path from 'path';
import express from 'express';
import multer from 'multer';
import cloudinary from '../config/cloudinary.js';
const router = express.Router();

const storage = multer.diskStorage({
    filename(req, file, cb) {
        cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`)
    }
})

function checkFileType(file, cb) {
    const fileTypes = /jpg|jpeg|png/
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = fileTypes.test(file.mimetype);

    if(extname && mimetype) {
        return cb(null, true);
    } else {
        cb('only .jpg, .jpeg or .png images allowed!')
    }
}

const upload = multer({
    storage,
    fileFilter: function(req, file, cb) {
        checkFileType(file, cb);
    }
})

router.post('/', upload.single('image'), async (req, res) => {
    try {
        const result = await cloudinary.uploader.upload(req.file.path, {
            upload_preset: 'store_uploads',
        })
        res.json(result);
    } catch (error) {
        console.error(error);
    }
})

export default router