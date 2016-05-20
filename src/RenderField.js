import React, {PropTypes} from 'react'
import FormBuilderPropTypes from './FormBuilderPropTypes'
import equals from 'shallow-equals'
import basicTypes from './types'
import {resolveJSType} from './types/utils'
import {getFieldType} from './utils/getFieldType'

const BASIC_TYPE_NAMES = Object.keys(basicTypes)
const CLEAR_BUTTON_STYLES = {fontSize: 10, border: '1px solid #aaa', backgroundColor: 'transparent'}

export default React.createClass({
  propTypes: {
    field: FormBuilderPropTypes.field.isRequired,
    fieldName: PropTypes.string.isRequired,
    value: PropTypes.any,
    onChange: PropTypes.func
  },

  contextTypes: {
    resolveFieldInput: PropTypes.func,
    schema: FormBuilderPropTypes.schema
  },

  shouldComponentUpdate(nextProps) {
    return !equals(nextProps, this.props)
  },

  renderField(el) {
    const {field, fieldName} = this.props
    return (
      <fieldset key={fieldName}>
        <h1>
          {field.title} ({fieldName})
        </h1>
        <button
          style={CLEAR_BUTTON_STYLES}
          type="button"
          title="Clear value"
          onClick={() => this.handleChange()}
        >
          x
        </button>
        {el}
      </fieldset>
    )
  },

  handleChange(event) {
    const {fieldName, onChange} = this.props
    onChange(event, fieldName)
  },

  resolveFieldInput(field, fieldType) {
    return this.context.resolveFieldInput(field, fieldType)
  },

  getFieldType(field) {
    return getFieldType(this.context.schema, field)
  },

  render() {
    const {value, field, fieldName} = this.props

    const fieldType = this.getFieldType(field)

    // wont check wrapped field values since unwrapping may be costly
    // if (value) {
    //
    //   const basicType = basicTypes[fieldType.type]
    //
    //   const valueType = resolveJSType(value)
    //
    //   if (valueType !== fieldType.type && valueType !== basicType.primitive) {
    //     // eslint-disable-next-line no-console
    //     console.warn(
    //       'Value of field %s is of type %s which is incompatible with the basic type %s',
    //       fieldName,
    //       fieldType.type,
    //       valueType
    //     )
    //   }
    // }

    const FieldInput = this.context.resolveFieldInput(field, fieldType)
    if (!FieldInput) {
      return (
        <div>Field input not found for field of type "{field.type}"
          <pre>{JSON.stringify(field, null, 2)}</pre>
        </div>
      )
    }

    return this.renderField(
      <FieldInput
        value={value}
        field={field}
        type={fieldType}
        onChange={this.handleChange}
      />
    )
  }
})
