const fs = require('fs')
const mongoose = require('mongoose')
require('mongoose-schema-jsonschema')(mongoose)
const json2ts = require('json-schema-to-typescript')

const Model = require('./index')

const output = {
  Api: []
}

for(let key in Model.Types){
  const model = Model.Types[key]
  const schema = mongoose.Schema(model.Schema)
  let jsonSchema = schema.jsonSchema()

  jsonSchema.title = model.Type

  output.Api.push(jsonSchema)

  json2ts.compile(jsonSchema).then( ts=>{
    fs.writeFileSync('dist/'+model.Type+'.d.ts', ts)
  })

}

console.log( JSON.stringify(output, null, 2) )