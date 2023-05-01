import asyncHandler from 'express-async-handler';
import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';
import sendEmail from '../utils/sendEmails.js';
import jwt from 'jsonwebtoken';

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
})

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await User.create({
        name,
        email,
        password
    })

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            token: generateToken(user._id),
        })
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
})

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);
    // console.log('Auth token: ', req.headers.authorization)

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
        })
    } else {
        res.status(404);
        throw new Error('User not found');
    }
})

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name
        user.email = req.body.email || user.email
        if (req.body.password) {
            user.password = req.body.password
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin,
            token: generateToken(updatedUser._id),
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
})

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
    const users = await User.find({});
    res.json(users);
})

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        await user.remove();
        res.json({ message: 'User deleted' })
    } else {
        res.status(404);
        throw new Error('User not found');
    }
})

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).select('-password');

    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
})

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
const updateUser = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id);

    if (user) {
        user.name = req.body.name || user.name
        user.email = req.body.email || user.email
        user.isAdmin = req.body.isAdmin

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
})

// @desc    Auth user & send email
// @route   GET /api/users/resetpassword
// @access  Public
const getUserByEmail = asyncHandler(async (req, res) => {
    const { email } = req.body;

    const validateEmail = (theEmail) => {
        const re = /^\S+@\S+$/;
        return re.test(theEmail);
    }

    if (email === '' || !validateEmail(email)) {
        res.status(500);
        throw new Error('Please enter a valid email address');
    }

    const user = await User.findOne({ email });

    if (user) {
        const id = user._id
        const mySecret = `${user.password}-${user.createdAt}`;

        const token = jwt.sign({ id }, mySecret, { expiresIn: '30s' });
        const decoded = jwt.verify(token, mySecret);


        // <p>Click this <a href="http://localhost:3000/reset/${decoded.id}/${token}">link</a> to set a new password</p>

        sendEmail({
            subject: "Ananses3m Wear account password reset",
            html: `
                <p>Click this <a href="https://ananses3m.herokuapp.com/reset/${decoded.id}/${token}">link</a> to set a new password</p>
                <strong><h1>Please note that this link expires in 30 seconds</h1></strong>
            `,
            to: email,
            from: process.env.EMAIL
        });

        res.status(200).json({
            message: `Reset link sent to ${email}`,
            token: token
        });
    } else {
        res.status(404);
        throw new Error('No account with this email address');
    }
})

// @desc    Auth user & reset password
// @route   PUT /api/users/reset/:id/:token
// @access  Private
const resetUserPassword = asyncHandler(async (req, res) => {
    const user = await User.findById(req.body.id);

    if (user) {
        user.password = req.body.password

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin,
            token: generateToken(updatedUser._id),
        });
    } else {
        res.status(404);
        throw new Error('User not found. Please try again');
    }
})


export {
    authUser,
    getUserProfile,
    registerUser,
    updateUserProfile,
    getUsers,
    deleteUser,
    getUserById,
    updateUser, getUserByEmail, resetUserPassword
};