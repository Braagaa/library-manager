const R = require('ramda');

const throww = val => {
    throw val;
}

const passOrThrow = R.when(R.__, throww);

const createError = R.curry((message, status) => {
    const err = new Error(message);
    err.status = status;
    return err;
});

const createErrorNext = R.useWith(R.pipe, [R.partial(createError), R.identity]);

const isStringNumber = R.complement(isNaN);

module.exports = {passOrThrow, createErrorNext, isStringNumber};
