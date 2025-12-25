const express = require('express');
const handlers = require('../Controllers/ToursController');
const authController = require('../Controllers/AuthController');
const reviewRouter = require('./ReviewRouter');

const router = express.Router();

// router.param('id', handlers.verifyId);

router.route('/top-5-cheap').get(handlers.topFiveCheap, handlers.getAllTours);

router
  .route('/')
  .get(handlers.getAllTours)
  .post(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    handlers.addTour,
  );

router.route('/get-status').get(handlers.getStatus);

router
  .route('/get-montly-plan/:year')
  .get(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide', 'guide'),
    handlers.montlyPlan,
  );

router
  .route('/tour-within/:distance/center/:latlng/unit/:unit')
  .get(handlers.tourWithin);

router.route('/distances/:latlng/unit/:unit').get(handlers.getDistances);

router
  .route('/:id')
  .get(handlers.getTour)
  .patch(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    handlers.uploadTourPhotos,
    handlers.resizeTourPhotos,
    handlers.updateTour,
  )
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    handlers.deleteTour,
  );

router.use('/:tourId/review', reviewRouter);

module.exports = router;
