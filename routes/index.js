const {readdirSync} = require('fs');
const path = require('path');
const R = require('ramda');

const join = R.curryN(2, path.join);
const transformObj = R.converge(
    R.pair, 
    [R.slice(0, -3), R.pipe(join(__dirname), require)]
);

const routes = R.pipe(
    readdirSync,
    R.filter(R.pipe(R.slice(-3, Infinity), R.equals('.js'))),
    R.filter(R.complement(R.equals('index.js'))),
    R.map(transformObj),
    R.fromPairs,
)(__dirname);

module.exports = routes;
