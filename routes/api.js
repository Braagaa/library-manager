const express = require('express');
const {Op} = require('sequelize');
const {Book: Books} = require('../models/');
const R = require('ramda');

const router = express.Router();

const json = R.invoker(1, 'json');

const dataOkay = R.pipe(R.objOf('data'), R.mergeRight({status: 'ok'}));

router.get('/', (req, res, next) => {
    Books.findAll()
        .then(dataOkay)
        .then(json(R.__, res));
});

router.get('/:title', (req, res, next) => {
    Books.findAll({
            where: {
                title: {
                    [Op.like]: `%${req.params.title}%`
                }
            },
    })
        .then(dataOkay)
        .then(json(R.__, res));
});

module.exports = router;
