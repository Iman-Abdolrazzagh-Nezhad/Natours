// const catchAsync = require('../utils/catchAsync');
const Review = require('../Models/ReviewModel');
const factory = require('./controllerFactory');

exports.setParameters = (req, res, next) => {
  if (!req.body.user) req.body.user = req.user.id;
  if (!req.body.tour) req.body.tour = req.params.tourId;

  next();
};

exports.addReview = factory.createOne(Review);

exports.getAllReviews = factory.getAll(Review);

exports.getReview = factory.getOne(Review);

exports.updateReview = factory.updateOne(Review);

exports.deleteReview = factory.deleteOne(Review);
