const cheerio = require('cheerio');
const Koa = require('koa');
const serverless = require('serverless-http');
const Router = require('koa-router');
const send = require('koa-send');
const Promise = require('bluebird');
const logger = require('koa-logger');
const request = Promise.promisify(require('request'));

const app = new Koa();

const covid_routes = new Router();
const index = new Router();
const router = new Router();

const covid19_et_total_url = 'https://www.covid19.et/covid-19/';
const covid19_et_daily_url = 'https://www.covid19.et/covid-19/Home/DailyDashboard';

const response = {
  "total_tested": 0,
  "confirmed_cases": 0,
  "recovered": 0,
  "deaths": 0
}
const response_keys = Object.keys(response)

async function fetchUrl(url) {
  return await request({
    method: 'GET',
    url
  })
}

async function totalCases(ctx, next) {
  const res = await fetchUrl(covid19_et_total_url),
    responseBody = res.body;

  const $ = cheerio.load(responseBody);
  const count = $('.count')

  count.each((idx, element) => {
    let child = element.children.pop()
    response[response_keys[idx]] = parseInt(child.data.replace(/,/g, ''))
  })

  ctx.set('Content-Type', 'application/json');
  ctx.body = JSON.stringify(response);

  next();
}


async function dailyCases(ctx, next) {
  const res = await fetchUrl(covid19_et_daily_url),
    responseBody = res.body;

  const $ = cheerio.load(responseBody)
  const cases_count = $('.count')

  cases_count.each((idx, element) => {
    let child = element.children.pop()
    response[response_keys[idx]] = parseInt(child.data.replace(/,/g, ''))
  })

  ctx.set('Content-Type', 'application/json');
  ctx.body = JSON.stringify(response);

  next();
}

covid_routes.get('/total', totalCases);
covid_routes.get('/daily', dailyCases);

index.get('/', async ctx => {
    await send(ctx, ctx.path, { root: __dirname + '/../index.html' })
})

router.use('/.netlify/functions/server', covid_routes.routes());  // path must route to lambda
router.use('/', index.routes())

app.use(logger());
app.use(router.routes());

module.exports = app;
module.exports.handler = serverless(app);
