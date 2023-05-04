/** @file Top-level view for Music */
import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import {connect} from 'react-redux';
import Instructions from './Instructions';
import Controls from './Controls';
import Timeline from './Timeline';
import MusicPlayer from '../player/MusicPlayer';
import ProgramSequencer from '../player/ProgramSequencer';
import RandomSkipManager from '../player/RandomSkipManager';
import AnalyticsReporter from '../analytics/AnalyticsReporter';
import {SignInState} from '@cdo/apps/templates/currentUserRedux';
import moduleStyles from './music-view.module.scss';
import {AnalyticsContext, PlayerUtilsContext} from '../context';
import TopButtons from './TopButtons';
import Globals from '../globals';
import MusicBlocklyWorkspace from '../blockly/MusicBlocklyWorkspace';
import AppConfig, {setAppConfig} from '../appConfig';
import SoundUploader from '../utils/SoundUploader';
import ProgressManager from '../progress/ProgressManager';
import MusicValidator from '../progress/MusicValidator';
import Video from './Video';
import MusicLibrary from '../player/MusicLibrary';
import {
  setIsPlaying,
  setCurrentPlayheadPosition,
  clearSelectedBlockId,
  selectBlockId,
  setShowInstructions,
  setInstructionsPosition,
  InstructionsPositions,
  setCurrentProgressState,
} from '../redux/musicRedux';
import KeyHandler from './KeyHandler';
import {
  levelsForLessonId,
  navigateToLevelId,
  sendSuccessReport,
} from '@cdo/apps/code-studio/progressRedux';
import {setIsLoading, setIsPageError} from '@cdo/apps/code-studio/labRedux';

const baseUrl = 'https://curriculum.code.org/media/musiclab/';

/**
 * Top-level container for Music Lab. Manages all views on the page as well as the
 * Blockly workspace and music player.
 *
 * TODO: Split up this component into a pure view and class/component that manages
 * application state.
 */
class UnconnectedMusicView extends React.Component {
  static propTypes = {
    appOptions: PropTypes.object,
    appConfig: PropTypes.object,
    levels: PropTypes.array,
    currentLevelIndex: PropTypes.number,

    // populated by Redux
    userId: PropTypes.number,
    userType: PropTypes.string,
    signInState: PropTypes.oneOf(Object.values(SignInState)),
    isPlaying: PropTypes.bool,
    setIsPlaying: PropTypes.func,
    setCurrentPlayheadPosition: PropTypes.func,
    selectedBlockId: PropTypes.string,
    selectBlockId: PropTypes.func,
    clearSelectedBlockId: PropTypes.func,
    timelineAtTop: PropTypes.bool,
    showInstructions: PropTypes.bool,
    instructionsPosition: PropTypes.string,
    setShowInstructions: PropTypes.func,
    setInstructionsPosition: PropTypes.func,
    setCurrentProgressState: PropTypes.func,
    navigateToLevelId: PropTypes.func,
    sendSuccessReport: PropTypes.func,
    setIsLoading: PropTypes.func,
    setIsPageError: PropTypes.func,
  };

  constructor(props) {
    super(props);

    this.player = new MusicPlayer();
    this.programSequencer = new ProgramSequencer();
    this.randomSkipManager = new RandomSkipManager();
    this.analyticsReporter = new AnalyticsReporter();
    this.musicBlocklyWorkspace = new MusicBlocklyWorkspace(props.appOptions);
    this.soundUploader = new SoundUploader(this.player);
    this.playingTriggers = [];

    if (this.props.appConfig) {
      setAppConfig(this.props.appConfig);
    }

    // Set default for instructions position.
    const defaultInstructionsPos = AppConfig.getValue(
      'instructions-position'
    )?.toUpperCase();
    if (defaultInstructionsPos) {
      this.props.setInstructionsPosition(defaultInstructionsPos);
    }

    this.state = {
      updateNumber: 0,
      showingVideo: true,
      levelCount: 0,
    };
  }

