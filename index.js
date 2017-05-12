const OAuth = require('./OAuth');

module.exports = function (option) {

  var oauth = new OAuth(option);
  return oauth.wxLogin.bind(oauth);

}