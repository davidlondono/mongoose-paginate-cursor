const mongoose = require('mongoose');
const _debug = require('debug');
const Pagination = require('../src/Pagination');

const debug = console.log;
const error = console.error;
mongoose.Promise = Promise; // ES6 Promise

const db = mongoose.connection;

db.on('error', err => error('connection error: %o', err));

db.once('open', () => {
  debug('connection opened with DB');
});

mongoose.connect('mongodb://localhost/PageTest');

const rand = () => Math.floor(Math.random() * 500);
const FooSchema = new mongoose.Schema({ count: { type: Number, default: rand } });
FooSchema.plugin(Pagination);
const Foo = mongoose.model('Foo', FooSchema);

setInterval(async () => {
  debug('will create new');
  try {
    const foo = await Foo.create({});
    debug('created', foo);
  } catch (e) {
    error(e);
  }
}, 10000);

let sinceId = null;
const addValue = async (text) => {
  debug('input', text);
  try {
    const { nextCursor, objects } = await Foo.paginate({
      limit: 5,
      sinceId,
      reverse: false,
      keyOrder: 'count',
    });
    sinceId = nextCursor;
    debug('paged', { objects, nextCursor });
  } catch (e) {
    error(e);
  }
};
setInterval(() => {
  addValue('interval');
}, 2000);
process.stdin.on('data', async (text) => {
  addValue(text);
});
