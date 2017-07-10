# 微信OAuth授权中间件

Express 中间件。用于获取微信用户信息。

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

### wechatMiddleware(options)
##### options
| 名称 | 类型 | 必填 | 描述 |
| --- | --- | --- | --- |
| appId | string | 是 | 微信公众号appId |
| appSecret | string | 是 | 微信公众号appSecret |
| host | string | 是 | 微信公众号设置的回调域名 |
| scope | string | 否 | 微信授权类型，可选`snsapi_base`和`snsapi_userinfo` |

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
