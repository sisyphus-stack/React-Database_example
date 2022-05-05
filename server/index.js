/***INITIALIZE SERVICES using node.js***/

//import express API for HTTP requests
const express = require('express');

//impprt cors API to allow FETCH from localhost
const cors = require('cors');

//initialize monk API for mongodb interface
const monk = require('monk');

//initialize express to app variable
const app = express();

//create database_example in mongodb using monk API
const db = monk('localhost/database_example');

//get database_1 collection
const mews = db.get('database_1');

//initialize cors using express app
app.use(cors());

//initialize json using express app
app.use(express.json());

//When accessing http://localhost:5000 returns json message: 'Meower! 😹 🐈'
app.get('/', (req, res) => {
  res.json({
    message: 'Meower! 😹 🐈'
  });
});

//Pulls prior messages from database_1 for displaying onto index.html
//(under "mew" div)
app.get('/database_1', (req, res, next) => {
  let { skip = 0, limit = 5, sort = 'desc' } = req.query;
  skip = parseInt(skip) || 0;
  limit = parseInt(limit) || 5;

  skip = skip < 0 ? 0 : skip;
  limit = Math.min(50, Math.max(1, limit));

  Promise.all([
    mews
      .count(),
    mews
      .find({}, {
        skip,
        limit,
        sort: {
          created: sort === 'desc' ? -1 : 1
        }
      })
  ])
    .then(([ total, mews ]) => {
      res.json({
        mews,
        meta: {
          total,
          skip,
          limit,
          has_more: total - (skip + limit) > 0,
        }
      });
    }).catch(next);
});

//Checks to see if message meets parameters
function isValidMew(mew) {
  return mew.content && mew.content.toString().trim() !== '' && mew.content.toString().trim().length <= 140;
}

//Creates new message to submit to database
const createMew = (req, res, next) => {
  if (isValidMew(req.body)) {
    const mew = {
      content: req.body.content.toString().trim(),
      created: new Date()
    };

    mews
      .insert(mew)
      .then(createdMew => {
        res.json(createdMew);
      }).catch(next);
  } else {
    res.status(422);
    res.json({
      message: 'Hey! Content are required! Content cannot be longer than 140 characters.'
    });
  }
};

//Posts new message to http://localhost:5000/database_1 
app.post('/database_1', createMew);

//Throws error message
app.use((error, req, res, next) => {
  res.status(500);
  res.json({
    message: error.message
  });
});

//Listens on port 5000
app.listen(5000, () => {
  console.log('Listening on http://localhost:5000');
});
