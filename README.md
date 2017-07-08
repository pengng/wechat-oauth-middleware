# wechat-oauth-middleware

Used to obtain WeChat user information.
i.Required express framework

## Usage
```
npm install -S wechat-oauth-middleware
```
```javascript
const express = require('express')
const wechatMiddleware = require('wechat-oauth-middleware')
const app = express()

app.use( wechatMiddleware({
  appId: '', // your wechat public appId
  appSecret: '' // your wechat public appSecret
  host: '' // The domain name of your webapp. Like http://webapp.xxx.com
}) )

app.get('/', function (req, res) {
  console.log(req.wxUser || req.session.wxUser)
})
```

## Multiple domain names share an OAuth interface
### Set the `proxy` parameter
```javascript
// www.A.com
const express = require('express')
const wechatMiddleware = require('wechat-oauth-middleware')
const app = express()

app.use( wechatMiddleware({
  appId: '', // your wechat public appId
  appSecret: '' // your wechat public appSecret
  host: 'http://www.A.com' // The domain name of your webapp. Like http://webapp.xxx.com
}) )

app.get('/', function (req, res) {
  console.log(req.wxUser || req.session.wxUser)
})
```
```javascript
// www.B.com
const express = require('express')
const wechatMiddleware = require('wechat-oauth-middleware')
const app = express()

app.use( wechatMiddleware({
  appId: '', // your wechat public appId
  appSecret: '' // your wechat public appSecret
  host: 'http://www.B.com', // The domain name of your webapp. Like http://webapp.xxx.com
  proxy: 'http://www.A.com'
}) )

app.get('/', function (req, res) {
  console.log(req.wxUser || req.session.wxUser)
})
```

## License
MIT

# 微信公众号OAuth授权获取用户信息

Express 中间件。用于获取微信用户信息。需要微信服务号。

## 使用方法
```
npm install -S wechat-oauth-middleware
```

```javascript
const express = require('express')
const wechatMiddleware = require('wechat-oauth-middleware')
const app = express()

app.use( wechatMiddleware({
  appId: '', // 填入微信服务号的appId
  appSecret: '' // 填入微信服务号的appSecret
  host: '' // 填入你的webapp的域名，例如 http://app.xxx.com
}) )


app.get('/', function (req, res) {
  // 在路由回调传入的req对象中获取用户信息
  console.log(req.wxUser || req.session.wxUser)
})
```

## 多个域名共用一个OAuth接口
### 设置`proxy`参数
```javascript
// www.A.com
const express = require('express')
const wechatMiddleware = require('wechat-oauth-middleware')
const app = express()

app.use( wechatMiddleware({
  appId: '', // 填入微信服务号的appId
  appSecret: '' // 填入微信服务号的appSecret
  host: 'http://www.A.com' // 填入你的webapp的域名，例如 http://app.xxx.com
}) )

app.get('/', function (req, res) {
  // 在路由回调传入的req对象中获取用户信息
  console.log(req.wxUser || req.session.wxUser)
})
```
```javascript
// www.B.com
const express = require('express')
const wechatMiddleware = require('wechat-oauth-middleware')
const app = express()

app.use( wechatMiddleware({
  appId: '', // 填入微信服务号的appId
  appSecret: '' // 填入微信服务号的appSecret
  host: 'http://www.A.com' // 填入你的webapp的域名，例如 http://app.xxx.com
  proxy: 'http://www.B.com'
}) )

app.get('/', function (req, res) {
  // 在路由回调传入的req对象中获取用户信息
  console.log(req.wxUser || req.session.wxUser)
})
```
