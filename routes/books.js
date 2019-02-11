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
const {renameKeys, addProps, numberOfPages} = require('../modules/utils');

const router = express.Router();

const render = R.invoker(2, 'render');
const redirect = R.invoker(1, 'redirect');
const update = R.invoker(1, 'update');
const destroy = R.invoker(0, 'destroy');

const defaultNum = whenNotNumber(-1);
const addId = R.useWith(R.pipe, [R.always, R.assoc('id')]);

router.get('/', (req, res, next) => {
    const paginationNum = req.app.get('paginationNum');
    return Books.findAndCountAll({limit: paginationNum})
        //{rows: []} -> {books: []}
        .then(renameKeys({rows: 'books'}))
        //{books: []} -> {books: [], lastPage: Number}
        .then(addProps({lastPage: numberOfPages(paginationNum)}))
        //{books: [], lastPage: Number} -> 
        //{books: [], lastPage: Number, title: String, currentPage: Number}
        .then(R.mergeRight({title: 'Books', currentPage: 1}))
        .then(render('index', R.__, res))
        .catch(next);
});

router.get('/new', (req, res) => 
    res.render('new-book', {title: 'New Book'})
);

router.get('/:id', (req, res, next) => {
    Books.findByPk(defaultNum(req.params.id))
        //if result is null throw null or pass successful Book Model Obj
        .then(passOrThrow(R.isNil))
        //{Book} -> {title: String, book: {Book}}
        .then(R.applySpec({
            title: R.prop('title'),
            book: R.identity
        }))
        .then(render('update-book', R.__, res))
        //when value is null create error Object and send it to next
        .catch(whenNull(
            createErrorNext(['Could not find book.', 400], next)
        ))
        .catch(next);
});

router.post('/new', (req, res, next) => {
    Books.create(req.body)
        .then(R.partial(redirect, ['/', res]))
        .catch(R.pipe(
            //null -> {title: String, book: {}, neededAttributes: []}
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
    //defaultNum checks if req.params.id can be converted to a number, if
    //it cannot, a default value of -1 is used as an argument instead
    Books.findByPk(defaultNum(req.params.id))
        //if result is null throw null or pass successful Book Model Obj
        .then(passOrThrow(R.isNil))
        //update the Book Model with new data from req.body
        .then(update(req.body))
        .then(R.partial(redirect, ['/', res]))
        //when value is null create error Object and send it to next or
        //rethrow it again
        .catch(whenNull(
            createErrorNext(['Could not update book.', 400], next)
        ))
        //when value is SequelizeValidationError or rethrow
        .catch(whenValidationError(R.pipe(
            //{SequelizeValidationError} -> 
            //{title: String, book: {}, neededAttributes: []}
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
    Books.findByPk(defaultNum(req.params.id))
        //if result is null throw null or pass successful Book Model Obj
        .then(passOrThrow(R.isNil))
        //calls on Book Model destroy method
        .then(destroy)
        .then(R.partial(redirect, ['/', res]))
        //when value is null create error Object and send it to next or
        //rethrow it again
        .catch(whenNull(
            createErrorNext(['Could not delete book.', 400], next)
        ))
        .catch(next);
});

module.exports = router;
