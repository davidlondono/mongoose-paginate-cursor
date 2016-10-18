import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import chaiAsPromised from 'chai-as-promised';
import { it, before } from 'arrow-mocha/es5';
import Promise from 'bluebird';
import sinon from 'sinon';
import 'sinon-as-promised';
import 'sinon-mongoose';
import Pagination from '../lib';
import { db } from './common';
import mongoose, { Schema } from 'mongoose';


chai.use(chaiAsPromised);
chai.use(dirtyChai);

describe('Pagination Cursor', () => {
  const FooSchema = new Schema({ count: Number });
  const FooPagedSchema = new Schema({ count: Number });
  FooSchema.plugin(Pagination);
  FooPagedSchema.plugin(Pagination, { name: 'paged' });
  const FooModel = db.model('paginateFoo', FooSchema);
  const fooModelMock = sinon.mock(FooModel);
  // const FooPagedModel = db.model('pagedeFoo', FooPagedSchema);

  before(() => {
    mongoose.Promise = Promise;
  });

  before(() => Promise
    .resolve([3, 74, 23, 734, 6, 2, 6])
    .map((count) => FooModel.create({ count })));


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
  it.only('should call paginate with ids', async() => {
    const expectFindFooModelMock = fooModelMock
      .expects('find');
    const stubById = sinon.stub(FooModel, 'findById');

    const sinceId = mongoose.Types.ObjectId('57ffe3b756d561d25a82d21a');
    const maxId = mongoose.Types.ObjectId('57ffe3b756d561d25a82d219');
    stubById
      .withArgs(sinceId).resolves({
      _id: sinceId,
      count: 678,
    });
    stubById
      .withArgs(maxId).resolves({
      _id: maxId,
      count: 345,
    });
    expectFindFooModelMock
      .withArgs({
        _id: { $gt: maxId, $lte: sinceId },
      })
      .chain('sort')
      .withArgs({ _id: -1 })
      .chain('limit')
      .withArgs(1)
      .chain('exec')
      .resolves([]);
    await FooModel.paginate({
      sinceId,
      maxId,
    });
    expectFindFooModelMock.verify();
    stubById.restore();
  });
  it.only('should call paginate with count', async() => {
    const expectFindFooModelMock = fooModelMock
      .expects('find');
    const stubById = sinon.stub(FooModel, 'findById');

    const sinceId = mongoose.Types.ObjectId('57ffe3b756d561d25a82d21a');
    const maxId = mongoose.Types.ObjectId('57ffe3b756d561d25a82d219');
    stubById
      .withArgs(sinceId).resolves({
        _id: sinceId,
        count: 678,
    });
    stubById
      .withArgs(maxId).resolves({
        _id: maxId,
        count: 345,
      });
    expectFindFooModelMock
      .withArgs({
        count: { $gt: 345, $lte: 678 },
      })
      .chain('sort')
      .withArgs({ count: -1 })
      .chain('limit')
      .withArgs(1)
      .chain('exec')
      .resolves([]);
    await FooModel.paginate({
      sinceId,
      maxId,
      orderKey: 'count',
    });
    expectFindFooModelMock.verify();
    stubById.restore();
  });
});
