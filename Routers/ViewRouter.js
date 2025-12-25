const express = require('express');
const viewController = require('../Controllers/ViewController');
const authController = require('../Controllers/AuthController');

const router = express.Router();

router.get('/', authController.logedIn, viewController.getOverview);

router.get('/tour/:slug', authController.logedIn, viewController.getTour);

router.get('/login', authController.logedIn, viewController.loginPage);

router.get('/me', authController.protect, viewController.getAccount);

router.post(
  '/submit-new-data',
  authController.protect,
  viewController.updateUserData,
);

module.exports = router;
