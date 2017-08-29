var querystring = require('querystring')
var urlParser = require('url')
var request = require('request-client')

var OAuth = function (options) {
  var keys = [
    'appId',
    'appSecret',
    'host',
    'proxy',
    'scope'
  ]

  var that = this
  keys.forEach(function (key) {
    that[key] = options[key]
  })
}

OAuth.prototype = {
  wxLogin: function (req, res, next) {
    req.query = req.query || querystring.parse(req.url.split('?').pop())
    if ( this._isObject( req.query ) && typeof req.query.oauthredirect === 'string' ) {
      // If it is used as OAuth forwarding middleware

      // Must be decoded twice
      var url = decodeURIComponent(req.query.oauthredirect)
      url = decodeURIComponent(url)
      delete req.query.oauthredirect
      var newUrl = this.addQuery(url, req.query)
      this.redirect(res, newUrl)

    } else if ( !this._isWeChatBrowser( req ) ) {
      next() // Skip when it is not a WeChat browser
    } else if ( this._isObject( req.session ) && this._isObject( req.session.wxUser ) ) {
      next() // Skip when session cache is found
    } else if ( this._isObject( req.query ) && typeof req.query.code === 'string' ) {
      // Get user information
      var code = req.query.code
      var that = this
      this.getAccessToken(code, function (err, body) {
        if (err) {
          return next(err)
        }

        if (body.errcode) {
          var errcode = body.errcode
          // code invalid or has been used
          if ( errcode === 40029 || errcode === 40163 ) {
            var pathname = req.url.split('?')[0]
            delete req.query.code
            delete req.query.state
            var url = urlParser.resolve(that.host, pathname) + '?' + querystring.stringify(req.query)
            var oauthUrl = that.getAuthorizeURL(url, that.scope, 'fromWX')
            that.redirect(res, oauthUrl)
          } else {
            return next(err)
          }
        }

        var openid = body.openid
        var access_token = body.access_token
        that.getUser(openid, access_token, function (err, body) {
          if (err) {
            return next(err)
          }
          var url = req.query.oauth_redirect
          if (url) {
            url = decodeURIComponent(url)
            body.access_token = access_token
            var newUrl = that.addQuery(url, body, req.query.hash_style === '1')
            return that.redirect(res, newUrl)
          } else if ( that._isObject( req.session ) ) {
            req.session.wxUser = body
          } else {
            req.wxUser = body
          }
          next()
        })
      })

    } else {

      // redirect
      var url = urlParser.resolve(this.host, req.url)
      var oauthUrl = this.getAuthorizeURL(url, this.scope, 'fromWX')
      this.redirect(res, oauthUrl)
    }
  },

  // 给url的query部分增加参数，返回新的url
  addQuery: function (url, obj, isHashLink) {
    var urlJson = urlParser.parse(url, true)
    if (!isHashLink) {
      Object.assign(urlJson.query, obj)
      return urlJson.protocol + '//' + urlJson.host + urlJson.pathname + '?' + querystring.stringify(urlJson.query) + (urlJson.hash || '')
    } else {
      if (urlJson.hash) {
        var hashUrl = urlJson.hash.replace('#', '')
        var hashUrlJson = urlParser.parse(hashUrl, true)
      } else {
        var hashUrlJson = {
          pathname: '/',
          query: {},
          hash: ''
        }
      }
      Object.assign(hashUrlJson.query, obj)
      return urlJson.protocol + '//' + urlJson.host + urlJson.path + '#' + hashUrlJson.pathname + '?' + querystring.stringify(hashUrlJson.query) + (hashUrlJson.hash || '')
    }
  },

  _isWeChatBrowser: function (req) {
    var userAgent = this._getHeader(req, 'user-agent')
    return ( userAgent && /micromessenger/i.test( userAgent ) )
  },

  _getHeader: function (req, name) {
    if ( this._isObject(req.headers) ) {
      var reg = new RegExp(name, 'i')
      for ( var key in req.headers ) {
        if ( reg.test(key) ) {
          return req.headers[key]
        }
      }
    }
  },

  _isObject: function (obj) {
    var type = Object.prototype.toString.call(obj)
    return /\[object Object\]/i.test(type)
  },

  redirect: function (res, url) {
    if (res.headersSent) {
      return
    }
    if (typeof res.redirect === 'function') {
      return res.redirect(url)
    } 
    res.writeHead(302, {
      Location: url
    })
    res.end()
  },

  getAuthorizeURL: function (redirect, scope, state) {

    if ( this.proxy ) {
      var params = {
        oauthredirect: encodeURIComponent(redirect)
      }
      redirect = this.proxy + '?' + querystring.stringify(params)
    }

    var url = 'https://open.weixin.qq.com/connect/oauth2/authorize'
    var info = {
      appid: this.appId,
      redirect_uri: encodeURI(redirect),
      response_type: 'code',
      scope: scope || 'snsapi_base',
      state: state || ''
    }

    return url + '?' + querystring.stringify(info) + '#wechat_redirect'
  },

  getAccessToken: function (code, callback) {
    var url = 'https://api.weixin.qq.com/sns/oauth2/access_token'
    var info = {
      appid: this.appId,
      secret: this.appSecret,
      code: code,
      grant_type: 'authorization_code'
    }

    var target = url + '?' + querystring.stringify(info)

    this._get(target, callback)
  },

  getUser: function (openId, accessToken, callback) {
    var url = 'https://api.weixin.qq.com/sns/userinfo'
    var info = {
      access_token: accessToken,
      openid: openId,
      lang: 'zh_CN'
    }

    var target = url + '?' + querystring.stringify(info)

    this._get(target, callback)
  },

  _get: function (url, callback) {
    
    callback = callback || function () {}

    request.get(url, function (err, response, body) {
      if (err) {
        return callback(err)
      }

      try {
        body = JSON.parse(body)
      } catch(err) {
        return callback(err)
      }

      callback(null, body)
    })
  }
}

module.exports = OAuth