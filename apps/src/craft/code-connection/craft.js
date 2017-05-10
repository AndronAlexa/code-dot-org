import React from 'react';
import ReactDOM from 'react-dom';

import {singleton as studioApp} from '../../StudioApp';
import codegen from '../../codegen';
import {Provider} from 'react-redux';
import AppView from '../../templates/AppView';
import CraftVisualizationColumn from './CraftVisualizationColumn';
import {getStore} from '../../redux';

const MEDIA_URL = '/blockly/media/craft/';

/**
 * Create a namespace for the application.
 */
const Craft = module.exports;

window.Craft = Craft;
window.Blockly = Blockly;

const COMMON_UI_ASSETS = [
  MEDIA_URL + "Sliced_Parts/MC_Loading_Spinner.gif",
  MEDIA_URL + "Sliced_Parts/Frame_Large_Plus_Logo.png",
  MEDIA_URL + "Sliced_Parts/Pop_Up_Slice.png",
  MEDIA_URL + "Sliced_Parts/X_Button.png",
  MEDIA_URL + "Sliced_Parts/Button_Grey_Slice.png",
  MEDIA_URL + "Sliced_Parts/MC_Button_Pressed.png",
  MEDIA_URL + "Sliced_Parts/Run_Button_Up_Slice.png",
  MEDIA_URL + "Sliced_Parts/Run_Button_Down_Slice.png",
  MEDIA_URL + "Sliced_Parts/MC_Run_Arrow_Icon_Smaller.png",
  MEDIA_URL + "Sliced_Parts/MC_Up_Arrow_Icon.png",
  MEDIA_URL + "Sliced_Parts/MC_Down_Arrow_Icon.png",
  MEDIA_URL + "Sliced_Parts/Reset_Button_Up_Slice.png",
  MEDIA_URL + "Sliced_Parts/MC_Reset_Arrow_Icon.png",
  MEDIA_URL + "Sliced_Parts/Reset_Button_Down_Slice.png",
  MEDIA_URL + "Sliced_Parts/Callout_Tail.png",
];

const preloadImage = function (url) {
  const img = new Image();
  img.src = url;
};

/**
 * Initialize Blockly and the Craft app. Called on page load.
 */
Craft.init = function (config) {
  config.level.disableFinalStageMessage = true;
  config.showInstructionsInTopPane = true;

  const bodyElement = document.body;
  bodyElement.className = bodyElement.className + " minecraft";

  Craft.initialConfig = config;

  // Replace studioApp methods with our own.
  studioApp().reset = this.reset.bind(this);
  studioApp().runButtonClick = this.runButtonClick.bind(this);

  const onMount = function () {
    studioApp().init({
      ...config
    });

    COMMON_UI_ASSETS.forEach(function (url) {
      preloadImage(url);
    });
  };

  // Push initial level properties into the Redux store
  studioApp().setPageConstants(config, {
    isMinecraft: true
  });

  ReactDOM.render(
    <Provider store={getStore()}>
      <AppView
        visualizationColumn={
          <CraftVisualizationColumn showScore={!!config.level.useScore}/>
        }
        onMount={onMount}
      />
    </Provider>,
    document.getElementById(config.containerId)
  );
};

/**
 * Reset the app to the start position and kill any pending animation tasks.
 * @param {boolean} first true if first reset (during app load)
 */
Craft.reset = function (first) {
  if (first) {
    return;
  }
  console.log('reset');
};

/**
 * Click the run button.  Start the program.
 */
Craft.runButtonClick = function () {
  console.log('run');

  const runButton = document.getElementById('runButton');
  const resetButton = document.getElementById('resetButton');

  // Ensure that Reset button is at least as wide as Run button.
  if (!resetButton.style.minWidth) {
    resetButton.style.minWidth = runButton.offsetWidth + 'px';
  }

  studioApp().toggleRunReset('reset');
  studioApp().attempts++;

  Craft.executeUserCode();
};

Craft.executeUserCode = function () {
  let codeBlocks = Blockly.mainBlockSpace.getTopBlocks(true);
  const code = Blockly.Generator.blocksToCode('JavaScript', codeBlocks);

  const evalApiMethods = {
    log: function (blockID, value) {
      studioApp().highlight(blockID);
      console.log('Logged: ' + value);
    },
  };

  codegen.evalWith(code, evalApiMethods);
};
