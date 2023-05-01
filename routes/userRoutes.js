import express from 'express';
const router = express.Router();
import {
    authUser,
    registerUser,
    getUserProfile,
    updateUserProfile,
    getUsers,
    deleteUser,
    getUserById,
    updateUser,
    getUserByEmail,
    resetUserPassword
} from '../controllers/userController.js';
import { protect, protectR, admin } from '../middleware/authMiddleware.js';

router.route('/').post(registerUser).get(protect, admin, getUsers);
router.post('/login', authUser);
router.post('/resetpassword', getUserByEmail);
router.route('/reset/:id').put(protectR, resetUserPassword);
router.route('/profile').get(protect, getUserProfile).put(protect, updateUserProfile);
router
.route('/:id')
.delete(protect, admin, deleteUser)
.get(protect, admin, getUserById)
.put(protect, admin, updateUser);

export default router;
