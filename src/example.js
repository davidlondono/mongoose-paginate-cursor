/**
 * Created by david on 9/22/16.
 */
import mongoose, { Schema } from 'mongoose';
import _debug from 'debug';
import Pagination from './Pagination';

const debug = _debug('paginationCursor:connection');
const error = _debug('paginationCursor:error');
mongoose.Promise = Promise; // ES6 Promise

const db = mongoose.connection;

db.on('error', err => error('connection error: %o', err));

db.once('open', () => {
  debug('connection opened with DB');
});

mongoose.connect('mongodb://localhost/PageTest');

const rand = () => Math.floor(Math.random() * 500);
const FooSchema = new Schema({ count: { type: Number, default: rand } });
FooSchema.plugin(Pagination);
const Foo = mongoose.model('Foo', FooSchema);

setInterval(async() => {
  debug('will create new');
  try {
    const foo = await Foo.create({});
    debug('created', foo);
  } catch (e) {
    error(e);
  }
}, 10000);

let sinceId = null;
process.stdin.on('data', async(text) => {
  debug('input', text);
  try {
    const { nextCursor, objects } = await Foo.paginate({
      limit: 5,
      sinceId,
      reverse: false,
      orderKey: 'count',
      filter: () => (Math.random() > 0.1),
    });
    sinceId = nextCursor;
    debug('paged', { objects, nextCursor });
  } catch (e) {
    error(e);
  }
});
