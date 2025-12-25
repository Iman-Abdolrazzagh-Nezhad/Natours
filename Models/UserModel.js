const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

//field image is removed from database
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please enter you name!'],
  },
  password: {
    type: String,
    required: [true, 'Please enter your password!'],
    minlength: 8,
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, 'Please confirm your password!'],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same!',
    },
  },
  email: {
    type: String,
    required: [true, 'Please enter you Email!'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'please provide a valid Email'],
  },
  image: {
    type: String,
  },
  passwordChangedAt: {
    type: Date,
  },
  role: {
    type: String,
    enum: ['admin', 'user', 'lead-guide', 'guide'],
    default: 'user',
  },
  passwordResetToken: {
    type: String,
  },
  photo: {
    type: String,
    default: 'default.jpg',
  },
  passwordResetExpiers: {
    type: Date,
  },
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre(/^find/, function (next) {
  this.start = Date.now();
  next();
});

userSchema.pre(/^find/, function (next) {
  this.find({ active: { $ne: false } });

  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  this.confirmPassword = undefined;

  next();
});

userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword,
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.passwordIntact = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changeTime = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

    return JWTTimestamp < changeTime;
  }

  return false;
};

userSchema.methods.creatPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpiers = Date.now() + 10 * 60 * 1000;
  console.log(resetToken, this.passwordResetToken);
  return resetToken;
};

userSchema.post(/^find/, function (docs, next) {
  console.log(
    `User query middleware took ${Date.now() - this.start} milliseconds!`,
  );

  next();
});
const User = mongoose.model('User', userSchema);

module.exports = User;
