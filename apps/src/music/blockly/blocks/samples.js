import {BlockTypes} from '../blockTypes';
import {FIELD_SOUNDS_NAME, SOUND_VALUE_TYPE} from '../constants';
import {fieldSoundsDefinition} from '../fields';

/**
 * Value block for a sample
 */
export const valueSample = {
  definition: {
    type: BlockTypes.VALUE_SAMPLE,
    message0: '%1',
    args0: [fieldSoundsDefinition],
    style: 'lab_blocks',
    output: SOUND_VALUE_TYPE
  },
  generator: ctx => [
    ctx.getFieldValue(FIELD_SOUNDS_NAME),
    Blockly.JavaScript.ORDER_ATOMIC
  ]
};
