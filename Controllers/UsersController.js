const multer = require('multer');
const sharp = require('sharp');
const User = require('../Models/UserModel');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./controllerFactory');

// const multerStroage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/users');
//   },
//   filename: (req, file, cb) => {
//     const extention = file.mimetype.split('/')[1];
//     const date = Date.now();

//     cb(null, `user-${req.user.id}-${date}.${extention}`);
//   },
// });

const multerStroage = multer.memoryStorage();

const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(
      new AppError('No image uploaded. Please upload an image file.', 400),
      false,
    );
  }
};

const upload = multer({
  storage: multerStroage,
  fileFilter: multerFilter,
});

exports.uploadUserPhoto = upload.single('photo');

exports.resizeUserPhoto = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next;
  }

  const date = Date.now();

  req.file.filename = `user-${req.user.id}-${date}.jpeg`;

  await sharp(req.file.buffer)
    .resize(500, 500)
    .toFormat('jpeg')
    .jpeg({ quality: 90 })
    .toFile(`public/img/users/${req.file.filename}`);

  next();
});

const filterObj = (obj, ...includeFileds) => {
  const newObj = {};

  Object.keys(obj).forEach((el) => {
    if (includeFileds.includes(el)) {
      newObj[el] = obj[el];
    }
  });

  return newObj;
};

exports.updateMe = catchAsync(async (req, res, next) => {
  //1) creat an error for attempt to change the password
  if (req.body.password || req.body.confirmPassword) {
    return next(
      new AppError(
        'You cannot change password through here. Use /updatePassword on URL.',
        401,
      ),
    );
  }
  //2) update user documents and send response

  const filteredBody = filterObj(req.body, 'name', 'email');
  if (req.file) {
    filteredBody.photo = req.file.filename;
  }

  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    user: updatedUser,
  });
});

exports.getAllUsers = factory.getAll(User);

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getOneUser = factory.getOne(User);

exports.updateUser = factory.updateOne(User);

exports.deleteUser = factory.deleteOne(User);

exports.addUser = (req, res) => {
  res.status(500).json({
    status: 'failed',
    massage: 'response will not be coded! Please use signups',
  });
};

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;

  next();
};
