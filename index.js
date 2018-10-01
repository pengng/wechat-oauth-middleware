let { SCOPE_BASE, SCOPE_USER_INFO } = require('./lib/wechat-api')
let OAuth = require('./lib/OAuth')
Object.assign(OAuth, { SCOPE_BASE, SCOPE_USER_INFO })

module.exports = OAuth