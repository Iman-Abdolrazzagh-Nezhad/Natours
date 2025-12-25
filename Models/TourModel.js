const mongoose = require('mongoose');
// const validator = require('validator');
const slugify = require('slugify');

const tourschema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name.'],
      unique: true,
      trim: true,
      minlength: [10, 'Tour name must contain more than 10 characters'],
      maxlength: [49, 'Tour name must contain less than 40 characters'],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration.'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'A tour must have a maximum group size.'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have a difficulty.'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulity is either: easy, medium or difficult.',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Ratings Average must be more than 1'],
      max: [5, 'Ratings Average must be less than 5'],
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price.'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) should be below regular price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a summary.'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image.'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: {
        type: String,
      },
      description: {
        type: String,
      },
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: {
          type: String,
        },
        description: {
          type: String,
        },
        day: {
          type: Number,
        },
      },
    ],
    guides: [
      {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

tourschema.index({ price: 1, ratingsAverage: -1 });
tourschema.index({ slug: 1 });
tourschema.index({ startLocation: '2dsphere' });

tourschema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

tourschema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

//DOCUMENT MIDDLEWARES
tourschema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// tourschema.pre('save', async function (next) {
//   const guidesPromise = this.guides.map(async (id) => await User.findById(id));

//   this.guides = await Promise.all(guidesPromise);
//   next();
// });

// tourschema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

//QUERY MIDDLEWARES
tourschema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });

  this.start = Date.now();
  next();
});

tourschema.pre(/^find/, function (next) {
  this.populate({
    path: 'guides',
    select: '-__v -passwordChangedAt',
  });

  next();
});

tourschema.post(/^find/, function (docs, next) {
  console.log(
    `Tour query middleware took ${Date.now() - this.start} milliseconds!`,
  );

  next();
});

//AGGREGATION MIDDLEWARW
// tourschema.pre('aggregate', function (next) {
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });

//   next();
// });

const Tour = mongoose.model('Tour', tourschema);

module.exports = Tour;
