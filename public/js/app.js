const {fromEvent, from, timer, of} = require('rxjs'); 
const {flatMap, map, filter, mapTo, debounce, pluck, tap} = require('rxjs/operators');
const isNumber = require('is-number');
const R = require('ramda');
const axios = require('axios');

const searchbar = document.getElementById('search');
const backpage = document.querySelector('.pagination__back');
const forwardpage = document.querySelector('.pagination__forward');
const potentialPage = document.querySelector('.pagination__input input');
const columns = document.querySelector('thead tr');
const booksTable = document.getElementById('books');
const pagesCount = document.getElementById('pages');

const json = R.invoker(0, 'json');
const toggle = R.invoker(1, 'toggle');
const remove = R.invoker(1, 'remove');
const appendChild = R.invoker(1, 'appendChild');
const removeChild = R.invoker(1, 'removeChild');

const classListFn = fn => arg => R.pipe(R.prop('classList'), fn(arg));
const toggleClass = classListFn(toggle);
const removeClass = classListFn(remove);

const targetValueLowerCase = R.pipe(R.path(['target', 'value']), R.toLower);
const valueLowerCase = R.pipe(R.prop('value'), R.toLower);
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

const cleanInputNumber = R.pipe(
    R.prop('value'),
    R.unless(isNumber, R.always(0)),
    parseFloat
);

fromEvent(searchbar, 'keyup').pipe(
    debounce(R.partial(timer, [500])),
    map(targetValueLowerCase),
    flatMap(searchValue => {
        return of(searchValue).pipe(
            map(R.concat('/api/1/')),
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

const apiWithPage = obs => obs.pipe(
    map(pageCountValidation(pagesCount)),
    tap(num => potentialPage.value = num),
    map(addSearchValueAsPair),
    flatMap(([searchValue, page]) => {
        return of(`/api/${page}/${searchValue}`).pipe(
            flatMap(axios),
            pluck('data', 'data'),
            map(R.evolve({books: htmlRows(searchValue)}))
        );
    })
);

const incDecPage$ = (element, incOrDecFunc) => 
    fromEvent(element, 'click').pipe(
        mapTo(potentialPage),
        map(cleanInputNumber),
        filter(R.lt(0)),
        map(incOrDecFunc),
        of,
        flatMap(apiWithPage)
    );

const updateBooksHTML = ({books, lastPage}) => {
    booksTable.innerHTML = books;
    pages.textContent = `of ${lastPage}`;
}

fromEvent(potentialPage, 'change').pipe(
    pluck('target', 'value'),
    filter(isNumber),
    map(parseFloat),
    of,
    flatMap(apiWithPage)
)
.subscribe(updateBooksHTML);

incDecPage$(forwardpage, R.inc).subscribe(updateBooksHTML);
incDecPage$(backpage, R.dec).subscribe(updateBooksHTML);

const sortColumn = colHeaderElm => {
    const index = R.indexOf(
        colHeaderElm, 
        colHeaderElm.parentElement.children
    );
    const rows = colHeaderElm
        .parentElement
        .parentElement
        .nextElementSibling
        .children;
    const rowsChidlren = R.map(R.prop('children'), rows);
    const colm = R.map(R.nth(index), rowsChidlren);
    return colHeaderElm.classList.contains('asc') ? 
        R.sort(R.ascend(R.prop('textContent')), colm) :
        R.sort(R.descend(R.prop('textContent')), colm); 
};

const removeAllOtherAscClassHeaders = R.pipe(
    R.complement(R.equals),
    R.filter(R.__, columns.children),
    R.forEach(removeClass('asc'))
);

const resortBooksTable = R.forEach(R.pipe(
    removeChild(R.__, booksTable),
    appendChild(R.__, booksTable)
));

fromEvent(columns, 'click').pipe(
    pluck('target'),
    tap(removeAllOtherAscClassHeaders),
    tap(toggleClass('asc')),
    map(sortColumn),
    map(R.map(R.prop('parentElement')))
)
.subscribe(resortBooksTable);
