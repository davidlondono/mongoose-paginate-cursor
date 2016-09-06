import test from 'ava';
import module, {boilerplate} from '../dist';

test('should return default', t => {
  const moduleResponse = module();

  t.is(moduleResponse, "default");
});
test('should return boilerplate', t => {
  const boilerplateResponse = boilerplate();

  t.is(boilerplateResponse, "boilerplate");
});
