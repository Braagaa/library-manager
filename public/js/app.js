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

/* If search value is not a empty string perform a RegExp on all properties 
 * of the Book Model to give a .highlight text where searchValue is found, 
 * then return the new Book Model. If search value is empty string, return
 * Book Model as is.
 */
const highlightText = searchValue => book => R.unless(
    R.pipe(R.always(searchValue), R.isEmpty),
    R.map(R.replace(
        new RegExp(`(${searchValue})`, 'ig'), 
        `<span class="highlight">$1</span>`
    )),
    book
);

/*
 * Takes an array of Books, converts their id and year props to strings, 
 * gives their values a .highlight class in string format when applicable,
 * turns each Book into a HTML string format and joins them together to
 * one major HTML string.
 */
const htmlRows = searchValue => books => R.pipe(
    R.map(R.evolve({id: R.toString, year: R.toString})),
    R.map(highlightText(searchValue)),
    R.map(createRow), 
    R.join('')
)(books);

/*
 * 1. Takes DomElement textContent value.
 * 2. Splits it into an array for every ' '.
 * 3. Gets the second value of the array.
 * 4. Converts it into a number.
 * Eg 'of 6' -> ['of', '6'] -> '6' -> 6
 */
const getLastpageValue = R.pipe(
    R.prop('textContent'),
    R.split(' '),
    R.nth(1),
    parseFloat
);

/*
 * Makes a Tuple of whatever value being sent in and then makes the value of
 * the searchbar lower case.
 * Eg 100 -> [DomElement, 100] -> ['some string value', 100]
 */
const addSearchValueAsPair = R.pipe(
    R.pair(searchbar), 
    R.adjust(0, valueLowerCase)
);

/*
 * 1. Refer to getLastpageValue.
 * 2. Ensures that num paramter is between 1 and whatever value was obtained
 *    from getLastpageValue. If num is less than 1 than it is 1 and if num
 *    is greater than value from getLastpageValue it is than that number.
 */
const pageCountValidation = countElement => num =>
R.pipe(
    getLastpageValue,
    R.clamp(1, R.__, num)
)(countElement);

/*
 * 1. Gets value of value prop in DomElement.
 * 2. If value cannot be converted into a number, default it as 0.
 * 3. Convert it to number.
 */
const cleanInputNumber = R.pipe(
    R.prop('value'),
    R.unless(isNumber, R.always(0)),
    parseFloat
);

/*
 * 1. Gives the keyup event for the searchbar a debounce of 500 ms. This
 *    ensures that every typed character on the searchbar wont call the api.
 * 2. Gets the value and lowercases it.
 * 3. Creates a string and calls on the api to get the list of Books. Also
 *    it converts the books into HTML strings with htmlRows function.
 */
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
    //side effect code
    booksTable.innerHTML = books;
    pages.textContent = `of ${lastPage}`;
    potentialPage.value = 1;
    potentialPage.disabled = false;
    if (lastPage === 0) {
        potentialPage.value = 0;
        potentialPage.disabled = true;
    }
});

/*
 * Takes an Observable creates a pipeline for it and returns it back. The
 * pipeline consists of the following:
 *
 * 1. Refer to pageCountValidation.
 * 2. Side effect to change the max number of pages listed on the DOM.
 * 3. Refer to addSearchValueAsPair.
 * 4. Creates a string and calls on the api to get the list of Books. Also
 *    it converts the books into HTML strings with htmlRows function.
 */
const apiWithPage = obs => obs.pipe(
    map(pageCountValidation(pagesCount)),
    //side effect needed here
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

/*
 * Pagination
 *
 * Takes an element and a function that incriments or decriments a number by
 * 1 and returns back an Observable with a built pipeline. The pipeline 
 * consists of the following:
 *
 * 1. Gets the potentialPage DOMElement.
 * 2. Refer to cleanInputNumber function.
 * 3. If the number is less than 0 end the pipeline and nothing happens.
 * 4. Either incriment or decriment the number by 1.
 * 5. Refer to apiWithPage function.
 */
const incDecPage$ = (element, incOrDecFunc) => 
    fromEvent(element, 'click').pipe(
        mapTo(potentialPage),
        map(cleanInputNumber),
        filter(R.lt(0)),
        map(incOrDecFunc),
        of,
        flatMap(apiWithPage)
    );

//side effect function
const updateBooksHTML = ({books, lastPage}) => {
    booksTable.innerHTML = books;
    pages.textContent = `of ${lastPage}`;
}

/*
 * 1. Gets Event.target.value value.
 * 2. If it cannot be converted to a number, default the value to 1.
 * 3. Convert it to a number.
 * 4. Refer to apiWithPage function.
 */
fromEvent(potentialPage, 'change').pipe(
    pluck('target', 'value'),
    map(R.unless(isNumber, R.always(1))),
    map(parseFloat),
    of,
    flatMap(apiWithPage)
)
.subscribe(updateBooksHTML);

//increases pagination by one when you click forward arrow.
incDecPage$(forwardpage, R.inc).subscribe(updateBooksHTML);
//decreases pagination by one when you click backward arrow.
incDecPage$(backpage, R.dec).subscribe(updateBooksHTML);

/* Sortable Columns
 *
 * Takes a column header Element and returns an array of sorted out rows.
 *
 * 1. Gets index of the column in relation to its parent element.
 * 2. Gets the correct row child Element for each row with the index.
 * 3. Uses its textContent property to sort with. It is either sorted 
 *    ascending or descending depending on wheter the column header element
 *    has the asc class or not.
 */
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

//side effect function to remove the asc class on all column header elements
//except for the one clicked.
const removeAllOtherAscClassHeaders = R.pipe(
    R.complement(R.equals),
    R.filter(R.__, columns.children),
    R.forEach(removeClass('asc'))
);

//side effect function that removes all rows in table element and appends
//the sorted rows.
const resortBooksTable = R.forEach(R.pipe(
    removeChild(R.__, booksTable),
    appendChild(R.__, booksTable)
));

/*
 * 1. Gets Event.target value which is a DomElement.
 * 2. Refer to removeAllOtherAscClassHeaders function.
 * 3. Side effect to toggle the asc class from the DomElement.
 * 4. Refer to sortColumn function.
 * 5. Gets the array of sorted row DomElement parent elements.
 */
fromEvent(columns, 'click').pipe(
    pluck('target'),
    tap(removeAllOtherAscClassHeaders),
    tap(toggleClass('asc')),
    map(sortColumn),
    map(R.map(R.prop('parentElement')))
)
.subscribe(resortBooksTable);
