# wechat-oauth-middleware

用于微信网页授权，获取用户信息

- 两种模式
  - 如果是服务器需要保存用户的授权信息，则使用中间件，在中间件下游通过请求对象的**wx**属性拿到用户信息。
  - 如果是浏览器端要展示用户授权信息，则使用转发模式。服务器配置好一个端点，当前端页面需要获取用户信息时，利用 `location.href` 重定向到配置好的端点，重定向时带上 **referer** 参数，值为当前页面的链接，经过 **页面A => 服务器B => 微信授权页C => 服务器B => 页面A**，最后在页面A 的 `location.href` 中获取用户信息。

- 搭配三种常用的 web 框架
  - express
  - koa
  - 原生 http 模块

### Usage
```bash
npm i wechat-oauth-middleware -S
```

### OAuth(opt)

- `opt` \<Object\>
  - `appId` \<string\> 必填，微信公众号appId
  - `appSecret` \<string\> 必填，微信公众号appSecret
  - `scope` \<string\> 微信授权类型，可选`snsapi_base`和`snsapi_userinfo`。默认为`snsapi_base`。

### 搭配 Koa 框架

```javascript
const Koa = require('koa')
const OAuth = require('wechat-oauth-middleware')

const app = new Koa()
const oauth = OAuth({
    appId: 'xxx',
    appSecret: 'xxx',
	scope: OAuth.SCOPE_USER_INFO
})

// 使用中间件
app.use(oauth.koa)
// 获取到的用户信息放在 ctx.wx 属性上
app.use(async (ctx) => {
    console.log(ctx.wx)
    ctx.body = 'ok'
})

app.listen(3000)
```

### 搭配 express 框架

```javascript
const express = require('express')
const OAuth = require('wechat-oauth-middleware')

const app = express()
// 配置中间件
const oauth = OAuth({
	appId: 'xxx',
	appSecret: 'xxx',
	scope: OAuth.SCOPE_USER_INFO
})

// 配置错误处理
app.use((err, req, res, next) => {
    console.warn(err)
    res.status(500).end('fail')
})

// 配置路由，使用中间件，获取到的用户信息会放到请求对象的wx属性上
app.get('/wechat/login', oauth.express, (req, res) => {
	console.log(req.wx)
	res.end('ok')
})

app.listen(3000)
```

### 搭配原生 http 模块

```javascript
const http = require('http')
const OAuth = require('wechat-oauth-middleware')

// 配置中间件
const oauth = OAuth({
	appId: 'xxx',
	appSecret: 'xxx',
	scope: OAuth.SCOPE_USER_INFO
})

const server = http.createServer((req, res) => {
    // 将请求对象和响应对象传入中间件，在回调中可以拿到错误对象和用户信息
    oauth.native(req, res, (err, ret) => {
        if (err) {
            console.error(err)
            res.status(500).end('fail')
            return
        }
        console.log(ret)
        res.end('ok')
    })
})

server.listen(3000)
```

### 转发模式

用于前端展示用户的信息

##### 在服务器A.com配置授权端点，以express框架为例

```javascript
const express = require('express')
const OAuth = require('wechat-oauth-middleware')

const app = express()
const oauth = OAuth({
    appId: 'xxx',
    appSecret: 'xxx',
    scope: OAuth.SCOPE_USER_INFO
})

// 将 express 属性传入 forward 方法获得转发功能
// 此时授权端点为 http://A.com/auth
app.get('/auth', oauth.forward(oauth.express))

app.listen(3000)

```

##### 在前端页面需要用户信息时，重定向到授权端点

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Document</title>
</head>
    <script>
        let query = {}
        // 解析地址栏的参数
        if (location.search) {
            location.search.slice(1).split('&').forEach(raw => {
                let map = raw.split('=')
                query[map[0]] = decodeURIComponent(map[1])
            })
        }
        // 判断是否已经拿到数据
        if (query.openid) {
            // 如果地址栏已经有用户信息，则输出到页面
            document.write('<pre>' + JSON.stringify(query, null, 4) + '</pre>')
        } else {
            // 重定向到配置好的端点，要带上 referer 参数，获取到用户信息后才能正确跳转回当前页面
            location.href = 'http://A.com/auth?referer=' + encodeURIComponent(location.href)
        }
    </script>
</body>
</html>
```

##### Koa 配置转发端点示例

```javascript
const Koa = require('koa')
const router = require('koa-router')()
const OAuth = require('wechat-oauth-middleware')

const app = new Koa()
const oauth = OAuth({
    appId: 'xxx',
    appSecret: 'xxx',
    scope: OAuth.SCOPE_USER_INFO
})

router.get('/auth', oauth.forward(oauth.koa))
app.use(router.routes())

app.listen(3000)
```

##### 原生 http 包配置转发端点示例

```javascript
const http = require('http')
const OAuth = require('wechat-oauth-middleware')
const oauth = OAuth({
    appId: 'xxx',
    appSecret: 'xxx',
    scope: OAuth.SCOPE_USER_INFO
})

http.createServer(oauth.forward(oauth.native)).listen(3000)
```