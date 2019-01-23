const express = require('express');
const {join} = require('path');
const {Book} = require('./models/');
const {home, books} = require('./routes/');

const app = express();

app.set('port', process.env.PORT || 3000);

app.set('views', join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(express.static(join(__dirname, 'public')));

app.use('/', home);
app.use('/books', books);

Book
.sync()
.then(() => app.listen(app.get('port')));
