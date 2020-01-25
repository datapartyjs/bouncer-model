const fs = require('fs')
const Path = require('path')
const mongoose = require('mongoose')
require('mongoose-schema-jsonschema')(mongoose)
const json2ts = require('json-schema-to-typescript')


const buildModel = async function(
  {
    name,
    modelPath='./index.js',
    outputPath='./dist',
    buildTypeScript=true
  }={}
){
  const Model = require(modelPath)

  const output = {
    Api: []
  }
  
  const tsWrites = []
  const tsOutput = {}

  for(let key in Model.Types){
    const model = Model.Types[key]
    const schema = mongoose.Schema(model.Schema)
    let jsonSchema = schema.jsonSchema()

    jsonSchema.title = model.Type

    output.Api.push(jsonSchema)

    if(buildTypeScript){
      
      const tsWrite = json2ts.compile(jsonSchema).then( ts=>{
        tsOutput[model.Type] = ts
        const tsPath = Path.join(outputPath, model.Type + '.d.ts')
        fs.writeFileSync(tsPath, ts)
      })
      
      tsWrites.push(tsWrites)
      
    }

  }
  
  if(buildTypeScript){ await Promise.all(tsWrites) }
  
  const jsonSchemaStr = JSON.stringify(output, null, 2)
  const jsonSchemaPath = Path.join(outputPath, name+'-model.json')
  fs.writeFileSync(jsonSchemaPath, jsonSchemaStr)
  
  return {
    SchemePath: jsonSchemaPath,
    Api: output.Api,
    JSON: jsonSchemaStr,
    TypeScript: tsOutput
  }
}

module.exports = buildModel
