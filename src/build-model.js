const fs = require('fs')
const Path = require('path')
const pify = require('pify')
const debug = require('debug')('build.model')
const mongoose = require('mongoose')

const Hoek = require('@hapi/hoek')
const gitRefs = require('git-refs')
const {JSONPath} = require('jsonpath-plus')
require('mongoose-schema-jsonschema')(mongoose)
const json2ts = require('json-schema-to-typescript')



const buildModel = async function(
  {
    name,
    pkgPath,
    gitPath,
    modelPath='./index.js',
    outputPath='./dist',
    buildTypeScript=true
  }={}
){
  const Model = require(modelPath)

  const output = {
    Package: {},
    IndexSettings: {},
    JSONSchema: [],
    Permissions: {}
  }
  
  if(pkgPath){
    debug('loading pkg', pkgPath)

    const pkg = require(pkgPath)

    output.Package.name = pkg.name
    output.Package.version = pkg.version
  }

  if(gitPath){
    const refs = await pify( gitRefs ) (gitPath)

    output.Package.githash = refs.HEAD
  }

  const tsWrites = []
  const tsOutput = {}

  for(let key in Model.Types){
    const model = Model.Types[key]
    let schema = mongoose.Schema(model.Schema)
    schema = model.setupSchema(schema)
    let jsonSchema = schema.jsonSchema()

    jsonSchema.title = model.Type

    output.Permissions[model.Type] = await model.permissions()
    output.JSONSchema.push(jsonSchema)

    debug('\t','type',model.Type)

    let indexed = JSONPath({
      path: '$..options.index',
      json:schema.paths,
      resultType: 'pointer'
    }).map(p=>{return p.split('/')[1]})

    debug('\t\tindexed', indexed)

    let unique = JSONPath({
      path: '$..options.unique',
      json:schema.paths,
      resultType: 'pointer'
    }).map(p=>{
      debug(typeof p)
      if(typeof p == 'string'){
        return p.split('/')[1]
      }
      
      return p
    })

    debug('\t\tunique', unique)

    debug('\t\tindexes', schema._indexes)

    let compoundIndices = {
      indices: Hoek.reach(schema, '_indexes.0.0'),
      unique: Hoek.reach(schema, '_indexes.0.1.unique')
    }

    output.IndexSettings[model.Type] = {
      indices: indexed,
      unique,
      compoundIndices
    }

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
    JSON: jsonSchemaStr,
    JSONSchema: output.JSONSchema,
    IndexSettings: output.IndexSettings,
    TypeScript: tsOutput
  }
}

module.exports = buildModel
