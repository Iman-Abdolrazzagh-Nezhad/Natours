const express = require('express');
const authController = require('../Controllers/AuthController');
const reviewController = require('../Controllers/ReviewsController');

const router = express.Router({ mergeParams: true });

// /api/v1/reviews
// /api/v1/tours/:tourId/review

router.use(authController.protect);

router
  .route('/')
  .get(reviewController.getAllReviews)
  .post(
    authController.restrictTo('user'),
    reviewController.setParameters,
    reviewController.addReview,
  );

router
  .route('/:id')
  .get(reviewController.getReview)
  .delete(
    authController.restrictTo('admin', 'user'),
    reviewController.deleteReview,
  )
  .patch(
    authController.restrictTo('admin', 'user'),
    reviewController.updateReview,
  );

module.exports = router;
