import PropTypes from 'prop-types';
import React, {Component} from 'react';
import BaseDialog from '@cdo/apps/templates/BaseDialog';
import DialogFooter from '@cdo/apps/templates/teacherDashboard/DialogFooter';
import color from '@cdo/apps/util/color';
import {vocabularyShape} from '@cdo/apps/lib/levelbuilder/shapes';

const styles = {
  dialog: {
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 20,
    fontFamily: '"Gotham 4r", sans-serif, sans-serif'
  },
  container: {
    display: 'flex',
    flexDirection: 'column'
  },
  inputAndLabel: {
    display: 'flex',
    flexDirection: 'column'
  },
  textInput: {
    width: '98%'
  },
  submitButton: {
    color: 'white',
    backgroundColor: color.orange,
    borderColor: color.orange,
    borderRadius: 3,
    fontSize: 12,
    fontFamily: '"Gotham 4r", sans-serif',
    fontWeight: 'bold',
    paddingLeft: 20,
    paddingRight: 20,
    paddingTop: 5,
    paddingBottom: 5
  }
};

export default class AddVocabularyDialog extends Component {
  static propTypes = {
    onSave: PropTypes.func,
    handleClose: PropTypes.func,
    editingVocabulary: vocabularyShape,
    courseVersionId: PropTypes.number
  };

  constructor(props) {
    super(props);
    this.state = {
      word: '',
      definition: ''
    };
  }

  handleWordChange = e => {
    this.setState({word: e.target.value});
  };

  handleDefinitionChange = e => {
    this.setState({definition: e.target.value});
  };

  render() {
    return (
      <BaseDialog isOpen={true} handleClose={this.props.handleClose}>
        <label style={styles.inputAndLabel}>
          Word
          <input
            type="text"
            name="word"
            value={this.state.word}
            onChange={this.handleWordChange}
            style={styles.textInput}
          />
        </label>
        <label style={styles.inputAndLabel}>
          Definition
          <input
            type="text"
            name="definition"
            value={this.state.definition}
            onChange={this.handleDefinitionChange}
            style={styles.textInput}
          />
        </label>
        <DialogFooter rightAlign>
          <input
            id="submit-button"
            type="submit"
            value="Close and Save"
            style={styles.submitButton}
          />
        </DialogFooter>
      </BaseDialog>
    );
  }
}
