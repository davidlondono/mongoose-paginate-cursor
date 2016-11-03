import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import chaiAsPromised from 'chai-as-promised';
import { it, before, after, beforeEach, afterEach } from 'arrow-mocha/es5';
import Promise from 'bluebird';
import sinon from 'sinon';
import 'sinon-as-promised';
import 'sinon-mongoose';
import Pagination from '../lib';
import { db } from './common';
import mongoose, { Schema } from 'mongoose';


chai.use(chaiAsPromised);
chai.use(dirtyChai);

mongoose.Promise = Promise;
describe('Pagination Cursor', () => {
  describe('objects', () => {
    const FooSchema = new Schema({ count: Number,id: Number  });
    FooSchema.plugin(Pagination);
    const FooModel = db.model('paginateFoo', FooSchema);
    const fooModelMock = sinon.mock(FooModel);


    const FooPagedSchema = new Schema({ count: Number });
    FooPagedSchema.plugin(Pagination, { name: 'paged' });
    // const FooPagedModel = db.model('pagedeFoo', FooPagedSchema);



    after(() => FooModel.remove());
    before(() => Promise
      .resolve([{
        id:1,
        count: 1
      },{
        id:3,
        count: 1
      },{
        id:2,
        count: 1
      },{
        id:4,
        count: 2
      },{
        id:5,
        count: 1
      },{
        id:6,
        count: 2
      },])
      .map(({id, count}) => FooModel.create({ id, count })));



    it('should let paginate', () => FooModel.paginate());

    it('should create default name', () => {
      expect(FooSchema.statics.paginate).to.be.a('function');
    });

    it('should set custom name for test', () => {
      expect(FooPagedSchema.statics.paginate).to.not.be.a('function');
      expect(FooPagedSchema.statics.paged).to.be.a('function');
    });

    it('should call model attributes', async() => {
      fooModelMock
        .expects('find')
        .withArgs({})
        .chain('sort')
        .withArgs({ _id: -1 })
        .chain('limit')
        .withArgs(1)
        .chain('exec')
        .resolves([]);

      await FooModel.paginate();
      fooModelMock.restore();
    });
    it('should bring after an id with equal count',async () => {
      const paginate = await FooModel.paginate({
        sinceId: 3,
        keyID: 'id',
        keyOrder: 'count',
        limit: 3,
        reverse: true
      });
      expect(paginate).to.have.property('objects');
      const { objects, nextCursor } = paginate;
      console.log(paginate);
      expect(objects.length).to.equals(3);
      expect(objects[0]).to.have.property('id').which.equals(3);
      expect(objects[1]).to.have.property('id').which.equals(5);
      expect(objects[2]).to.have.property('id').which.equals(4);
      expect(nextCursor).to.equals(6);
    })
  });

  describe('next cursor get', () => {
    const FooSchema = new Schema({ count: Number,id: Number });
    FooSchema.plugin(Pagination);
    const FooModel = db.model('paginateCursorFoo', FooSchema);
    after(() => FooModel.remove());
    before(() => Promise
      .resolve([{
        id:1,
        count: 1
      },{
        id:3,
        count: 1
      },{
        id:2,
        count: 1
      },{
        id:4,
        count: 2
      },{
        id:5,
        count: 1
      },])
      .map(({id, count}) => FooModel.create({ id, count })));

    it('should return on next the id 3', async () => {
      const paginate = await FooModel.paginate({
        keyID: 'id',
        keyOrder: 'count',
        limit: 2
      });
      expect(paginate.nextCursor).to.eql(3);
    });

    it('should return on next the id 5 on reverse', async () => {
      const paginate = await FooModel.paginate({
        keyID: 'id',
        keyOrder: 'count',
        limit: 3,
        reverse: true
      });
      expect(paginate.nextCursor).to.eql(5);
    });

  })
});
