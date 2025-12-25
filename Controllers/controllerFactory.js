const slugify = require('slugify');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);

    if (!doc) {
      return next(new AppError('no document found with that ID', 404));
    }

    res.status(204).json({
      status: 'succesful',
      data: null,
    });
  });

exports.updateOne = (Model) =>
  catchAsync(async (req, res, next) => {
    //Editing the slug propert(temperorly jusy for Tour)
    if (req.body.name && Model.modelName === 'Tour') {
      req.body.slug = slugify(req.body.name, { lower: true, strict: true });
    }

    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!doc) {
      return next(new AppError('no Tour found with that ID', 404));
    }

    res.status(200).json({
      status: 'succesful',
      data: {
        data: doc,
      },
    });
  });

exports.createOne = (Model) =>
  catchAsync(async (req, res, next) => {
    const newData = await Model.create(req.body);

    res.status(201).json({
      status: 'successful',
      data: {
        data: newData,
      },
    });
  });

exports.getOne = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    let query = Model.findById(req.params.id);

    if (popOptions) {
      query = query.populate(popOptions);
    }

    const doc = await query;

    if (!doc) {
      return next(new AppError('no document found with that ID', 404));
    }

    res.status(200).json({
      status: 'successful',
      data: {
        data: doc,
      },
    });
  });

exports.getAll = (Model) =>
  catchAsync(async (req, res) => {
    let filter = {};

    if (req.params.tourId) filter = { tour: req.params.tourId };

    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limit()
      .paginate();

    const doc = await features.query;

    //RETURNING RESPONSE
    res.status(200).json({
      status: 'succesful',
      resultNumber: doc.length,
      data: {
        data: doc,
      },
    });
  });
