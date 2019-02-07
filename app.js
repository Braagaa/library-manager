const express = require('express');
const log = require('morgan');
const bodyParser = require('body-parser');
const {join} = require('path');
const {Book} = require('./models/');
const {home, books, api} = require('./routes/');

const app = express();

app.set('port', process.env.PORT || 3000);

app.set('views', join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('paginationNum', 3);

app.use(log('dev'));
app.use(express.static(join(__dirname, 'public')));
app.use(bodyParser.urlencoded({extended: false}));

app.use('/', home);
app.use('/books', books);
app.use('/api', api);

app.use((req, res, next) => {
    res.status(404);
    res.render('page-not-found', {title: 'Page Not Found'});
});

app.use((err, req, res, next) => {
    if (err.status) {
        console.error(err);
        res.status(err.status);
        return res.render('error', {
            title: 'Error',
            status: err.status,
            message: err.message
        });
    }

    next(err);
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500);
    res.render('error', {
        title: 'Error',
        status: 500,
        message: 'Server error, please try again later.'
    });
})

Book
.sync()
.then(() => app.listen(app.get('port')));
