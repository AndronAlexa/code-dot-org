import React, {useState} from 'react';
import PropTypes from 'prop-types';
import i18n from '@cdo/locale';
import Button from '@cdo/apps/templates/Button';
import color from '@cdo/apps/util/color';
import LevelTypesBox from './LevelTypesBox';
import TeacherActionsBox from './TeacherActionsBox';
import AssignmentCompletionStatesBox from './AssignmentCompletionStatesBox';

export const NOT_STARTED = 'Not started';
export const VIEWED = 'Viewed';
export const NEEDS_FEEDBACK = 'Needs feedback';
export const FEEDBACK_GIVEN = 'Feedback given';

export default function IconKey({isViewingLevelProgress, hasLevelValidation}) {
  const [isOpen, setIsOpen] = useState(false);

  const caret = isOpenA => (isOpenA ? 'caret-down' : 'caret-right');

  // TO-DO (TEACH-800): Make content responsive to view on page
  // TO-DO (TEACH-801): Fix spacing between boxes once width of the page is expanded
  const sectionContent = () => (
    <div style={{display: 'flex'}}>
      <LevelTypesBox />
      <TeacherActionsBox isViewingLevelProgress={true} />
      <AssignmentCompletionStatesBox
        isViewingLevelProgress={isViewingLevelProgress}
        hasValidatedLevels={hasLevelValidation}
      />
    </div>
  );

  const clickListener = () => setIsOpen(!isOpen);

  return (
    <div>
      <Button
        id="icon-key"
        style={styles.label}
        styleAsText
        icon={caret(isOpen)}
        onClick={clickListener}
      >
        {i18n.iconKey()}
      </Button>
      <div>{isOpen && sectionContent()}</div>
    </div>
  );
}

IconKey.propTypes = {
  isViewingLevelProgress: PropTypes.bool,
  hasLevelValidation: PropTypes.bool,
};

const styles = {
  label: {
    fontFamily: 'Metropolis',
    color: color.light_gray_900,
    fontSize: '16px',
    fontWeight: '600',
    lineHeight: '148%',
  },
};
