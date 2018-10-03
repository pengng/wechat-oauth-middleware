const urlParser = require('url')
const { URL } = urlParser

const { getAuthURL, getTokenURL, getUserURL, CODE_INVALID, CODE_USED } = require('./wechat-api')
const { getVal, httpGet } = require('./util')

const OAuth = function (opt) {

    let { appId, appSecret, scope } = opt

    /**
     * 
     * @param {string} url 当前URL
     * @param {Function} redirect 重定向函数
     * @param {Function} cb 回调
     */
    const route = function(url, redirect, cb) {

        let urlObj = new URL(url)
        // 获取URL中的code参数
        let code = urlObj.searchParams.get('code')

        if (code) {
            // 如果请求参数包含 code, 则用 code 换取 token
            let tokenURL = getTokenURL(appId, appSecret, code)
            httpGet(tokenURL, function (err, ret) {
                if (err) {
                    return cb(err)
                }

                let { errcode, openid, access_token, refresh_token } = ret
                if (errcode === CODE_INVALID || errcode === CODE_USED) {
                    // 如果发现授权 code 无效或已被使用过，则重定向获取可用 code
                    let authURL = getAuthURL(appId, url, scope)
                    redirect(authURL)
                    // 当前HTTP事务结束，需等待下一次HTTP事务，此时回调实参没有错误，也没有用户信息
                    return cb()
                } else if (errcode) {
                    // 其他类型的错误则返回错误信息
                    return cb(ret)
                }

                // 用 openid 和 access_token 获取用户授权信息
                let userURL = getUserURL(openid, access_token)
                httpGet(userURL, function (err, ret) {
                    if (err) {
                        return cb(err)
                    }
                    // 将 access_token 和 refresh_token 混合进返回的数据对象，业务功能可能需要
                    Object.assign(ret, { access_token, refresh_token })
                    cb(null, ret)
                })
            })
        } else {
            // 其他情况则重定向到微信授权链接
            let authURL = getAuthURL(appId, url, scope)
            redirect(authURL)
            // 当前HTTP事务结束，需等待下一次HTTP事务，此时回调实参没有错误，也没有用户信息
            cb()
        }
    }

    // 用于 express 框架的中间件
    let express = function (req, res, next) {
        let scheme = req.protocol
        // 若使用了 Nginx 等代理服务器，则需配置 Nginx 转发 Host 请求头部
        let host = getVal(req.headers, 'X-Forwarded-Host') || getVal(req.headers, 'Host')
        let path = req.url
        // 拼接完整的请求URL
        let url = new URL(`${scheme}://${host}${path}`)
        // 重新定义重定向函数
        let redirect = function (url) {
            // 如果HTTP响应头已发送，则不做任何处理，该情况可能在错误使用中间件时出现
            if (res.headersSent) {
                return
            }
            res.redirect(url)
        }
        // 请求结果的分发处理
        let cb = function (err, ret) {
            if (err) {
                // 如果发生错误，则传递给错误中间件
                next(err)
            } else if (ret) {
                // 如果获取到用户信息，放到请求对象上，触发路由的下个处理结点
                req.wx = ret
                next()
            }
            // 如果 ret 不存在，表示当前为第一次的重定向，还没有用户信息，不需要调用 next()
        }
        route(url, redirect, cb)
    }

    // 用于 express 框架的转发处理，将拿到的用户信息通过重定向，用URL传递给其他页面，而不调用next()
    let expressForward = function (req, res) {
        let next = function (err) {
            // 如果HTTP响应头已发送，则不做任何处理，该情况可能在错误使用中间件时出现
            if (res.headersSent) {
                return
            }
            if (err) {
                // 如果发生错误，则返回 500 状态码
                return res.status(500).end()
            }
            // 是否解析URL的query部分
            let parseUrlQuery = true
            let urlObj = urlParser.parse(req.url, parseUrlQuery)
            // 取出重定向的来源页的URL
            let { referer } = urlObj.query
            // 如果来源页未正确传递，则返回404状态码
            if (!referer) {
                return res.status(404).end()
            }

            // 不显式传递 token
            delete req.wx.refresh_token
            delete req.wx.access_token
            let url = new URL(referer)
            // 将拿到的用户信息混合到来源页的query部分
            Object.keys(req.wx).forEach(key => {
                url.searchParams.append(key, req.wx[key])
            })
            res.redirect(url)
        }
        return express(req, res, next)
    }

    // 用于 koa 框架的中间件
    let koa = function (ctx, next) {
        // 完整的请求URL
        let url = ctx.href
        let redirect = ctx.redirect.bind(ctx)
        return new Promise(function (resolve, reject) {
            // 请求结果的分发处理
            let cb = function (err, ret) {
                if (err) {
                    // 如果发生错误，则触发错误中间件
                    reject(err)
                } else if (ret) {
                    // 如果获取到用户信息，放到请求对象上，触发路由的下个处理结点
                    ctx.wx = ret
                    next().then(resolve)
                } else {
                    // 如果 ret 不存在，表示当前为第一次的重定向，还没有用户信息，不需要调用 next()，只需变更 promise 为 resolved
                    resolve()
                }
            }
            route(url, redirect, cb)
        })
    }

    // 用于 koa 框架的转发处理
    let koaForward = function (ctx) {
        let next = function () {
            let url = new URL(ctx.href)
            // 从当前URL参数中取referer，做为重定向的目标
            let referer = url.searchParams.get('referer')
            url = new URL(referer)
            // 不显式传递 token
            delete ctx.wx.refresh_token
            delete ctx.wx.access_token
            // 将拿到的用户信息混合到来源页的query部分
            Object.keys(ctx.wx).forEach(key => {
                url.searchParams.append(key, ctx.wx[key])
            })
            ctx.redirect(url)
            return Promise.resolve()
        }
        return koa(ctx, next)
    }

    // 用于 http 包的中间件
    let native = function (req, res, cb) {
        let scheme = req.socket.encrypted ? 'https' : 'http'
        // 若使用了 Nginx 等代理服务器，则需配置 Nginx 转发 Host 请求头部
        let host = getVal(req.headers, 'X-Forwarded-Host') || getVal(req.headers, 'Host')
        let path = req.url
        // 拼接完整的请求URL
        let url = new URL(`${scheme}://${host}${path}`)
        // 定义重定向函数
        let redirect = function (url) {
            res.statusCode = 302
            res.setHeader('Location', url)
            res.end()
        }
        // 请求结果的分发处理
        let func = function (err, ret) {
            if (err || ret) {
                // 如果发生错误或成功获取到用户信息，则传递给回调
                cb(err, ret)
            }
            // 如果是第一次为了获取 code 而重定向，此时不会错误对象和用户信息，不需要回调
        }
        route(url, redirect, func)
    }

    // 用于 http 包的转发处理
    let nativeForward = function (req, res) {
        let redirect = function (url) {
            res.statusCode = 302
            res.setHeader('Location', url)
            res.end()
        }
        let cb = function (err, ret) {
            if (err) {
                // 如果发生错误，则返回 500 状态码
                res.statusCode = 500
                return res.end()
            }
            // 是否解析URL的query部分
            let parseUrlQuery = true
            let urlObj = urlParser.parse(req.url, parseUrlQuery)
            // 取出重定向的来源页的URL
            let { referer } = urlObj.query
            // 如果来源页未正确传递，则返回404状态码
            if (!referer) {
                res.statusCode = 404
                return res.end()
            }

            // 不显式传递 token
            delete ret.refresh_token
            delete ret.access_token
            let url = new URL(referer)
            // 将拿到的用户信息混合到来源页的query部分
            Object.keys(ret).forEach(key => {
                url.searchParams.append(key, ret[key])
            })
            redirect(url)
        }
        return native(req, res, cb)
    }

    let forward = function (middleware) {
        if (middleware === express) {
            return expressForward
        } else if (middleware === koa) {
            return koaForward
        } else if (native) {
            return nativeForward
        }
    }

    return { express, koa, native, forward }
}

module.exports = OAuth