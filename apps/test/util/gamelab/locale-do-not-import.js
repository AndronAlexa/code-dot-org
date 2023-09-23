/**
 * DO NOT IMPORT THIS DIRECTLY. Instead do:
 *   ```
 *   import msg from '@cdo/gamelab/locale'.
 *   ```
 * This allows the webpack config to determine how locales should be loaded,
 * which is important for making locale setup work seamlessly in tests.
 */
// make sure Blockly is loaded
import setupBlocklyGlobal from '../setupBlocklyGlobal';
import '../../../build/package/js/en_us/gamelab_locale.js';
setupBlocklyGlobal();
export default window.locales.gamelab_locale;
