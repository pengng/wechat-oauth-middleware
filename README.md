# wechat-oauth-middleware

Express middleware. Used to obtain WeChat user information.

## Usage
```
npm i -S wechat-oauth-middleware
```
```
const express = require('express');
const wechatMiddleware = require('wechat-oauth-middleware');
var app = express();
const session = require('express-session');
app.use(session());
app.use(wechatMiddleware({
  appId: 'your wechat public appId',
  appSecret: 'your wechat public appSecret',
}));

app.get('/', function () {
  console.log(req.session.wxUser);
});
```
## License
MIT