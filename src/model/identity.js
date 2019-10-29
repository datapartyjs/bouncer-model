"use strict";
const mongoose = require("mongoose")
require("mongoose-schema-jsonschema")(mongoose)

const debug = require("debug")("bouncer.model.identity")

const Utils = require('../utils')
const Model = require('../model.js')

class Identity extends Model {

  static get Type () { return 'identity' }

  static get Schema () {
    return {
      owner: Utils.actor(["user", "device", "app"]),
      key: {
        public: {
          box: { type: String, unique: true, index: true },
          sign: { type: String, unique: true, index: true }
        },
        note: { type: String, maxlength: 100 },
        type: {
          enum: ["ecdsa", "ecc"],
          type: String
        }
      },
      name: { type: String, maxlength: 30 },
      created: Utils.created,
      enabled: Boolean,
      tags: [{ type: String, maxlength: 20 }],
      metadata: [
        {
          key: { type: String, maxlength: 50 },
          value: { type: String, maxlength: 1500 }
        }
      ],
      is_actor: {
        type: Boolean,
        default: true
      }
    }
  }

  static async permissions (context) {
    return {
      read: true,
      new: true,
      change: false
    }
  }

  static async isKeyAssociatedWithActor(actor, key){
    let identity = await mongoose.model("api_identity")
      .findOne({
        "owner.id": actor.id,
        "owner.type": actor.type,
        "key.public": key.public,
        "key.type": key.type,
        enabled: true
      })
      .exec()

    if (!identity) { return false }

    return true
  }

  static async exists(key){
    let identity = await mongoose.model("api_identity")
      .findOne({
        "key.public": key.public,
        "key.type": key.type
      })
      .exec()

    if (!identity) { return false }

    return true
  }

  static async fromActorKey(actor, key, enabled){
    const id = await mongoose.model("api_identity")
      .findOne({
        "owner.id": actor.id,
        "owner.type": actor.type,
        "key.public": key.public,
        "key.type": key.type
      })
      .exec()

    if(id){ return id }

    const keyExists = await mongoose.model("api_identity").exists(key)

    if (keyExists) {
      debug("ERROR - duplicate public key");
      debug({ actor, key });
      return Promise.reject("public key rejected");
    }

    let identity = new (mongoose.model("api_identity"))({
      owner: actor,
      key: key,
      enabled: enabled || false
    });

    return identity.save()
  }
  
}


module.exports = Identity
