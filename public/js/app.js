const {fromEvent, from, timer, of} = require('rxjs'); 
const {flatMap, map, filter, mapTo, reduce, debounce, pluck, tap} = require('rxjs/operators');
const R = require('ramda');
const axios = require('axios');

const searchbar = document.getElementById('search');
const backpage = document.querySelector('.pagination__back');
const forwardpage = document.querySelector('.pagination__forward');
const potentialPage = document.querySelector('.pagination__input input');
const titleHeader = document.getElementById('title-header');
const booksTable = document.getElementById('books');

const json = R.invoker(0, 'json');
const toggle = R.invoker(1, 'toggle');

const targetValueLowerCase = R.pipe(R.path(['target', 'value']), R.toLower);
const jsonTodata = R.pipe(json, R.prop('data'));

//DOM function
const createRow = ({id, title, author, genre, year}) => {
    return `
        <tr>
            <td>
                <a href="/books/${id}">${title}</a>
            </td>
            <td>${author}</td>
            <td>${genre}</td>
            <td>${year}</td>
        </tr>`;
};

const highlightUrl = searchValue => book => R.evolve({
    title: R.replace(
        new RegExp(`(${searchValue})`, 'ig'), 
        '<span class="highlight">$1</span>'
    )
})(book);

const htmlRows = searchValue => books => R.pipe(
    R.map(highlightUrl(searchValue)),
    R.map(createRow), 
    R.join('')
)(books);

fromEvent(searchbar, 'keyup').pipe(
    debounce(R.partial(timer, [800])),
    map(targetValueLowerCase),
    flatMap(searchValue => {
        return of(searchValue).pipe(
            map(R.concat('/api/')),
            flatMap(axios),
            pluck('data', 'data'),
            map(htmlRows(searchValue)),
        );
    })
)
.subscribe(htmlBooks => {
    booksTable.innerHTML = htmlBooks;
});

fromEvent(backpage, 'click').pipe(
    mapTo(potentialPage),
    map(R.prop('value'))
)
.subscribe(console.log);

fromEvent(titleHeader, 'click').pipe(
    map(R.prop('target')),
    tap(R.pipe(R.prop('classList'), toggle('desc')))
)
.subscribe(console.log);
