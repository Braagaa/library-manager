const R = require('ramda');
const isNumber = require('is-number');
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

const whenNotNumber = R.useWith(
    R.call, 
    [R.pipe(R.always, R.unless(isNumber)), R.identity]
);

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
    whenNotNumber,
    whenValidationError,
    whenNull,
    getErrors
};
