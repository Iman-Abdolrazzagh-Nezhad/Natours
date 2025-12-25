const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const catchAsync = require('../utils/catchAsync');
const User = require('../Models/UserModel');
const AppError = require('../utils/appError');
const Email = require('../utils/email');

const creatToken = (id) => {
  const token = jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  return token;
};

const creatAndSendToken = (user, statusCode, res) => {
  const token = creatToken(user._id);

  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'Production') {
    cookieOptions.secure = true;
  }

  res.cookie('jwt', token, cookieOptions);

  //Removing password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    name: req.body.name,
    email: req.body.email,
    password: req.body.password,
    confirmPassword: req.body.confirmPassword,
    image: req.body.image,
    passwordChangedAt: req.body.passwordChangedAt,
    role: req.body.role,
  });

  const url = `${req.protocol}://${req.get('host')}/me`;
  await new Email(newUser, url).sendWelcome();

  creatAndSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { email } = req.body;
  const { password } = req.body;

  //1) check password and email  existanse
  if (!email || !password) {
    return next(new AppError('Please provid an email and a password.', 400));
  }

  //2) verify password and email
  const user = await User.findOne({ email }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  //3) sending token
  creatAndSendToken(user, 200, res);
});

exports.logout = catchAsync(async (req, res, next) => {
  const cookieOptions = {
    expires: new Date(Date.now() + 10),
    httpOnly: true,
  };

  res.cookie('jwt', 'GoBackToYourOwnLamPesht', cookieOptions);

  res.status(200).json({
    status: 'success',
  });
});

exports.protect = catchAsync(async (req, res, next) => {
  //1)Getting the token and check if it's there
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }

  if (!token) {
    return next(
      new AppError('You are not logged in. Please login to access.', 401),
    );
  }
  //2)Verification token

  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3)Check if user still exists

  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exists.', 401),
    );
  }

  //4)Check if user changed password after the token was issued

  if (currentUser.passwordIntact(decoded.iat)) {
    return next(
      new AppError('User recently changed password. Please log in again.', 401),
    );
  }

  req.user = currentUser;
  res.locals.user = currentUser;
  next();
});

exports.logedIn = async (req, res, next) => {
  try {
    if (req.cookies.jwt) {
      const decoded = await promisify(jwt.verify)(
        req.cookies.jwt,
        process.env.JWT_SECRET,
      );

      const currentUser = await User.findById(decoded.id);

      if (!currentUser) {
        return next();
      }

      if (currentUser.passwordIntact(decoded.iat)) {
        return next();
      }

      res.locals.user = currentUser;
      return next();
    }
  } catch {
    return next();
  }
  next();
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You are not authorizied to perform this action', 403),
      );
    }
    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  //1) find user by the given email address

  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('There is no user with email address', 404));
  }

  //2) generate the random reset token

  const resetToken = user.creatPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  //3) send it to user email address

  try {
    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;

    await new Email(user, resetURL).sendPasswordReset();

    res.status(200).json({
      status: 'success',
      message: 'token sent to email successfuly',
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordResetExpiers = undefined;

    await user.save({ validateBeforeSave: false });

    return next(
      new AppError(
        'There has been an issuse sending the email, Please try again.',
        500,
      ),
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  //1) find user by given token in URL

  const hashedPasswordResetToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedPasswordResetToken,
    passwordResetExpiers: { $gt: Date.now() },
  });
  //2) reset password if such user exists

  if (!user) {
    return next(new AppError('Token is invalid or has expired!', 400));
  }

  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpiers = undefined;

  await user.save();

  //3) reset passwordChangedAt property for user
  //4) sending JWT and loging the user in
  creatAndSendToken(user, 200, res);
});

exports.updatePassword = catchAsync(async (req, res, next) => {
  //1) find the user via matching id in req.user
  const user = await User.findById(req.user.id).select('+password');

  //2) check if the inputed current password is correct
  if (!(await user.correctPassword(req.body.currentPassword, user.password))) {
    return next(new AppError('Your current password is wrong!', 401));
  }

  //3) update the password
  user.password = req.body.password;
  user.confirmPassword = req.body.confirmPassword;
  await user.save();

  //4) loging the user in and sending the JWT
  creatAndSendToken(user, 200, res);
});