  componentDidMount() {
    this.analyticsReporter.startSession().then(() => {
      this.analyticsReporter.setUserProperties(
        this.props.userId,
        this.props.userType,
        this.props.signInState
      );
    });
    // TODO: the 'beforeunload' callback is advised against as it is not guaranteed to fire on mobile browsers. However,
    // we need a way of reporting analytics when the user navigates away from the page. Check with Amplitude for the
    // correct approach.
    window.addEventListener('beforeunload', event => {
      this.analyticsReporter.endSession();
      // Force a save before the page unloads, if there are unsaved changes.
      // If we need to force a save, prevent navigation so we can save first.
      if (this.musicBlocklyWorkspace.hasUnsavedChanges()) {
        this.musicBlocklyWorkspace.saveCode(true);
        event.preventDefault();
        event.returnValue = '';
      }
    });

    const musicValidator = new MusicValidator(this.getIsPlaying, this.player);

    const promises = [];

    // Load library data.
    promises.push(this.loadLibrary());

    // There are two ways to have a progression: have levels, or be directed
    // to load a progression.
    if (
      this.props.levels ||
      AppConfig.getValue('load-progression') === 'true'
    ) {
      this.progressManager = new ProgressManager(
        this.props.currentLevelIndex,
        musicValidator,
        this.onProgressChange
      );

      // Load progress data for current step.
      promises.push(this.loadProgressionStep());
    }

    Promise.all(promises).then(values => {
      const libraryJson = values[0];
      this.library = new MusicLibrary(libraryJson);

      Globals.setLibrary(this.library);
      Globals.setPlayer(this.player);

      this.setAllowedSoundsForProgress();

      this.musicBlocklyWorkspace.init(
        document.getElementById('blockly-div'),
        this.onBlockSpaceChange,
        this.player,
        this.progressManager?.getCurrentStepDetails().toolbox
      );
      this.player.initialize(this.library);
      setInterval(this.updateTimer, 1000 / 30);
    });
  }

  componentDidUpdate(prevProps) {
    this.musicBlocklyWorkspace.resizeBlockly();
    if (
      prevProps.userId !== this.props.userId ||
      prevProps.userType !== this.props.userType ||
      prevProps.signInState !== this.props.signInState
    ) {
      this.analyticsReporter.setUserProperties(
        this.props.userId,
        this.props.userType,
        this.props.signInState
      );
    }

    if (prevProps.currentLevelIndex !== this.props.currentLevelIndex) {
      this.goToPanel(this.props.currentLevelIndex);
    }

    if (
      prevProps.selectedBlockId !== this.props.selectedBlockId &&
      !this.props.isPlaying
    ) {
      this.musicBlocklyWorkspace.selectBlock(this.props.selectedBlockId);
    }
  }

  updateTimer = () => {
    if (this.props.isPlaying) {
      this.props.setCurrentPlayheadPosition(
        this.player.getCurrentPlayheadPosition()
      );

      this.updateHighlightedBlocks();

      this.progressManager?.updateProgress();
    }
  };

  onProgressChange = () => {
    const currentState = this.progressManager.getCurrentState();
    this.props.setCurrentProgressState(currentState);

    // Tell the external system (if there is one) about the success.
    if (this.props.levels && currentState.satisfied) {
      this.props.sendSuccessReport('music');
    }
  };

  getIsPlaying = () => {
    return this.props.isPlaying;
  };

  // When the user initiates going to the next panel in the app.
  onNextPanel = () => {
    this.progressManager?.next();
    this.handlePanelChange();

    // Tell the external system (if there is one) about the new level.
    if (this.props.levels && this.props.navigateToLevelId) {
      const progressState = this.progressManager.getCurrentState();
      const currentPanel = progressState.step;

      // Tell the external system, via the progress redux store, about the
      // new level ID.
      const level = this.props.levels[currentPanel];
      const levelId = '' + level.id;
      this.props.navigateToLevelId(levelId);
    }
  };

  // When the external system lets us know that the user changed level.
  goToPanel = specificStep => {
    this.progressManager?.goToStep(specificStep);
    this.handlePanelChange();
  };

  // Handle a change in panel.
  handlePanelChange = async () => {
    this.stopSong();
    this.clearCode();

    this.props.setIsLoading(true);

    await this.loadProgressionStep();

    this.setToolboxForProgress();
    this.setAllowedSoundsForProgress();

    this.props.setIsLoading(false);
  };

