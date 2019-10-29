const debug = require('debug')('bouncer.Model')


module.exports = class Model {
  super(){
    /*
    this.ownerFields = ['owner', 'admins']
    this.memberFields = ['members', 'devices']
    */
  }

  static install(mongoose){
    debug('install - ', this.Type)

    let schema = mongoose.Schema(this.Schema)

    /*schema =*/ this.setupSchema(schema)

    schema.loadClass(this)

    const name = this.Type
    const title = 'api_' + name

    let model = mongoose.model(title, schema, title)

    return { schema, model }
  }

  static setupSchema(schema){
    return schema
  }

  static get Schema (){
    throw new Error('not implemented')
  }

  static get Type (){
    throw new Error('not implemented')
  }

  /*static get Class(){
    throw new Error('not implemented')
  }*/

  /**
   * Collection level read/new/change permissions
   * @param {*} context 
   */
  static permissions(context){
    throw new Error('not implemented')
  }
}
