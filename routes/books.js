const express = require('express');
const {Book: Books} = require('../models/');
const R = require('ramda');
const {
    passOrThrow, 
    createErrorNext, 
    isStringNumber
} = require('../modules/validation');

const router = express.Router();

const render = R.invoker(2, 'render');
const redirect = R.invoker(1, 'redirect');

router.get('/', (req, res) => {
    Books.findAll()
        .then(R.objOf('books'))
        .then(R.mergeRight({title: 'Books'}))
        .then(render('index', R.__, res))
});

router.get('/new', (req, res) => 
    res.render('new-book', {title: 'New Book'})
);

router.get('/:id', (req, res, next) => {
    if (isStringNumber(req.params.id)) {
        Books.findByPk(req.params.id)
            .then(passOrThrow(R.isNil))
            .then(R.applySpec({
                title: R.prop('title'),
                book: R.identity
            }))
            .then(render('update-book', R.__, res))
            .catch(createErrorNext(['Could not find book.', 400], next));
    } else {
        createErrorNext(['Not an ID book number.', 400], next)();
    }
});

module.exports = router;
