const { URL, URLSearchParams } = require('url')

// 获取授权URL
const AUTHORIZE_URL = 'https://open.weixin.qq.com/connect/oauth2/authorize'
// 获取微信用户信息API
const USERINFO_URL = 'https://api.weixin.qq.com/sns/userinfo'
// 获取 access_token API
const ACCESS_TOKEN_URL = 'https://api.weixin.qq.com/sns/oauth2/access_token'

// 两种 scope 
const SCOPE_BASE = 'snsapi_base'
const SCOPE_USER_INFO = 'snsapi_userinfo'

// 授权 code 无效
const CODE_INVALID = 40029
// 授权 code 已经使用过
const CODE_USED = 40163

// 获取授权链接
const getAuthURL = function (appid, redirect_uri, scope = SCOPE_BASE) {

    // 不需要手动URL编码 redirect_uri, URLSearchParams 包含 URL编码功能
    let query = {appid, redirect_uri, response_type: 'code', scope, state: ''}

    let url = new URL(AUTHORIZE_URL)
    // 设置URL参数
    url.search = new URLSearchParams(query)
    // 设置URL片段部分
    url.hash = 'wechat_redirect'
    return url
}

// 用 code 换取 access_token
const getTokenURL = function(appid, secret, code) {

    let query = {appid, secret, code, grant_type: 'authorization_code'}

    let url = new URL(ACCESS_TOKEN_URL)
    // 设置URL参数
    url.search = new URLSearchParams(query)
    return url
}

// 获取微信用户信息
const getUserURL = function(openid, access_token) {
    let query = {openid, access_token, lang: 'zh_CN'}

    let url = new URL(USERINFO_URL)
    // 设置URL参数
    url.search = new URLSearchParams(query)
    return url
}

module.exports = { getAuthURL, getTokenURL, getUserURL, SCOPE_BASE, SCOPE_USER_INFO, CODE_INVALID, CODE_USED }