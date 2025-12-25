const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
  console.log(err.name, err.message);
  console.log('uncaught Exception acquired!');

  process.exit(1);
});

//connecting to config file
dotenv.config({ path: './config.env' });

//importing application
const app = require('./app');

//connecting to data base host via mongoose
const db = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD,
);

mongoose
  .connect(db, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  })
  .then(() => console.log('mongoose connected succesfully'));

//defining port and starting the server
const port = process.env.PORT || 3000;

const server = app.listen(port, () => {
  console.log(`Server created succesfuly on ${port}!`);
});

//waiting for any rejected promise
process.on('unhandledRejection', (err) => {
  console.log(err.name, err.message);
  console.log('Unhandled rejection acquired!');

  server.close(() => {
    process.exit(1);
  });
});