  setToolboxForProgress = () => {
    if (this.progressManager) {
      const allowedToolbox =
        this.progressManager.getCurrentStepDetails().toolbox;
      this.musicBlocklyWorkspace.updateToolbox(allowedToolbox);
    }
  };

  setAllowedSoundsForProgress = () => {
    if (this.progressManager) {
      this.library.setAllowedSounds(
        this.progressManager.getCurrentStepDetails().sounds
      );
    }
  };

  updateHighlightedBlocks = () => {
    const playingBlockIds = this.player.getCurrentlyPlayingBlockIds();
    this.musicBlocklyWorkspace.updateHighlightedBlocks(playingBlockIds);
  };

  loadProgressionStep = async () => {
    let progressionStep = undefined;
    if (this.props.levels) {
      // Since we have levels, we'll asynchronously retrieve the current level data.
      const response = await this.loadLevelData();
      progressionStep = response.properties.level_data;

      // Also, just set the number of levels.
      this.setState({levelCount: this.props.levels.length});
    } else if (AppConfig.getValue('load-progression') === 'true') {
      // Let's load from the file.  We'll grab the entire progression
      // but just extract the current step's data.
      const response = await this.loadProgressionFile();
      progressionStep = response.steps[this.props.currentLevelIndex];

      // Also, set the number of levels while we have the whole progression available.
      this.setState({levelCount: response.steps.length});
    }

    this.progressManager.setProgressionStep(progressionStep);

    this.props.setShowInstructions(!!progressionStep);
  };

  loadLibrary = async () => {
    if (AppConfig.getValue('local-library') === 'true') {
      const localLibraryFilename = 'music-library';
      const localLibrary = require(`@cdo/static/music/${localLibraryFilename}.json`);
      return localLibrary;
    } else {
      const libraryParameter = AppConfig.getValue('library');
      const libraryFilename = libraryParameter
        ? `music-library-${libraryParameter}.json`
        : 'music-library.json';
      const response = await fetch(baseUrl + libraryFilename);
      const library = await response.json();
      return library;
    }
  };

  loadProgressionFile = async () => {
    if (AppConfig.getValue('local-progression') === 'true') {
      const defaultProgressionFilename = 'music-progression';
      const progression = require(`@cdo/static/music/${defaultProgressionFilename}.json`);
      return progression;
    } else {
      const progressionParameter = AppConfig.getValue('progression');
      const progressionFilename = progressionParameter
        ? `music-progression-${progressionParameter}.json`
        : 'music-progression.json';
      const response = await fetch(baseUrl + progressionFilename);
      const progression = await response.json();
      return progression;
    }
  };

  loadLevelData = async () => {
    const currentPath = new URL(document.location).pathname;
    const currentPathNoTrailingSlash = currentPath.endsWith('/')
      ? currentPath.slice(0, -1)
      : currentPath;
    const levelDataPath = `${currentPathNoTrailingSlash}/level_data`;
    const response = await fetch(levelDataPath);
    if (!response.ok) {
      this.props.setIsPageError(true);
      return undefined;
    }
    const levelData = await response.json();
    return levelData;
  };

  clearCode = () => {
    this.musicBlocklyWorkspace.loadDefaultCode();

    this.setPlaying(false);
  };

  onBlockSpaceChange = e => {
    // A drag event can leave the blocks in a temporarily unusable state,
    // e.g. when a disabled variable is dragged into a slot, it can still
    // be disabled.
    // A subsequent non-drag event should arrive and the blocks will be
    // usable then.
    // It's possible that other events should similarly be ignored here.
    if (e.type === Blockly.Events.BLOCK_DRAG) {
      this.player.cancelPreviews();
      return;
    }

    // Prevent a rapid cycle of workspace resizing from occurring when
    // dragging a block near the bottom of the workspace.
    if (e.type === Blockly.Events.VIEWPORT_CHANGE) {
      return;
    }

    const codeChanged = this.compileSong();
    if (codeChanged) {
      this.executeCompiledSong();

      this.analyticsReporter.onBlocksUpdated(
        this.musicBlocklyWorkspace.getAllBlocks()
      );

      // This is a way to tell React to re-render the scene, notably
      // the timeline.
      this.setState({updateNumber: this.state.updateNumber + 1});
    }

    if (e.type === Blockly.Events.SELECTED) {
      if (
        !this.props.isPlaying &&
        e.newElementId !== this.props.selectedBlockId
      ) {
        this.props.selectBlockId(e.newElementId);
      }
    }

    // This may no-op due to throttling.
    this.musicBlocklyWorkspace.saveCode();
  };

