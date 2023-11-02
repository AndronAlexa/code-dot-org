import ProgramExecutor from '@cdo/apps/dance/lab2/ProgramExecutor';
import {SongMetadata} from '@cdo/apps/dance/types';
import utils from '@cdo/apps/dance/utils';
import CustomMarshalingInterpreter from '@cdo/apps/lib/tools/jsinterpreter/CustomMarshalingInterpreter';
import {StubFunction} from 'test/types/types';
import {expect} from '../../../util/reconfiguredChai';
import * as sinon from 'sinon';

const DanceParty = require('@code-dot-org/dance-party/src/p5.dance');

describe('ProgramExecutor', () => {
  let nativeAPI: typeof DanceParty,
    validationCode: string,
    onEventsChanged,
    evalWithEvents: StubFunction<
      typeof CustomMarshalingInterpreter.evalWithEvents
    >,
    computeCharactersReferenced: StubFunction<
      typeof utils.computeCharactersReferenced
    >,
    getValidationCallback: StubFunction<typeof utils.getValidationCallback>,
    validationFunction: StubFunction<() => void>,
    runUserSetup: StubFunction<() => void>,
    getCueList: StubFunction<() => number[]>,
    runUserEvents: StubFunction<() => void>,
    currentSongMetadata: SongMetadata,
    characters: string[],
    timestamps: number[],
    code: string,
    programExecutor: ProgramExecutor;

  beforeEach(() => {
    nativeAPI = {
      addCues: sinon.stub(),
      registerValidation: sinon.stub(),
      play: sinon.stub().callsFake((songMetadata, callback) => {
        // Automatically call the callback with success so the promise resolves.
        callback(true);
      }),
      reset: sinon.stub(),
      getReplayLog: sinon.stub(),
      teardown: sinon.stub(),
      ensureSpritesAreLoaded: sinon.stub(),
      p5_: {
        redraw: sinon.stub(),
      },
      livePreview: sinon.stub(),
    };

    validationCode = 'validationCode';
    onEventsChanged = sinon.stub();
    evalWithEvents = sinon.stub(CustomMarshalingInterpreter, 'evalWithEvents');
    getValidationCallback = sinon.stub(utils, 'getValidationCallback');
    computeCharactersReferenced = sinon.stub(
      utils,
      'computeCharactersReferenced'
    );
    runUserSetup = sinon.stub();
    getCueList = sinon.stub();
    runUserEvents = sinon.stub();
    currentSongMetadata = {
      analysis: [],
      artist: '',
      bpm: '',
      delay: '',
      duration: 1,
      file: '',
      title: '',
      peaks: {},
    };

    characters = ['character1', 'character2'];
    computeCharactersReferenced.returns(characters);

    timestamps = [1, 2, 3];
    getCueList.returns(timestamps);

    validationFunction = sinon.stub();
    getValidationCallback.returns(validationFunction);
    code = 'code';

    programExecutor = new ProgramExecutor(
      'container',
      () => undefined,
      false,
      false,
      undefined,
      validationCode,
      onEventsChanged,
      '',
      nativeAPI
    );
  });

  afterEach(() => {
    sinon.restore();
  });

  it('compiles all code and calls native API on execute', async () => {
    const expectedHooks = [
      {name: 'runUserSetup', func: runUserSetup},
      {name: 'getCueList', func: getCueList},
      {name: 'runUserEvents', func: runUserEvents},
    ];
    evalWithEvents.returns({
      hooks: expectedHooks,
      interpreter: undefined as unknown as CustomMarshalingInterpreter, // unused
    });

    await programExecutor.execute(code, currentSongMetadata);

    expect(computeCharactersReferenced).to.have.been.calledOnce;
    expect(nativeAPI.ensureSpritesAreLoaded).to.have.been.calledWith(
      characters
    );
    expect(evalWithEvents).to.have.been.calledOnce;
    const events = evalWithEvents.firstCall.args[1];
    expect(Object.keys(events)).to.have.members(expectedHooks.map(h => h.name));
    const fullCode = evalWithEvents.firstCall.args[2];
    expect(fullCode?.includes(code)).to.be.true;
    expect(runUserSetup).to.have.been.calledOnce;
    expect(getCueList).to.have.been.calledOnce;
    expect(nativeAPI.addCues).to.have.been.calledWithExactly(timestamps);
    expect(getValidationCallback).to.have.been.calledWith(validationCode);
    expect(nativeAPI.registerValidation).to.have.been.calledWith(
      validationFunction
    );
    expect(nativeAPI.play).to.have.been.calledWith(currentSongMetadata);
  });

  it('compiles and runs live preview on when calling startLivePreview', async () => {
    const expectedHooks = [{name: 'runUserSetup', func: runUserSetup}];
    evalWithEvents.returns({
      hooks: expectedHooks,
      interpreter: undefined as unknown as CustomMarshalingInterpreter, // unused
    });

    await programExecutor.startLivePreview(code, currentSongMetadata);

    expect(nativeAPI.ensureSpritesAreLoaded).to.have.been.calledOnce;
    expect(evalWithEvents).to.have.been.calledOnce;
    const events = evalWithEvents.firstCall.args[1];
    expect(Object.keys(events)).to.have.members(expectedHooks.map(h => h.name));
    const fullCode = evalWithEvents.firstCall.args[2];
    expect(fullCode?.includes(code)).to.be.true;
    expect(runUserSetup).to.have.been.calledOnce;
    expect(nativeAPI.livePreview).to.have.been.calledWithExactly(
      currentSongMetadata
    );
  });

  it('does nothing if updateLivePreview is called before startLivePreview', async () => {
    await programExecutor.updateLivePreview(code, currentSongMetadata);
    expect(nativeAPI.livePreview).to.not.have.been.called;
  });

  it('updates live preview if called after startLivePreview', async () => {
    const expectedHooks = [{name: 'runUserSetup', func: runUserSetup}];
    evalWithEvents.returns({
      hooks: expectedHooks,
      interpreter: undefined as unknown as CustomMarshalingInterpreter, // unused
    });

    await programExecutor.startLivePreview(code, currentSongMetadata);
    await programExecutor.updateLivePreview(code, currentSongMetadata);
    expect(nativeAPI.livePreview).to.have.been.calledTwice;
  });

  it('resets the native API on reset', () => {
    programExecutor.reset();
    expect(nativeAPI.reset).to.have.been.calledOnce;
  });

  it('gets the replay log from the native API', () => {
    const replayLog = {};
    nativeAPI.getReplayLog.returns(replayLog);
    const returnedReplayLog = programExecutor.getReplayLog();
    expect(returnedReplayLog).to.equal(replayLog);
  });

  it('tears down the native API on destroy', () => {
    programExecutor.destroy();
    expect(nativeAPI.teardown).to.have.been.calledOnce;
  });
});
