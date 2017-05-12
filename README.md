# wechat-oauth-middleware

Express middleware. Used to obtain WeChat user information.
i.Required express framework

## Usage
```
npm i -S wechat-oauth-middleware
```
```javascript
const express = require('express');
const wechatMiddleware = require('wechat-oauth-middleware');
const session = require('express-session');

var app = express();

// First call express-session middleware
app.use(session());
app.use(wechatMiddleware({
  appId: '', // your wechat public appId
  appSecret: '' // your wechat public appSecret
}));

app.get('/', function (req, res) {
  console.log(req.session.wxUser);
});
```
## License
MIT

# 微信服务号OAuth授权获取用户信息

Express 中间件。用于获取微信用户信息。需要微信服务号。

## 使用方法
```
npm i -S wechat-oauth-middleware
```

```javascript
const express = require('express');
const wechatMiddleware = require('wechat-oauth-middleware');
const session = require('express-session');

var app = express();

// 先调用express-session中间件
app.use(session());
app.use(wechatMiddleware({
  appId: '', // 填入微信服务号的appId
  appSecret: '' // 填入微信服务号的appSecret
}));


app.get('/', function (req, res) {
  // 在路由回调传入的req对象中获取用户信息
  console.log(req.session.wxUser);
});
```
