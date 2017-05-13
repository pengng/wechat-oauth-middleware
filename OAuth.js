const querystring = require('querystring');
const urlParser = require('url');
const https = require('https');

const OAuth = function (option) {
  this.appId = option.appId;
  this.appSecret = option.appSecret;
  this.host = option.host;
  this.proxy = option.proxy;
};

OAuth.prototype = {

  wxLogin: function (req, res, next) {

    if (typeof req.query.oauthredirect === 'string') {
      // If it is used as OAuth forwarding middleware
      // 如果是作为OAuth转发中间件使用

      // Must be decoded twice
      // 必须解码两次
      var url = decodeURIComponent(req.query.oauthredirect);
      url = decodeURIComponent(url);

      var urlJson = urlParser.parse(url, true);
      for (let i in req.query) {
        if (i != 'oauthredirect') {
          urlJson.query[i] = req.query[i];
        }
      }

      var newUrl = `${urlJson.protocol}//${urlJson.host}${urlJson.pathname}?${querystring.stringify(urlJson.query)}`;
      res.redirect(newUrl);

    } else if (typeof req.headers['user-agent'] != 'string' || 
        !(/micromessenger/i.test(req.headers['user-agent']))) {

      // Not a WeChat browser
      // 非微信浏览器
      next();
    // } else if (process.env.NODE_ENV != 'pro') {

      // Not the production environment
      // 非生产环境
    //  next();
    } else if (typeof req.session.wxUser == 'object') {

      // Cached
      // 缓存过
      next();
    } else if (
        typeof req.query.code == 'string' &&
        typeof req.query.state == 'string' && 
        req.query.state == 'fromWX') {

      // Get user information
      // 获取用户信息
      this.getAccessToken(req.query.code).then(result => {

        if (result.errcode) {
          return Promise.reject(result.errcode);
        }

        return this.getUser(result.openid, result.access_token);

      }).then(result => {

        req.session.wxUser = result;
        next();

      }).catch(err => {

          // {
          //   "errcode": 40029,
          //   "errmsg": "invalid code"
          // }
          // {
          //   "errcode": 40163,
          //   "errmsg": "code been used"
          // }
          // code invalid or has been used
          // code 无效或已经使用过
          if (err == 40029 || err == 40163) {

            var pathname = req.url.split('?')[0];
            delete req.query.code;
            delete req.query.state;
            var url = `${urlParser.resolve(this.host, pathname)}?${querystring.stringify(req.query)}`;
            var oauthUrl = this.getAuthorizeURL(url, 'snsapi_userinfo', 'fromWX');
            res.redirect(oauthUrl);
            
          } else {
            console.log(err);
            next();
          }

      });
    } else {

      // redirect
      // 重定向
      var url = urlParser.resolve(this.host, req.url);
      var oauthUrl = this.getAuthorizeURL(url, 'snsapi_userinfo', 'fromWX');
      res.redirect(oauthUrl);
      
    }
  },

  getAuthorizeURL: function (redirect, scope, state) {

    if (this.proxy) {
      var params = {
        oauthredirect: encodeURIComponent(redirect)
      };
      redirect = `${this.proxy}?${querystring.stringify(params)}`;
    }

    var url = 'https://open.weixin.qq.com/connect/oauth2/authorize';
    var info = {
      appid: this.appId,
      redirect_uri: encodeURI(redirect),
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