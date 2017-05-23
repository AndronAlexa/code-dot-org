import React from 'react';

import {ButtonList} from '../form_components/button_list';
import FieldGroup from '../form_components/FieldGroup';

import {
  FormGroup,
  ControlLabel,
  Table
} from 'react-bootstrap';

const SINGLE_SELECT = 'single_select';
const MULTI_SELECT = 'multi_select';
const FREE_RESPONSE = 'free_response';
const RADIO = 'radio';
const CHECK = 'check';

const questionPropType = React.PropTypes.shape({
  label: React.PropTypes.string.isRequired,
  name: React.PropTypes.string.isRequired,
  required: React.PropTypes.bool,
  type: React.PropTypes.oneOf([
    SINGLE_SELECT, MULTI_SELECT, FREE_RESPONSE, RADIO, CHECK
  ]).isRequired,
  values: React.PropTypes.arrayOf(React.PropTypes.string),
});

const styles = {
  tdLabel: {
    padding: 15,
    verticalAlign: 'inherit'
  },
};

const ColumnVariableQuestion = React.createClass({
  propTypes: {
    selectedValues: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    question: questionPropType,
    onChange: React.PropTypes.func,
    data: React.PropTypes.object,
    errors: React.PropTypes.arrayOf(React.PropTypes.string),
  },

  buildColumn(selectedValue) {
    const key = `${this.props.question.name}[${selectedValue}]`;

    // Support referring to checkboxes as either "single_select" or "check", and
    // radios as either "radio" or "multi_select", to match the standards of
    // both React-Bootstrap and the (soon-to-be-deprecated) Pegasus Forms.
    // TODO (elijah) remove this compatibility once we remove the Pegasus Forms
    let type = this.props.question.type;
    if (this.props.question.type === SINGLE_SELECT) {
      type = RADIO;
    } else if (this.props.question.type === MULTI_SELECT) {
      type = CHECK;
    }

    let selected = this.props.data && this.props.data[key];
    if (selected && type === CHECK) {
      selected = [selected];
    }

    let validationState;
    if (this.props.errors && this.props.errors.includes(key)) {
      validationState = 'error';
    }

    return (
      <td key={key}>
        <FormGroup
          controlId={key}
          validationState={validationState}
        >
          <ButtonList
            answers={this.props.question.values}
            groupName={key}
            label={""}
            type={type}
            selectedItems={selected}
            onChange={this.props.onChange}
          />
        </FormGroup>
      </td>
    );
  },

  render() {
    return (
      <tr>
        <td style={styles.tdLabel}>
          <ControlLabel>
            {this.props.question.label}
            {this.props.question.required && <span className="form-required-field"> *</span>}
          </ControlLabel>
        </td>
        {this.props.selectedValues.map(this.buildColumn)}
      </tr>
    );
  }
});

const RowVariableQuestion = React.createClass({
  propTypes: {
    selectedValues: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    question: questionPropType,
    onChange: React.PropTypes.func,
    data: React.PropTypes.object,
    errors: React.PropTypes.arrayOf(React.PropTypes.string),
  },

  buildRow(selectedValue) {
    const label = this.props.question.label.replace("{value}", selectedValue);
    const key = `${this.props.question.name}[${selectedValue}]`;

    let validationState;
    if (this.props.errors && this.props.errors.includes(key)) {
      validationState = 'error';
    }

    return (
      <FieldGroup
        key={key}
        id={key}
        label={label}
        validationState={validationState}
        required={this.props.question.required}
        componentClass="textarea"
        name={key}
        rows={4}
        value={this.props.data && this.props.data[key]}
        onChange={this.props.onChange}
      />
    );
  },

  render() {
    return (
      <div>
        {this.props.selectedValues.map(this.buildRow)}
      </div>
    );
  }
});

const VariableFormGroup = React.createClass({
  propTypes: {
    sourceLabel: React.PropTypes.string.isRequired,
    sourceName: React.PropTypes.string.isRequired,
    sourceValues: React.PropTypes.arrayOf(React.PropTypes.string).isRequired,
    columnVariableQuestions: React.PropTypes.arrayOf(questionPropType),
    rowVariableQuestions: React.PropTypes.arrayOf(questionPropType),
    onChange: React.PropTypes.func,
    data: React.PropTypes.object,
    errors: React.PropTypes.arrayOf(React.PropTypes.string),
  },

  getInitialState() {
    let selected = [];

    if (this.hasSingleSourceValue()) {
      // If we have only a single sourceValue, select it by default
      selected = [this.props.sourceValues[0]];
    } else if (this.props.data && this.props.data[this.props.sourceName]) {
      // otherwise, if we're a controlled component, set our initial state from
      // the data
      selected = this.props.data[this.props.sourceName];
    }

    return {selected};
  },

  componentWillMount() {
    if (this.hasSingleSourceValue() && this.props.onChange) {
      // if we only have a single source value, we want to default to having it
      // already selected, so manually trigger an on change if we have one so
      // our parent component will also think it's selected
      this.props.onChange({
        [this.props.sourceName]: this.state.selected
      });
    }
  },

  hasNoSourceValues() {
    return this.props.sourceValues.length === 0;
  },

  hasSingleSourceValue() {
    return this.props.sourceValues.length === 1;
  },

  setSelected(values) {
    if (this.props.onChange) {
      this.props.onChange(values);
    }

    this.setState({
      selected: values[this.props.sourceName]
    });
  },

  render() {
    if (this.hasNoSourceValues()) {
      // If we have no source values, we have nothing to render. Return an empty
      // form group
      return (<FormGroup />);
    }

    const columnQuestions = this.props.columnVariableQuestions.map(question => (
      <ColumnVariableQuestion
        key={question.name}
        question={question}
        selectedValues={this.state.selected}
        data={this.props.data}
        errors={this.props.errors}
        onChange={this.props.onChange}
      />
    ));

    const rowQuestions = this.props.rowVariableQuestions.map(question => (
      <RowVariableQuestion
        key={question.name}
        question={question}
        selectedValues={this.state.selected}
        data={this.props.data}
        errors={this.props.errors}
        onChange={this.props.onChange}
      />
    ));

    const thStyle = {
      width: `${100 / (this.state.selected.length + 1)}%`,
      backgroundColor: "#00b2c0",
      color: "white"
    };

    let validationState;
    if (this.props.errors && this.props.errors.includes(this.props.sourceName)) {
      validationState = 'error';
    }

    return (
      <FormGroup
        validationState={validationState}
        controlId={this.props.sourceName}
      >
        {this.hasSingleSourceValue() ?
          <input type="hidden" name={this.props.sourceName} value={this.props.sourceValues[0]} /> :
          <ButtonList
            answers={this.props.sourceValues}
            groupName={this.props.sourceName}
            label={this.props.sourceLabel}
            onChange={this.setSelected}
            selectedItems={this.state.selected}
            required
            type={'check'}
          />
        }
        <Table striped bordered>
          <thead>
            <tr>
              <th style={thStyle}></th>
              {this.state.selected.map(value => <th key={value} style={thStyle}><label>{value}</label></th>)}
            </tr>
          </thead>
          <tbody>
            {columnQuestions}
          </tbody>
        </Table>
        {rowQuestions}
      </FormGroup>
    );
  }
});

export default VariableFormGroup;
