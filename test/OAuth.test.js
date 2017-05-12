const expect = require('chai').expect;
const OAuth = require('../OAuth');

const oauth_middleware = new OAuth(
  'wx9f223c274a4d0135',
  'f2f7d1327bfe5bdab7df7e8531709d2e'
);

describe('test OAuth.js', function () {
  
  it ('should be ok', function () {
    
    expect(oauth_middleware).to.be.a('function');

  });

});