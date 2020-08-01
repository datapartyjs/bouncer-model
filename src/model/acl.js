'use strict';
const mongoose = require('mongoose')
require('mongoose-schema-jsonschema')(mongoose);
const Hoek = require('@hapi/hoek')
const debug = require('debug')('bouncer.model.acl')

const Utils = require('../utils')
const Model = require('../itype.js')

class Acl extends Model {
  static get Type () { return 'acl' }

  static get Schema () {
    const AclActor = {
      id: mongoose.Schema.ObjectId,
      relation: {
        enum: ['owner', 'admins', 'members', 'devices'],
        type: String
      },
      type: {
        enum: ['user', 'org', 'team', 'device', 'identity'],
        type: String
      }
    }

    return {
      created: Utils.created,
      resource: {
        id: mongoose.Schema.ObjectId,
        type: {type: String}
      },
      defaults: {
        read: Boolean,
        change: Boolean,
        publish: Boolean,
        subscribe: Boolean
      },
      permissions: [{
        field: { type: String, maxlength: 500, default: '' },
        actions: {
          read: [{
            actor: AclActor,
            allowed: Boolean
          }],
          change: [{
            actor: AclActor,
            allowed: Boolean
          }],
          publish: [{
            actor: AclActor,
            allowed: Boolean
          }],
          subscribe: [{
            actor: AclActor,
            allowed: Boolean
          }]
        }
      }]
    }
  }

  static setupSchema(schema){
    schema.index({resource: {id: 1, type:1}}, {unique: true})
    return schema
  }

  static async permissions (context) {
    return {
      read: false,
      new: false,
      change: false
    }
  }

  static findActorInArray(actor, arr){

    if(arr){
      for(let a of arr){
        let id = Hoek.reach(a, 'actor.id')
        let type = Hoek.reach(a, 'actor.type')
        if(type == actor.type && id.toString() == actor.id.toString()){
            debug('found actor in arr')
            return a.allowed
        }
      }
    }
    
    debug('actor not found in arr')
    return undefined
  }
  
  getPermissionsByField(action, field){
    for(let perms of this.permissions){

      if(!Hoek.reach(perms, 'actions.'+action)){ continue }
  
      if((!perms.field && !field) || perms.field == field){
        return perms
      }
    }
  
    return undefined
  }

  isAllowed(actor, action, field){
    let defaultAllowed = Hoek.reach(this, 'defaults.'+action, {default: false})

    if(defaultAllowed == true){ return true }

    if(actor.actors && actor.actors.length > 0){
      // list of actors
      let fieldPerms = this.getPermissionsByField(action, field)
      let actionPermission = Acl.findActorInArray(actor, Hoek.reach(fieldPerms, 'actions.'+action))

      for(let currentActor of actor.actors){
        if(actionPermission){break}
        actionPermission |= Acl.findActorInArray(currentActor, Hoek.reach(fieldPerms, 'actions.'+action)) || false
      }

      return actionPermission

    }

    // single actor
    let fieldPerms = this.getPermissionsByField(action, field)
    let actionPermission = Acl.findActorInArray(actor, Hoek.reach(fieldPerms, 'actions.'+action))

    return actionPermission
  }

  static isOwner(doc, actor){
    return this.isMember(doc, 'owner', actor) || this.isMember(doc, 'admins', actor)
  }

  static isMember(doc, field, actor){
    //! check members &  against each actor.actors
  
    if(!doc || typeof doc !== 'object' || !doc[field]){
      return false
    }
  
    for(let actorIdx of actor.actors) {
  
      if (
        doc[field].type && actorIdx.type
        && doc[field].type === actorIdx.type
        && doc[field].id && actorIdx.id
      ) {
  
        let actorId = (typeof actorIdx.id != 'string') ?
        actorIdx.id.toString() : actorIdx.id
  
        let docFieldId = (typeof doc[field].id != 'string') ?
          doc[field].id.toString() : doc[field].id
  
  
        if(docFieldId == actorId){
          return true
        }
      }
    }
  
    return false
  }

  static aclByResource(resource_id, resource_type){
    return this.findOne({
      'resource.id': resource_id,
      'resource.type': resource_type
    })
  }

  static async aclResourcesByActors(actors, type, action, field){

    let list = actors.map(actor => {
      return {'actor.type': actor.type, 'actor.id': actor.id}
    })
  
    let fieldQuery = {field: field || ''}
  
    fieldQuery[`actions.${action}`] = {
      "$elemMatch": {
        $or: list
      }
    }
  
    let query = {
      permissions : {
        $elemMatch : fieldQuery
      }
    }
  
    if(type){
      query['resource.type'] = type
    }
  
  
    debug(JSON.stringify(query,null,2))
  
    return await this.find(query)
      .select('resource')
      .exec()
  }
}



module.exports = Acl
