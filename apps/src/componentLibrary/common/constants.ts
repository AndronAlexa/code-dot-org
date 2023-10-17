/**
 * This file contains constants that are used across the component library
 */

import {VisualAppearance} from '@cdo/apps/componentLibrary/typography/types';
import {ComponentSizeXSToL} from './types';

/**
 *  This is the map of component size to body text size (visualAppearance)
 */
export const componentSizeToBodyTextSizeMap: {
  [key in ComponentSizeXSToL]: VisualAppearance;
} = {
  l: 'body-one',
  m: 'body-two',
  s: 'body-three',
  xs: 'body-four',
};
