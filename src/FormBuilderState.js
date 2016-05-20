import {clone} from 'lodash'
import {getFieldType} from './utils/getFieldType'

// function createValueNode(value, valueWrappper) {
//   return {
//     value: value,
//     wrapper: valueWrappper
//   }
// }

class DefaultContainer {
  constructor(value, context) {
    this.value = value
    this.context = context
  }

  patch(patch) {
    if (patch.hasOwnProperty('$set')) {
      return new DefaultContainer(patch.$set, this.context)
    }
    throw new Error(`Only $set is supported by default value container, got: ${JSON.stringify(patch)}`)
  }

  unwrap() {
    return this.value
  }
}

class ObjectContainer {
  constructor(value, context) {
    this.context = context
    this.value = value
  }

  getFieldValue(fieldName) {
    return this.value ? this.value[fieldName] : void 0
  }

  patch(patch) {
    const {value, context} = this
    const {field, schema, resolveContainer} = context

    const type = getFieldType(schema, field)
    const newVal = value ? clone(value) : {$type: type.name}

    if (patch.hasOwnProperty('$set')) {
      return ObjectContainer.wrap(patch.$set, context)
    }

    Object.keys(patch).forEach(keyName => {
      if (!type.fields.hasOwnProperty(keyName)) {
        throw new Error(`Type ${type.name} has no field named ${keyName}`)
      }

      const fieldDef = type.fields[keyName]

      if (!newVal.hasOwnProperty(keyName)) {
        newVal[keyName] = createFieldValue(void 0, {field: fieldDef, schema: context.schema, resolveContainer})
      }
      newVal[keyName] = newVal[keyName].patch(patch[keyName])
    })
    return new ObjectContainer(newVal, context)
  }

  unwrap() {
    if (!this.value) {
      return this.value
    }
    const result = Object.assign(Object.create(null), {
      $type: this.context.field.type
    })

    Object.keys(this.value).forEach(fieldName => {
      if (fieldName === '$type') {
        return
      }
      const fieldVal = this.value[fieldName].unwrap()
      if (fieldVal !== void 0) {
        result[fieldName] = fieldVal
      }
    })
    return result
  }
}

ObjectContainer.wrap = function wrap(value, context) {
  if (!value) {
    return new ObjectContainer(value, context)
  }
  const {field, schema, resolveContainer} = context
  const type = getFieldType(schema, field)
  const wrappedValue = {$type: field.type}

  Object.keys(type.fields).forEach(fieldName => {
    if (value[fieldName] === void 0) {
      return
    }
    const fieldDef = type.fields[fieldName]
    wrappedValue[fieldName] = createFieldValue(value[fieldName], {field: fieldDef, schema, resolveContainer})
  })
  return new ObjectContainer(wrappedValue, context)
}


function createFieldValue(value, context) {

  const {schema, field, resolveContainer} = context

  if (!field) {
    throw new Error('Missing field')
  }

  const fieldType = getFieldType(schema, field)

  const ResolvedContainer = resolveContainer(field, fieldType)

  if (ResolvedContainer) {
    return new ResolvedContainer.wrap(value, context)
  }

  if (fieldType.type === 'object') {
    // create value nodes for each field in schema type
    return ObjectContainer.wrap(value, {field, schema, resolveContainer})
  }

  if (fieldType.type === 'array') {
    // create value nodes for each item in value
  }

  return new DefaultContainer(value, context)
}

const noop = () => {}

export function createFormBuilderState(value, {type, schema, resolveContainer}) {
  const context = {
    schema: schema,
    field: {type: type.name},
    resolveContainer: resolveContainer || noop
  }
  return createFieldValue(value, context)
}
