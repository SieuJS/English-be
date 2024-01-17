const express = require ('express');
const {check} = require('express-validator')
const router = express.Router();

const fileUpload = require('../middlewares/file-upload')
const {getUsers, createUser, signInHandler} = require('../controllers/user-controller')

router.get('/', getUsers);
router.post('/signup',
fileUpload.single('image'),
    [
    check('username').not().isEmpty(),
    check('email').normalizeEmail().isEmail(),
    check('password').isLength({min: 6}),
], createUser);
router.post('/signin', signInHandler);

module.exports = router;