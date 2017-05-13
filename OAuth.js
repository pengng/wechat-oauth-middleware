const querystring = require('querystring');
const https = require('https');

const OAuth = function (option) {
  this.appId = option.appId;
  this.appSecret = option.appSecret;
  this.proxy = option.proxy;
};

OAuth.prototype = {

  wxLogin: function (req, res, next) {
    console.log('test');
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
    } else if (
        typeof req.query.code == 'string' &&
        typeof req.query.state == 'string' && 
        req.query.state == 'fromWX') {

      // 获取
      this.getAccessToken(req.query.code).then(result => {

        if (result.errcode) {
          return Promise.reject(result.errcode);
        }

        return this.getUser(result.openid, result.access_token);

      }).then(result => {

        req.session.wxUser = result;
        next();

      }).catch(err => {

          if (err == 40029) {

            var pathname = req.url.split('?')[0];
            delete req.query.code;
            delete req.query.state;
            var url = `http://${req.headers.host}${pathname}?${querystring.stringify(req.query)}`;
            var oauthUrl = this.getAuthorizeURL(url, 'snsapi_userinfo', 'fromWX');
            res.redirect(oauthUrl);
            
          } else {
            console.log(err);
            next();
          }

      });
    } else {
      // 回调
      var url = this.getAuthorizeURL('http://' + req.headers.host + req.url, 'snsapi_userinfo', 'fromWX');
      res.redirect(url);
      
    }
  },

  getAuthorizeURL: function (redirect, scope, state) {

    if (this.proxy) {
      var params = {
        redirect: encodeURIComponent(redirect)
      };
      redirect = `${this.proxy}?${querystring.stringify(params)}`;
    }

    var url = 'https://open.weixin.qq.com/connect/oauth2/authorize';
    var info = {
      appid: this.appId,
      redirect_uri: encodeURIComponent(redirect),
      response_type: 'code',
      scope: scope || 'snsapi_base',
      state: state || ''
    }

    return `${url}?${querystring.stringify(info)}#wechat_redirect`;
  },

  getAccessToken: function (code) {
    var url = 'https://api.weixin.qq.com/sns/oauth2/access_token';
    var info = {
      appid: this.appId,
      secret: this.appSecret,
      code: code,
      grant_type: 'authorization_code'
    };

    return new Promise((resolve, reject) => {

      var target = `${url}?${querystring.stringify(info)}`;

      this.get(target, function (err, body) {

        if (err) {
          return reject(err);
        }

        resolve(JSON.parse(body));

      });

    });
  },

  getUser: function (openId, accessToken) {
    var url = 'https://api.weixin.qq.com/sns/userinfo';
    var info = {
      access_token: accessToken,
      openid: openId,
      lang: 'zh_CN'
    };

    return new Promise((resolve, reject) => {

      var target = `${url}?${querystring.stringify(info)}`;

      this.get(target, function (err, body) {

        if (err) {
          return reject(err);
        }

        resolve(JSON.parse(body));

      });

    });
  },

  get: function (url, callback) {
    
    https.get(url, function (res) {
      
      var body = '';
      res.on('data', function (chunk) {
        body += chunk;
      });

      res.on('end', function () {
        callback && callback(null, body);
      });

    }).on('error', function (err) {
      
      callback && callback(err);

    });

  }
};

module.exports = OAuth;