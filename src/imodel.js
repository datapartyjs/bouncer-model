const debug = require('debug')('bouncer.IModel')

class IEndpoint {
  constructor(){

  }
}

class IMiddleware {
  constructor({
    name, description, config_schema
  }){

  }

  async run(context){
    throw new Error('not implemented')
  }
}

module.exports = class IService {
  constructor({
    name, version
  }){

    this.constructors = {
      types: {},
      documents: {},
      endpoints: {},
      middleware: {
        pre: {},
        post: {}
      }
    }

    this.sources = {
      schema: {},
      documents: {},
      endpoints: {},
      middleware: {
        pre: {},
        post: {}
      }
    }
   }


  static get Types(){}
  static get Documents(){}

  async compile(){

  }

  addType(name, type){

  }

  addDocument(name, document){

  }

  addEndpoint(endpoint_path){

  }

  addMiddleware(type='pre', middleware_path){

  }

  async run(context){

  }
}
