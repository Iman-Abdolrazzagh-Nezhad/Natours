const Tour = require('../Models/TourModel');
const User = require('../Models/UserModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

exports.getOverview = catchAsync(async (req, res, next) => {
  //1)Get tours from database
  const tours = await Tour.find();

  //2)Template building
  //3)Rendering template using data from 1
  res.status(200).render('overview', {
    title: 'Overview',
    tours,
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  //1)getting data from databse
  const tour = await Tour.findOne({ slug: req.params.slug }).populate({
    path: 'reviews',
    fields: 'review rate user',
  });

  if (!tour) {
    return next(new AppError('There is no tour with that name', 404));
  }

  //2)rendering template

  //3)do somthing with data from 1
  res.status(200).render('tour', {
    title: `The ${tour.name}`,
    tour,
  });
});

exports.loginPage = (req, res) => {
  res.status(200).render('login', {
    title: 'Log in to your acount',
  });
};

exports.getAccount = (req, res) => {
  res.status(200).render('account', {
    title: 'Your account',
  });
};

exports.updateUserData = catchAsync(async (req, res, next) => {
  const updatedUser = await User.findByIdAndUpdate(
    req.user.id,
    {
      name: req.body.name,
      email: req.body.email,
    },
    {
      new: true,
      runValidators: true,
    },
  );

  res.status(200).render('account', {
    title: 'Your account',
    user: updatedUser,
  });
});
