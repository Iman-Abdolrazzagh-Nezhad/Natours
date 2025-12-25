const AppError = require('../utils/appError');

const validationErrorHandler = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);

  const message = `Invalid inputs. ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const duplicatedFiledsHandlerDB = (err) => {
  const value = err.keyValue.name;

  const message = `Duplicated filed value: {"${value}"} . Please use another value.`;
  return new AppError(message, 400);
};

const castErrorHandlerDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;

  return new AppError(message, 400);
};

const invalidJWTHandler = () =>
  new AppError('Invalid token, Please log in again.', 401);

const expiredJWTHandler = () =>
  new AppError('Token expired, Please log in again.', 401);

const sendErrorDev = (req, res, err) => {
  if (req.originalUrl.startsWith('/api')) {
    res.status(err.statusCode).json({
      status: err.status,
      stack: err.stack,
      message: err.message,
      error: err,
    });
  } else {
    res.status(err.statusCode).render('error', {
      title: 'somthing went wrong!',
      msg: err.message,
    });
  }
};

const sendErrorprod = (req, res, err) => {
  //sending error for API
  if (req.originalUrl.startsWith('/api')) {
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
      });
    }
    //preventing leak of data in case of an unkown error
    return res.status(500).json({
      status: 'fail',
      message: 'Something went very badly wrong!',
    });
  }
  //sending error for rendered page
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message,
    });
  }
  //preventing leak of data in case of an unkown error
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Something went very badly wrong!',
  });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(req, res, err);
  } else if (process.env.NODE_ENV === 'production') {
    let error = { ...err };
    error.message = err.message;

    if (error.name === 'CastError') error = castErrorHandlerDB(error);
    if (error.code === 11000) error = duplicatedFiledsHandlerDB(error);
    if (
      error._message === 'Tour validation failed' ||
      error._message === 'User validation failed'
    )
      error = validationErrorHandler(error);
    if (error.name === 'JsonWebTokenError') error = invalidJWTHandler();
    if (error.name === 'TokenExpiredError') error = expiredJWTHandler();

    sendErrorprod(req, res, error);
  }
  next();
};
