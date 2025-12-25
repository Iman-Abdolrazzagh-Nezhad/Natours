const express = require('express');
const handlers = require('../Controllers/UsersController');
const authController = require('../Controllers/AuthController');
const usersController = require('../Controllers/UsersController');

const router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.get('/logout', authController.logout);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);

//Protected for Berear Token
router.use(authController.protect);

router
  .route('/Me')
  .get(usersController.getMe, usersController.getOneUser)
  .delete(usersController.deleteMe)
  .patch(
    usersController.uploadUserPhoto,
    usersController.resizeUserPhoto,
    usersController.updateMe,
  );

router.patch('/updateMyPassword', authController.updatePassword);

//Restricted only to admin
router.use(authController.restrictTo('admin'));

router.route('/').get(handlers.getAllUsers).post(handlers.addUser);

router
  .route('/:id')
  .get(handlers.getOneUser)
  .patch(handlers.updateUser)
  .delete(handlers.deleteUser);

module.exports = router;
