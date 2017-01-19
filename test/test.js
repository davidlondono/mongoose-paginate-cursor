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
        count: 0
      },{
        id:3,
        count: 0
      },{
        id:2,
        count: 0
      },{
        id:4,
        count: 1
      },{
        id:5,
        count: 0
      },{
        id:6,
        count: 1
      },{
        id:7,
        count: 1
      },{
        id:8,
        count: 1
      },{
        id:9,
        count: 1
      }])
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
    });
    it('should filter and get even numbers', async () => {
      const paginate = await FooModel.paginate({
        sinceId: 2,
        keyID: 'id',
        keyOrder: 'count',
        limit: 3,
        reverse: true,
        filter: (foo) => {
          return foo.id%2 == 1
        }
      });
      const { objects, nextCursor } = paginate;
      expect(objects).to.have.property('length').which.equals(3);
      expect(objects[0]).to.have.property('id').which.equals(3);
      expect(objects[1]).to.have.property('id').which.equals(5);
      expect(objects[2]).to.have.property('id').which.equals(7);
      expect(nextCursor).to.equals(8);
    });
    it('should bring from id 2 until id 6', async () => {
      const paginate = await FooModel.paginate({
        sinceId: 2,
        maxId: 6,
        keyID: 'id',
        keyOrder: 'count',
        limit: 5,
        reverse: true
      });
      console.log(paginate);
      const { objects, nextCursor } = paginate;
      expect(objects).to.have.property('length').which.equals(4,'length dont match');
      expect(objects[0]).to.have.property('id').which.equals(2);
      expect(objects[1]).to.have.property('id').which.equals(3);
      expect(objects[2]).to.have.property('id').which.equals(5);
      expect(objects[3]).to.have.property('id').which.equals(4);
    });
    it('should bring until id 5', async () => {
      const paginate = await FooModel.paginate({
        maxId: 5,
        keyID: 'id',
        keyOrder: 'count',
        limit: 5,
        reverse: true
      });
      const { objects, nextCursor } = paginate;
      expect(objects).to.have.property('length').which.equals(3);
      expect(objects[0]).to.have.property('id').which.equals(1);
      expect(objects[1]).to.have.property('id').which.equals(2);
      expect(objects[2]).to.have.property('id').which.equals(3);
    })
    it('should bring until id 5 with filter true', async () => {
      const paginate = await FooModel.paginate({
        sinceId: 2,
        maxId: 5,
        keyID: 'id',
        keyOrder: 'count',
        limit: 5,
        filter: () => true,
        reverse: true
      });
      console.log(paginate);
      const { objects, nextCursor } = paginate;
      expect(objects).to.have.property('length').which.equals(2);
      expect(objects[0]).to.have.property('id').which.equals(2);
      expect(objects[1]).to.have.property('id').which.equals(3);
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


    it('should get next cursor as 5 after id 2', async () => {
      const paginate = await FooModel.paginate({
        sinceId: 2,
        keyID: 'id',
        keyOrder: 'count',
        limit: 2,
        reverse: true
      });
      console.log(paginate);
      expect(paginate.nextCursor).to.eql(5);
  })

  })
  describe.only('filter all don\'t infinite loop', () => {
    const FooSchema = new Schema({ uid: Number });
    FooSchema.plugin(Pagination);
    const FooModel = db.model('paginateFilterFoo', FooSchema);
    after(() => FooModel.remove());
    before(() => Promise
      .map([{
        uid:1,
      },{
        uid:3,
      },{
        uid:2,
      },{
        uid:4,
      },{
        uid:5,
      },],(m) => FooModel.create(m)));

    it('should not infinite find', async () => {
      await FooModel.paginate({
        where:{
          uid: {$lt:20},
        },
        filter: () => false,
        limit: 2
      });
    })
  })
});
