import chai, {expect} from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { it, before, after, beforeEach, afterEach } from 'arrow-mocha/es5'
import module, {boilerplate} from '../dist';

chai.use(chaiAsPromised);

describe('boilerplate test',function () {
	
  it('should return default', () => {
    const moduleResponse = module();

    expect(moduleResponse).to.equal('default');
  });

  it('should return boilerplate', () => {
    const boilerplateResponse = boilerplate();

    expect(boilerplateResponse).to.equal('boilerplate');
  });

})