  setPlaying = play => {
    if (play) {
      this.playSong();
      this.analyticsReporter.onButtonClicked('play');
    } else {
      this.stopSong();
      this.updateHighlightedBlocks();
    }
  };

  togglePlaying = () => {
    this.setPlaying(!this.props.isPlaying);
  };

  playTrigger = id => {
    if (!this.props.isPlaying) {
      return;
    }
    this.analyticsReporter.onButtonClicked('trigger', {id});
    const currentPosition = this.player.getCurrentPlayheadPosition();
    this.musicBlocklyWorkspace.executeTrigger(id, currentPosition);

    this.playingTriggers.push({
      id,
      startPosition: currentPosition,
    });
  };

  compileSong = () => {
    return this.musicBlocklyWorkspace.compileSong({
      MusicPlayer: this.player,
      ProgramSequencer: this.programSequencer,
      RandomSkipManager: this.randomSkipManager,
      getTriggerCount: () => this.playingTriggers.length,
      MusicLibrary: this.library,
    });
  };

  executeCompiledSong = () => {
    // Clear the events list because it will be populated next.
    this.player.clearAllEvents();

    this.musicBlocklyWorkspace.executeCompiledSong(this.playingTriggers);
  };

  playSong = () => {
    this.player.stopSong();
    this.playingTriggers = [];

    this.compileSong();

    this.executeCompiledSong();

    this.player.playSong();

    this.props.setIsPlaying(true);
    this.props.setCurrentPlayheadPosition(1);
    this.props.clearSelectedBlockId();
  };

  stopSong = () => {
    this.player.stopSong();
    this.playingTriggers = [];

    this.executeCompiledSong();

    this.props.setIsPlaying(false);
    this.props.setCurrentPlayheadPosition(0);
  };

  onFeedbackClicked = () => {
    this.analyticsReporter.onButtonClicked('feedback');
    window.open(
      'https://docs.google.com/forms/d/e/1FAIpQLScnUgehPPNjhSNIcCpRMcHFgtE72TlfTOh6GkER6aJ-FtIwTQ/viewform?usp=sf_link',
      '_blank'
    );
  };

  onVideoClosed = () => {
    this.setState({showingVideo: false});
  };

  renderInstructions(position) {
    if (!this.progressManager) {
      return;
    }

    // For now, the instructions are intended for use with a
    // progression.  We might decide to make them agnostic at
    // some point.
    // One advantage of passing everything through is that the
    // instructions can potentially size themselves to the
    // maximum possible content size, requiring no dynamic
    // resizing or user scrolling.  We did this for the dynamic
    // instructions in AI Lab.
    return (
      <div
        className={classNames(
          moduleStyles.instructionsArea,
          position === InstructionsPositions.TOP
            ? moduleStyles.instructionsTop
            : moduleStyles.instructionsSide,
          position === InstructionsPositions.LEFT &&
            moduleStyles.instructionsLeft,
          position === InstructionsPositions.RIGHT &&
            moduleStyles.instructionsRight
        )}
      >
        <Instructions
          progressionStep={this.progressManager.getProgressionStep()}
          currentLevelIndex={this.props.currentLevelIndex}
          levelCount={this.state.levelCount}
          onNextPanel={this.onNextPanel}
          baseUrl={baseUrl}
          vertical={position !== InstructionsPositions.TOP}
          right={position === InstructionsPositions.RIGHT}
        />
      </div>
    );
  }

  renderTimelineArea(timelineAtTop, instructionsOnRight) {
    return (
      <div
        id="timeline-area"
        className={classNames(
          moduleStyles.timelineArea,
          timelineAtTop ? moduleStyles.timelineTop : moduleStyles.timelineBottom
        )}
      >
        <Controls
          setPlaying={this.setPlaying}
          playTrigger={this.playTrigger}
          top={timelineAtTop}
          instructionsAvailable={!!this.state.instructions}
          toggleInstructions={() => this.toggleInstructions(false)}
          instructionsOnRight={instructionsOnRight}
        />
        <Timeline />
      </div>
    );
  }

