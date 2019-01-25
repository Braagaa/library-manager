const R = require('ramda');
const {capitalize} = require('./utils');

const throww = val => {
    throw val;
}

const passOrThrow = R.when(R.__, throww);

const createError = R.curry((message, status) => {
    const err = new Error(message);
    err.status = status;
    return err;
});

const createErrorNext = R.useWith(
    R.pipe, 
    [R.partial(createError), R.identity]
);

const isStringNumber = R.complement(isNaN);

const whenOrThrow = R.ifElse(R.__, R.__, throww);
const whenValidationError = whenOrThrow(
    R.propEq('name', 'SequelizeValidationError'), 
);
const whenNull = whenOrThrow(R.isNil);

const getErrors = R.pipe(
    R.prop('errors'), 
    R.map(R.prop('path')), 
    R.map(capitalize)
);

module.exports = {
    passOrThrow, 
    createErrorNext, 
    isStringNumber, 
    whenValidationError,
    whenNull,
    getErrors
};
