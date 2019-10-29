'use strict';


const Utils = require('../utils')
const Model = require('../model.js')

class Team extends Model {

  static get Type () { return 'team' }

  static get Schema(){
    return {
      owner: Utils.actor('org'),  // Org id
      admins: [Utils.actor('user')],
      members: [Utils.actor('user')],
      name: { type: String, maxlength: 50},
      profile: Utils.profile,
      created: Utils.created,
      tags: [{ type: String, maxlength: 20 }],
      metadata: [{
        key: { type: String, maxlength: 50 },
        value: { type: String, maxlength: 1500 }
      }]
    }
  }

  static setupSchema(schema){
    schema.index({name: 1, 'owner.id': 1, 'owner.type':1}, {unique: true})
    return schema
  }

  static async permissions (context) {
    return {
      read: true,
      new: true,
      change: true
    }
  }
}

module.exports = Team