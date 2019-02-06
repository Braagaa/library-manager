const express = require('express');
const {Book: Books} = require('../models/');
const R = require('ramda');
const {
    passOrThrow, 
    createErrorNext, 
    whenNotNumber,
    whenValidationError,
    whenNull,
    getErrors
} = require('../modules/validation');

const router = express.Router();

const render = R.invoker(2, 'render');
const redirect = R.invoker(1, 'redirect');
const update = R.invoker(1, 'update');
const destroy = R.invoker(0, 'destroy');

const defaultNum = whenNotNumber(-1);
const addId = R.useWith(R.pipe, [R.always, R.assoc('id')]);

router.get('/', (req, res, next) => {
    return Books.findAll()
        .then(R.objOf('books'))
        .then(R.mergeRight({title: 'Books'}))
        .then(render('index', R.__, res))
        .catch(next);
});

router.get('/new', (req, res) => 
    res.render('new-book', {title: 'New Book'})
);

router.get('/:id', (req, res, next) => {
    Books.findByPk(defaultNum(req.params.id))
        .then(passOrThrow(R.isNil))
        .then(R.applySpec({
            title: R.prop('title'),
            book: R.identity
        }))
        .then(render('update-book', R.__, res))
        .catch(whenNull(
            createErrorNext(['Could not find book.', 400], next)
        ))
        .catch(next);
});

router.post('/new', (req, res, next) => {
    Books.create(req.body)
        .then(R.partial(redirect, ['/', res]))
        .catch(R.pipe(
            R.applySpec({
                title: R.always('New Book'),
                book: R.always(Books.build(req.body)),
                neededAttributes: getErrors
            }),
            render('new-book', R.__, res)
        ))
        .catch(next);
});

router.post('/:id', (req, res, next) => {
    Books.findByPk(defaultNum(req.params.id))
        .then(passOrThrow(R.isNil))
        .then(update(req.body))
        .then(R.partial(redirect, ['/', res]))
        .catch(whenNull(
            createErrorNext(['Could not update book.', 400], next)
        ))
        .catch(whenValidationError(R.pipe(
            R.applySpec({
                title: R.always(req.body.title || 'Update'),
                book: addId(req.body, req.params.id),
                neededAttributes: getErrors
            }),
            render('update-book', R.__, res)
        )))
        .catch(next);
});

router.post('/:id/delete', (req, res, next) => {
    //add a warning to user to indicate later on
    Books.findByPk(defaultNum(req.params.id))
        .then(passOrThrow(R.isNil))
        .then(destroy)
        .then(R.partial(redirect, ['/', res]))
        .catch(whenNull(
            createErrorNext(['Could not delete book.', 400], next)
        ))
        .catch(next);
});

module.exports = router;
