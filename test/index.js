import chai, { expect } from 'chai';
import dirtyChai from 'dirty-chai';
import chaiAsPromised from 'chai-as-promised';
import { it, before, after, beforeEach, afterEach } from 'arrow-mocha/es5';
import module, { boilerplate } from '../lib';

chai.use(chaiAsPromised);
chai.use(dirtyChai);

describe('boilerplate test', () => {
  it('should return default', () => {
    const moduleResponse = module();

    expect(moduleResponse).to.equal('default');
  });

  it('should return boilerplate', () => {
    const boilerplateResponse = boilerplate();

    expect(boilerplateResponse).to.equal('boilerplate');
  });
});
