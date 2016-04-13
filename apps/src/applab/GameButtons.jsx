var msg = require('../locale');

var CompletionButton = require('./CompletionButton');

var styles = {
  hidden: {
    display: 'none'
  }
};

var GameButtons = function (props) {
  return (
    <div id="gameButtons">
      <button id="runButton" className="launch blocklyLaunch">
        <div>{msg.runProgram()}</div>
        <img src="/blockly/media/1x1.gif" className="run26"/>
      </button>
      <button id="resetButton" className="launch blocklyLaunch" style={styles.hidden}>
        <div>{msg.resetProgram()}</div>
        <img src="/blockly/media/1x1.gif" className="reset26"/>
      </button>
      {" " /* Explicitly insert whitespace so that this behaves like our ejs file*/}
      <CompletionButton/>
    </div>
  );
};

module.exports = GameButtons;
