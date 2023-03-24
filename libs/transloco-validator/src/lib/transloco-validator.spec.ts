import validator from './transloco-validator';
import fs from 'fs';

jest.mock('fs');

describe('transloco-validator', () => {

  it('should find duplicated keys', () => {
    jest.mocked(fs.readFileSync).mockImplementation(() => '{"test":{"dupl1":"data","dupl1": "data","test": [{"dupl2":"data","dupl2": "data"}]}}');

    const callValidator = () =>  validator('', ['mytest.json']);
    expect(callValidator).toThrowError(new Error("Found duplicate keys: <instance>.test.dupl1,<instance>.test.test[0].dupl2 (mytest.json)"));
  })

  it('should find forbidden keys', () => {
    jest.mocked(fs.readFileSync).mockImplementation(() => '{"test":{"forbidden{":"data","forbidden}": "data","test": [{"for{bidden}":"data"}]}}');

    const callValidator = () =>  validator('{}', ['mytest.json']);
    expect(callValidator).toThrowError(new Error("Found forbidden characters [{}] in keys: <instance>.test.forbidden{,<instance>.test.forbidden},<instance>.test.test[0].for{bidden} (mytest.json)"));
  })

  it('should find syntax error', () => {
    jest.mocked(fs.readFileSync).mockImplementation(() => '{"test":{"erreur"}}');

    const callValidator = () =>  validator('', ['mytest.json']);
    expect(callValidator).toThrowError(new SyntaxError("Unexpected token } in JSON at position 17 (mytest.json)"));
  })

  it('should return success', () => {
    jest.mocked(fs.readFileSync).mockImplementation(() => '{"test":{"erreur":123}}');

    const callValidator = () =>  validator('', ['mytest.json']);
    expect(callValidator).not.toThrowError();
  })

})