const mongoose = require('mongoose');
const Tour = require('./TourModel');

//review, rate, Userid, Tourid, CreatedAt

const reviewschema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'A review must have a context.'],
    },
    rate: {
      type: Number,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A review must belong to a user.'],
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'A review must belong to a tour.'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

reviewschema.index({ tour: 1, user: 1 }, { unique: true });

reviewschema.pre(/^find/, function (next) {
  this.start = Date.now();
  next();
});

reviewschema.pre(/^find/, function (next) {
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

reviewschema.post(/^find/, function (docs, next) {
  console.log(
    `Review query middleware took ${Date.now() - this.start} milliseconds!`,
  );

  next();
});

reviewschema.statics.calculateAverageRating = async function (tourId) {
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        quantityRating: { $sum: 1 },
        averageRating: { $avg: '$rate' },
      },
    },
  ]);

  console.log(stats);

  if (stats.length > 0) {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: stats[0].quantityRating,
      ratingsAverage: stats[0].averageRating,
    });
  } else {
    await Tour.findByIdAndUpdate(tourId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5,
    });
  }
};

reviewschema.post('save', function () {
  //this points to current review
  this.constructor.calculateAverageRating(this.tour);
});

reviewschema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  console.log(this.r);
  next();
});

reviewschema.post(/^findOneAnd/, async function () {
  await this.r.constructor.calculateAverageRating(this.r.tour);
});

const Review = mongoose.model('Review', reviewschema);

module.exports = Review;
