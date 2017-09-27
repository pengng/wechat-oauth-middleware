# 微信OAuth授权中间件

用于获取微信用户信息。

### Usage
```bash
npm install -S wechat-oauth-middleware
```

### Use with express

```javascript
const express = require('express')
const oauth = require('wechat-oauth-middleware')
const app = express()

const oauthMiddleware = oauth({
  appId: '',
  appSecret: '',
  host: '' // 填入微信公众号回调域名
})

// Apply to all routes
app.use('*', oauthMiddleware)

// Or apply to the specified route
app.get('/wechat/*', oauthMiddleware)

app.get('/wechat/login', function (req, res) {
  console.log(req.wxUser || req.session.wxUser)
})

app.listen(3000)
```

### Use with http

```javascript
const http = require('http')
const oauth = require('wechat-oauth-middleware')
const oauthMiddleware = oauth({
  appId: '',
  appSecret: '',
  host: '' // 填入微信公众号回调域名
})

const server = http.createServer((req, res) => {
  oauthMiddleware(req, res, () => {
    console.log(req.wxUser)
  })
})

server.listen(3000)
```

### Use with Nuxt

`middleware/oauth.js:`

```javascript
import wechatOauth from 'wechat-oauth-middleware'

const oauth = wechatOauth({
  appId: '',
  appSecret: '',
  host: ''
})

export default function (context) {
  if (!context.isServer) {
    return
  }

  context.res.redirect = context.redirect
  return new Promise((resolve, reject) => {
    oauth(context.req, context.res, resolve)
  })
}
```

`pages/login.vue:`

```javascript
<script>
export default {
  middleware: ['oauth'],
  asyncData (context) {
    return {
      wxUser: context.req.wxUser
    }
  },
  mounted () {
    alert(JSON.stringify(this.wxUser, null, 2))
  }
}
</script>
```

### 单页面应用

适用于单页应用的子页面获取用户信息。
将页面重定向到类似如下地址：`'http://xxx.com/oauth?hash_style=1&oauth_redirect=' + encodeURIComponent(location.href)`
> 注意：
> - 这里的`http://xxx.com/`需替换为`node`端服务的域名
> - 路径`/oauth`需替换为`oauth`中间件挂载的路由
> - `location.href`替换为需要获取用户信息的页面地址
> - 如果页面路由为hash风格的就需要`hash_style=1`,否则不需要。

```javascript
// node 端，域名为http://xxx.com，挂载路由为 /oauth
const express = require('express')
const oauth = require('wechat-oauth-middleware')
const app = express()

const oauthMiddleware = oauth({
  appId: '',
  appSecret: '',
  host: '' // 填入微信公众号回调域名
})

app.get('/oauth', oauth)

app.listen(3000)
```

### wechatOauthMiddleware(options)

##### options 对象属性
| 名称              | 类型               | 必填   | 描述                                       |
| --------------- | ---------------- | ---- | ---------------------------------------- |
| appId           | string           | 是    | 微信公众号appId                               |
| appSecret       | string           | 是    | 微信公众号appSecret                           |
| host            | string           | 是    | 微信公众号设置的回调域名                             |
| [proxy](#proxy) | string           | 否    | 代理域名。解决微信公众号只能设置一个回调域名的限制。               |
| scope           | string           | 否    | 微信授权类型，可选`snsapi_base`和`snsapi_userinfo`。默认为`snsapi_base`。 |
| noWechat        | boolean & string | 否    | 当用户用非微信浏览器打开时，是否显示提醒页面。<br/>为`true`表示显示内置页面，也可以指定自定义`html`页面文件地址。 |

### proxy

解决一个微信公众号只能设置一个回调域名的限制。让多个域名共用一个OAuth接口。

### How to use `proxy` ？

### Proxy server

先部署一个代理服务器。

```javascript
const express = require('express')
const oauth = require('wechat-oauth-middleware')
const app = express()

app.use(oauth({
  appId: '',
  appSecret: '',
  host: '' // 填入微信公众号回调域名。在域名服务商那里设置好域名，解析到当前主机，用反向代理代理到当前服务启动的端口。
}))

app.listen(3000)
```

### Work server

工作服务器，可多个都使用代理服务器来获取用户信息。

```javascript
const express = require('express')
const oauth = require('wechat-oauth-middleware')
const app = express()

app.use(oauth({
  appId: '',
  appSecret: '',
  host: '', // 填入工作服务器的域名
  proxy: '' // 填入代理服务器的域名
}))

app.get('/', (req, res) => {
  console.log(req.wxUser || req.session.wxUser)
})

app.listen(3001)
```
