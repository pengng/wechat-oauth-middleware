const expect = require('chai').expect;
const urlParser = require('url');
const OAuth = require('../OAuth');

var option = {
  appId: 'wx74205b421dc1f3eb',
  appSecret: '',
  proxy: 'http://oauthproxy.xxx.com/'
};
var oauth = new OAuth(option);

describe('test OAuth.js', function () {

  describe('test object', function () {
    
    it('should be ok', function () {
      
      expect(oauth)
        .to.be.a('object')
        .is.instanceof(OAuth);

      expect(oauth)
        .to.contains.all.keys(option);

    });

  });

  describe('test wxLogin()', function () {
    
    it('should be ok', function (done) {
      var req = {
        url: '/testurl',
        headers: {
          host: 'app.xxx.com',
          'user-agent': 'MicroMessenger'
        },
        session: {},
        query: {}
      };

      var res = {
        redirect: function (url) {

          var urlJson = urlParser.parse(url, true);
          url = decodeURIComponent(urlJson.query.redirect_uri);
          urlJson = urlParser.parse(url, true);
          url = decodeURIComponent(urlJson.query.redirect);
          expect(url).to.equal(`http://${req.headers.host}${req.url}`);
          
          req.session.wxUser = {
            nickname: 'xiaobai',
            sex: 1
          };
          oauth.wxLogin(req, res, next);

        }
      };

      var next = function () {

        expect(req.session.wxUser)
          .to.have.property('nickname', 'xiaobai')
        expect(req.session.wxUser)
          .to.have.property('sex', 1);
        done();

      };
      
      oauth.wxLogin(req, res, next);

    });

  });

  describe('test getAuthorizeURL()', function () {
    
    it('should be ok', function () {

      var redirect = 'http://app.xxx.com/',
          scope = 'snsapi_userinfo',
          state = 'fromWX';

      var url = oauth.getAuthorizeURL(redirect, scope, state);
      
      var urlJson = urlParser.parse(url, true);

      expect(urlJson.query)
        .to.contains.all.keys({
          appid: option.appId,
          scope: scope,
          state: state
        });

      var redirect_uri = decodeURIComponent(urlJson.query.redirect_uri);
      urlJson = urlParser.parse(redirect_uri, true);

      var proxy = `${urlJson.protocol}//${urlJson.host}${urlJson.pathname}`;

      expect(proxy).to.equal(option.proxy);

      var redirect2 = decodeURIComponent(urlJson.query.redirect);
      expect(redirect2).to.equal(redirect);

    });

  });

  describe('test getAccessToken()', function () {
    
    it('should be ok', function (done) {
      
      var promise = oauth.getAccessToken('aaa');
      expect(promise).to.be.a('promise');

      promise.then(result => {

        expect(result)
          .to.have.property('errcode')
          .be.a('number');
        expect(result)
          .to.have.property('errmsg')
          .be.a('string');
        done();

      }).catch(done);

    });

  });

  describe('test getUser()', function () {
    
    it('should be ok', function (done) {
      
      var promise = oauth.getUser('openid', 'accessToken');
      expect(promise).to.be.a('promise');

      promise.then(result => {

        expect(result)
          .to.have.property('errcode')
          .be.a('number');
        expect(result)
          .to.have.property('errmsg')
          .be.a('string');
        done();

      });

    });

  });

  describe('test get()', function () {
    
    it('should be ok', function (done) {
      
      oauth.get('https://baidu.com', function (err, body) {
        
        expect(err).to.be.null;
        expect(body).to.be.a('string');
        done();

      });

    });

  });
});