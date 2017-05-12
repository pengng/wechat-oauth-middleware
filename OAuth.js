const querystring = require('querystring');
const request = require('request');

const OAuth = function (appId, appSecret) {
  this.appId = appId;
  this.appSecret = appSecret;
  return this.wxLogin.bind(this);
};

OAuth.prototype = {

  wxLogin: function (req, res, next) {
    if (typeof req.headers['user-agent'] != 'string' || 
        !(/micromessenger/i.test(req.headers['user-agent']))) {

      // 非微信浏览器
      next();
    // } else if (process.env.NODE_ENV != 'pro') {

      // 非生产环境
    //  next();
    } else if (typeof req.session.wxUser == 'object') {

      // 登录过
      next();
    } else if (typeof req.query.code == 'string' && 
        typeof req.query.state == 'string' && req.query.state == 'fromWX') {

      // 获取
      this.getAccessToken(req.query.code).then(result => {

        return this.getUser(result.openid, result.access_token);

      }).then(result => {

        req.session.wxUser = result;
        console.log(result);
        res.redirect(req.url.replace(/[&]*code=.{32}&state=\w+[&]*/,''));

      });
    } else {
      // 回调
      var url = this.getAuthorizeURL(config.host + req.url, 'snsapi_userinfo', 'fromWX');
      res.redirect(url);
      
    }
  },

  getAuthorizeURL: function (redirect, scope, state) {
    var url = 'https://open.weixin.qq.com/connect/oauth2/authorize';
    var info = {
      appid: this.appId,
      redirect_uri: redirect,
      response_type: 'code',
      scope: scope || 'snsapi_base',
      state: state || ''
    }

    return `${url}?${querystring.stringify(info)}#wechat_redirect`;
  },

  getAccessToken: function (code, callback) {
    var url = 'https://api.weixin.qq.com/sns/oauth2/access_token';
    var info = {
      appid: this.appId,
      secret: this.appSecret,
      code: code,
      grant_type: 'authorization_code'
    }
    return new Promise((resolve, reject) => {
      request({
        url: `${url}?${querystring.stringify(info)}`
      }, (err, res, body) => {
        if (typeof callback == 'function') {
          callback(err, JSON.parse(body));
        } else if (err) {
          reject(err);
        } else {
          resolve(JSON.parse(body));
        }
      });
    });
  },

  getUser: function (openId, accessToken, callback) {
    var url = 'https://api.weixin.qq.com/sns/userinfo';
    var info = {
      access_token: accessToken,
      openid: openId,
      lang: 'zh_CN'
    }
    return new Promise((resolve, reject) => {
      request({
        url: `${url}?${querystring.stringify(info)}`
      }, (err, res, body) => {
        if (typeof callback == 'function') {
          callback(err, JSON.parse(body));
        } else if (err) {
          reject(err);
        } else {
          resolve(JSON.parse(body));
        }
      });
    });
  }
};

module.exports = OAuth;