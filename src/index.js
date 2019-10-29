const TYPES = {
  Acl: require('./model/acl'),
  Org: require('./model/org'),
  User: require('./model/user'),
  Team: require('./model/team'),
  Device : require('./model/device'),
  Identity: require('./model/identity')
}

const Model = require('./model')

exports.Model = Model
exports.Types = TYPES
exports.Utils = require('./utils')
