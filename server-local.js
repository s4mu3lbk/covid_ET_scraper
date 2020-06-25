'use strict';

const app = require('./koa/server');

app.listen(1337, () => console.log('Local app listening on port 1337!'));
