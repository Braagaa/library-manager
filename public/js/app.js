const {fromEvent, from, timer, of} = require('rxjs'); 
const {flatMap, map, filter, mapTo, debounce, pluck, tap} = require('rxjs/operators');
const isNumber = require('is-number');
const R = require('ramda');
const axios = require('axios');

const searchbar = document.getElementById('search');
const backpage = document.querySelector('.pagination__back');
const forwardpage = document.querySelector('.pagination__forward');
const potentialPage = document.querySelector('.pagination__input input');
const titleHeader = document.getElementById('title-header');
const booksTable = document.getElementById('books');
const pagesCount = document.getElementById('pages');

const json = R.invoker(0, 'json');
const toggle = R.invoker(1, 'toggle');

const targetValueLowerCase = R.pipe(R.path(['target', 'value']), R.toLower);
const valueLowerCase = R.pipe(R.prop('value'), R.toLower);
const jsonTodata = R.pipe(json, R.prop('data'));
const calls = R.zipWith(R.call);

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

const getLastpageValue = R.pipe(
    R.prop('textContent'),
    R.split(' '),
    R.nth(1),
    parseFloat
);

const addSearchValueAsPair = R.pipe(
    R.pair(searchbar), 
    R.adjust(0, valueLowerCase)
);

const pageCountValidation = countElement => num =>
R.pipe(
    getLastpageValue,
    R.clamp(1, R.__, num)
)(countElement);

fromEvent(searchbar, 'keyup').pipe(
    debounce(R.partial(timer, [800])),
    map(targetValueLowerCase),
    flatMap(searchValue => {
        return of(searchValue).pipe(
            map(R.concat('/api/')),
            flatMap(axios),
            pluck('data', 'data'),
            map(R.evolve({books: htmlRows(searchValue)}))
        );
    })
)
.subscribe(({books, lastPage}) => {
    booksTable.innerHTML = books;
    pages.textContent = `of ${lastPage}`;
    potentialPage.value = 1;
    potentialPage.disabled = false;
    if (lastPage === 0) {
        potentialPage.value = 0;
        potentialPage.disabled = true;
    }
});

fromEvent(potentialPage, 'change').pipe(
    pluck('target', 'value'),
    filter(isNumber),
    map(parseFloat),
    map(pageCountValidation(pagesCount)),
    tap(num => potentialPage.value = num),
    map(addSearchValueAsPair),
    flatMap(([searchValue, page]) => {
        return of(`/api/${searchValue}/${page}`).pipe(
            flatMap(axios),
            pluck('data', 'data'),
            map(R.evolve({books: htmlRows(searchValue)}))
        );
    })
)
.subscribe(({books, lastPage}) => {
    booksTable.innerHTML = books;
    pages.textContent = `of ${lastPage}`;
});

fromEvent(forwardpage, 'click').pipe(
    mapTo([potentialPage, searchbar]),
    map(calls([R.prop('value'), valueLowerCase]))
)
.subscribe(console.log);

fromEvent(titleHeader, 'click').pipe(
    map(R.prop('target')),
    tap(R.pipe(R.prop('classList'), toggle('desc')))
)
.subscribe(console.log);
