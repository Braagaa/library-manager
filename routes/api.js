const express = require('express');
const {Op} = require('sequelize');
const {Book: Books} = require('../models/');
const {renameKeys, addProps, numberOfPages} = require('../modules/utils');
const R = require('ramda');

const router = express.Router();

const json = R.invoker(1, 'json');

const dataOkay = R.pipe(R.objOf('data'), R.mergeRight({status: 'ok'}));
const renameRows = renameKeys({rows: 'books'});

router.get('/', (req, res, next) => {
    const pag = req.app.get('paginationNum');
    Books.findAndCountAll({limit: pag})
        .then(renameRows)
        .then(addProps({lastPage: numberOfPages(pag)}))
        .then(dataOkay)
        .then(json(R.__, res))
        .catch(next);
});

router.get('/:page', (req, res, next) => {
    const pag = req.app.get('paginationNum');
    Books.findAndCountAll({
        limit: pag, 
        offset: pag * (parseFloat(req.params.page) - 1)
    })
        .then(renameRows)
        .then(addProps({lastPage: numberOfPages(pag)}))
        .then(dataOkay)
        .then(json(R.__, res))
        .catch(next);
});

router.get('/:page/:title', (req, res, next) => {
    const pag = req.app.get('paginationNum');
    const title = req.params.title;
    const searchObj = {[Op.like]: `%${title}%`};
    Books.findAndCountAll({
        where: {
            [Op.or]: R.map(
                R.objOf(R.__, searchObj), 
                ['title', 'author', 'genre', 'year']
            )
        },
        limit: pag,
        offset: pag * (parseFloat(req.params.page) - 1)
    })
        .then(renameRows)
        .then(addProps({lastPage: numberOfPages(pag)}))
        .then(dataOkay)
        .then(json(R.__, res))
        .catch(next);
});

module.exports = router;
