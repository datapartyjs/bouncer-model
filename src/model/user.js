'use strict';

const Hoek = require('@hapi/hoek')
const mongoose = require("mongoose")
require("mongoose-schema-jsonschema")(mongoose)
const debug = require('debug')('bouncer.model.user')

const Utils = require('../utils')
const Model = require('../model.js')



class User extends Model {

  static get Type () { return 'user' }

  static get Schema () {
    return {
      name: { type: String, maxlength: 50, minlength: 3, unique: true },
      photo: { type: String, maxlength: 500, description: 'user photo url' },
      created: Utils.created,
      enabled: Boolean,
      profile: Utils.profile,
      tutorial: {
        done: Boolean
      }
    }
  }

  static async permissions (context) {
    return {
      read: true,
      new: false,
      change: true
    }
  }

  static async fromCloud(cloud){
    let actor = {
      id: Hoek.reach(cloud, 'actor.id'),
      type: Hoek.reach(cloud, 'actor.type')
    }

    return new Promise((resolve,reject)=>{
      if(!actor.id){
        debug('cloud has no associated user')
    
        let loginName = Hoek.reach(Utils.metadataValue(cloud, 'account'), 'data.login')
    
        let createUser = this.isNameTaken(loginName).then(taken => {
          if(taken){ return undefined }
          return loginName
        }).then(name=>{
    
          let photoUrl = Hoek.reach(Utils.metadataValue(cloud, 'account'), 'data.avatar_url')
    
          debug(name)

          let user = new (mongoose.model('api_user'))({
            name: name || null,
            profile: {
              photo: photoUrl
            },
            enabled: false
          })
    
          return user.save().then(savedUser=>{
            cloud.actor = {
              id: savedUser.id,
              type: 'user'
            }

            cloud.increment()

            return cloud.save().then(()=>{
              return savedUser
            })
          })
        })

        return resolve(createUser)
      }

      return resolve(mongoose.model('api_user').findOne({_id: actor.id}).exec())
    })
  }

  static async isNameTaken(name){
    return this.find({name: name}).then(users=>{
      return users.length > 0 
    })
  }

  async updateAgreement(legal, identity, session){
    if(this.hasAgreed(legal)){
      return this
    }

    this.agreements[legal.document] = {
      legal: legal._id,
      identity: identity._id,
      session: session._id,
      signed: Date.now()
    }

    this.increment()

    return this.save()
  }
}

module.exports = User
