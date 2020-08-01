exports.generateGenericModel = function({JSONSchema, IndexSettings, Permissions}){

  return class GenericModel extends BouncerModel {
  
    static get Schema(){
      return {
        'ajv-schema': JSONSchema
      }
    }

    static get Type(){
      return JSONSchema.title
    }
  
    static async permissions(){
      return Permissions
    }
  }
}