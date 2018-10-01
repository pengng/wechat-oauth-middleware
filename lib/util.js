const https = require('https')

// https get 请求
const httpGet = function (url, cb) {
    https.get(url, function (res) {
        let buf = []
        res.on('error', cb).on('data', Array.prototype.push.bind(buf)).on('end', function () {
            let body = Buffer.concat(buf)
            // 尝试解析报文主体
            try {
                body = JSON.parse(body)
            } catch (err) {
                return cb(err)
            }
            cb(null, body)
        })
    }).on('error', cb)
}

// 获取对象属性值，忽略键名大小写
const getVal = function (obj, key) {
    key = key.toLowerCase()
    // 挨个对比找到真实的键名
    let realKey = Object.keys(obj).find(k => k.toLowerCase() === key)
    return obj[realKey]
}

module.exports = { httpGet, getVal }