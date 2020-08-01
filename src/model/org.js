'use strict';


const Utils = require('../utils')
const Model = require('../itype.js')

class Org extends Model {

  static get Type () { return 'org' }

  static get Schema(){
    return {
      name: { type: String, maxlength: 50, unique: true},
      created: Utils.created,
      enabled: Boolean,
      admins: [Utils.actor('user')],
      profile: Utils.profile
    }
  }

  static async permissions (context) {
    return {
      read: true,
      new: true,
      change: true
    }
  }
}

module.exports = Org