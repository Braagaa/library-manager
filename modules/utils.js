const R = require('ramda');

const firstLetterCapital = R.pipe(R.head, R.toUpper);

const capitalize = R.converge(R.concat, [firstLetterCapital, R.slice(1, Infinity)]);

const renameKeys = R.curry((keysMap, obj) =>
  R.reduce((acc, key) => R.assoc(keysMap[key] || key, obj[key], acc), {}, R.keys(obj))
);

const addProps = R.pipe(
    R.applySpec,
    R.append(R.__, [R.identity]),
    R.converge(R.mergeRight)
);

const numberOfPages = num => obj => Math.ceil(obj.count / num);

module.exports = {capitalize, renameKeys, addProps, numberOfPages};