  render() {
    const showVideo =
      AppConfig.getValue('show-video') !== 'false' && this.state.showingVideo;

    const {timelineAtTop, showInstructions, instructionsPosition} = this.props;

    return (
      <AnalyticsContext.Provider value={this.analyticsReporter}>
        <PlayerUtilsContext.Provider
          value={{
            getPlaybackEvents: () => this.player.getPlaybackEvents(),
            getTracksMetadata: () => this.player.getTracksMetadata(),
            getLastMeasure: () => this.player.getLastMeasure(),
          }}
        >
          <KeyHandler
            togglePlaying={this.togglePlaying}
            playTrigger={this.playTrigger}
          />
          <div id="music-lab-container" className={moduleStyles.container}>
            {showInstructions &&
              instructionsPosition === InstructionsPositions.TOP &&
              this.renderInstructions(InstructionsPositions.TOP)}

            {showVideo && (
              <Video id="initial-modal-0" onClose={this.onVideoClosed} />
            )}

            {timelineAtTop &&
              this.renderTimelineArea(
                true,
                instructionsPosition === InstructionsPositions.RIGHT
              )}

            <div className={moduleStyles.middleArea}>
              {showInstructions &&
                instructionsPosition === InstructionsPositions.LEFT &&
                this.renderInstructions(InstructionsPositions.LEFT)}

              <div id="blockly-area" className={moduleStyles.blocklyArea}>
                <div className={moduleStyles.topButtonsContainer}>
                  <TopButtons
                    clearCode={this.clearCode}
                    uploadSound={file => this.soundUploader.uploadSound(file)}
                  />
                </div>
                <div id="blockly-div" />
              </div>

              {showInstructions &&
                instructionsPosition === InstructionsPositions.RIGHT &&
                this.renderInstructions(InstructionsPositions.RIGHT)}
            </div>

            {!timelineAtTop &&
              this.renderTimelineArea(
                false,
                instructionsPosition === InstructionsPositions.RIGHT
              )}
          </div>
        </PlayerUtilsContext.Provider>
      </AnalyticsContext.Provider>
    );
  }
}

const MusicView = connect(
  state => ({
    userId: state.currentUser.userId,
    userType: state.currentUser.userType,
    signInState: state.currentUser.signInState,
    levels: state.progress.lessons
      ? levelsForLessonId(state.progress, state.progress.currentLessonId)
      : undefined,
    // The current level index has two potential sources of truth:
    // If we are part of a "script level", then it comes from the current level.
    // Otherwise, we fall back to the music progress manager's current step.
    currentLevelIndex: state.progress.lessons
      ? levelsForLessonId(
          state.progress,
          state.progress.currentLessonId
        ).findIndex(level => level.isCurrentLevel)
      : state.music.currentProgressState.step,
    isPlaying: state.music.isPlaying,
    selectedBlockId: state.music.selectedBlockId,
    timelineAtTop: state.music.timelineAtTop,
    showInstructions: state.music.showInstructions,
    instructionsPosition: state.music.instructionsPosition,
  }),
  dispatch => ({
    setIsPlaying: isPlaying => dispatch(setIsPlaying(isPlaying)),
    setCurrentPlayheadPosition: currentPlayheadPosition =>
      dispatch(setCurrentPlayheadPosition(currentPlayheadPosition)),
    selectBlockId: blockId => dispatch(selectBlockId(blockId)),
    clearSelectedBlockId: () => dispatch(clearSelectedBlockId()),
    setShowInstructions: showInstructions =>
      dispatch(setShowInstructions(showInstructions)),
    setInstructionsPosition: instructionsPosition =>
      dispatch(setInstructionsPosition(instructionsPosition)),
    setCurrentProgressState: progressState =>
      dispatch(setCurrentProgressState(progressState)),
    navigateToLevelId: levelId => dispatch(navigateToLevelId(levelId)),
    sendSuccessReport: appType => dispatch(sendSuccessReport(appType)),
    setIsLoading: isLoading => dispatch(setIsLoading(isLoading)),
    setIsPageError: isPageError => dispatch(setIsPageError(isPageError)),
  })
)(UnconnectedMusicView);

export default MusicView;
