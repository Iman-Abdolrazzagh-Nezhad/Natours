const pug = require('pug');
const path = require('path');
const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');

//handlers
const AppError = require('./utils/appError');
const globalErrorHandler = require('./Controllers/ErrorController');
const toursRouter = require('./Routers/TourRouters');
const usersRouter = require('./Routers/UsersRouters');
const reviewRouter = require('./Routers/ReviewRouter');
const viewRouter = require('./Routers/ViewRouter');

//Starting express
const app = express();

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

///1) GLOBAL MIDDLEWARES
//Server Static files
app.use(express.static(path.join(__dirname, 'public')));

///SETING HTTP SECURITY HEADER
app.use(
  helmet.contentSecurityPolicy({
    useDefaults: true,
    directives: {
      'script-src': [
        "'self'",
        'https://cdnjs.cloudflare.com/ajax/libs/axios/1.11.0/axios.min.js',
      ],
    },
  }),
);

///DEVELOPMENT LOGGING
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

///LIMITER
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many request from this IP, please try again in an hour.',
});
app.use('/api', limiter);

///REQUEST BODY PARSER(reading data from body to req.body)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

///DATA SANITIZER AGAINST NoSQL QUERY INJECTION
app.use(mongoSanitize());

///DATA SANITIZER AGAINST XSS
app.use(xss());

///PREVENT PARAMETER POLUTION IN HTTP REQUEST
app.use(
  hpp({
    whitelist: [
      'duration',
      'maxGroupSize',
      'difficulty',
      'ratingsQuantity',
      'ratingsAverage',
      'price',
    ],
  }),
);

app.use((req, res, next) => {
  console.log('Middleware is online.');

  next();
});

app.use((req, res, next) => {
  req.reqTime = new Date().toISOString();
  // console.log(req.cookies);
  next();
});

//2) ROUTES
app.use('/', viewRouter);
app.use('/api/v1/tours', toursRouter);
app.use('/api/v1/users', usersRouter);
app.use('/api/v1/reviews', reviewRouter);

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find the <${req.originalUrl}> on url`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
