var OAuth = require('./lib/OAuth')

module.exports = function (option) {

  var oauth = new OAuth(option)
  return oauth.wxLogin.bind(oauth)

}