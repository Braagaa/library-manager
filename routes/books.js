const express = require('express');
const {Book} = require('../models/');
const R = require('ramda');

const router = express.Router();

const render = R.invoker(2, 'render');

router.get('/', (req, res) => {
    Book.findAll()
        .then(R.objOf('books'))
        .then(R.mergeRight({title: 'Books'}))
        .then(render('index', R.__, res));
});

router.get('/new', (req, res) => 
    res.render('new-book', {title: 'New Book'})
);

module.exports = router;
