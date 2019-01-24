const R = require('ramda');

const firstLetterCapital = R.pipe(R.head, R.toUpper);

const capitalize = R.converge(R.concat, [firstLetterCapital, R.slice(1, Infinity)]);

module.exports = {capitalize};
