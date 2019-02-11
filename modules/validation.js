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

//creates a new Error Object and sends it to a send function (next function)
const createErrorNext = R.useWith(
    R.pipe, 
    [R.partial(createError), R.identity]
);

//when value sent cant be converted to a number call the sent function
const whenNotNumber = R.useWith(
    R.call, 
    [R.pipe(R.always, R.unless(isNumber)), R.identity]
);

//needs a predicate and successful function
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
