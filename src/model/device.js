'use strict';


const Utils = require('../utils')
const Model = require('../model.js')

class Device extends Model {

  static get Type () { return 'device' }

  static get Schema(){
    return {
      name: { type: String, maxlength: 50, required: true },
      created: Utils.created,
      owner: Utils.actor(['user', 'org', 'team']),
      config: Utils.doc('device_config'),
      profile: Utils.profile,
      model: { type: String, maxlength: 20 },
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



module.exports = Device