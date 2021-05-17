import {tiles, MazeController} from '@code-dot-org/maze';
const Slider = require('@cdo/apps/slider');
const Direction = tiles.Direction;

export default class Neighborhood {
  constructor() {}
  afterInject(level, skin, config, studioApp) {
    // Insert some temporary values here until we can populate them from levelbuilder
    level.map = [
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 2, 1, 1, 3, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0],
      [0, 0, 0, 0, 0, 0, 0, 0]
    ];
    level.startDirection = Direction.EAST;

    let controller = new MazeController(level, skin, config, {
      methods: {
        playAudio: (sound, options) => {
          studioApp.playAudio(sound, {...options, noOverlap: true});
        },
        playAudioOnFailure: studioApp.playAudioOnFailure.bind(studioApp),
        loadAudio: studioApp.loadAudio.bind(studioApp),
        getTestResults: studioApp.getTestResults.bind(studioApp)
      }
    });
    // 'svgMaze' is a magic value that we use throughout our code-dot-org and maze code to
    // reference the maze visualization area. It is initially set up in maze's Visualization.jsx
    const svg = document.getElementById('svgMaze');
    controller.subtype.initStartFinish();
    controller.subtype.createDrawer(svg);
    controller.subtype.initWallMap();
    controller.initWithSvg(svg);

    const slider = document.getElementById('slider');
    this.speedSlider = new Slider(10, 35, 130, slider);
    // TODO: use the speed slider to adjust the pegman speed
    // This will involve reading the slider value at execution time which is between 1 and 0
    // with 1 being slowest for some reason.
    // We make it between -1 and 1 with -1 being slowest by multiplying by -2 and adding 1.
    // We then use that adjusted value as a step speed multiplier, ranging from 0.5 to 2.
  }
}
