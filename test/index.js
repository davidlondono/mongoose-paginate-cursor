import chai, { expect, assert } from 'chai';
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

describe('Pagination Cursor', () => {
  const FooSchema = new Schema({ count: Number });
  const FooPagedSchema = new Schema({ count: Number });
  FooSchema.plugin(Pagination);
  FooPagedSchema.plugin(Pagination, { name: 'paged' });
  const FooModel = db.model('paginateFoo', FooSchema);
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

  it.only('should call model attributes', async() => {
    sinon.mock(FooModel)
      .expects('find').withArgs({})
      .chain('sort').withArgs({ _id: -1 })
      .chain('limit').withArgs(1)
      .chain('exec')
      .resolves([]);

    await FooModel.paginate();
  });

});
