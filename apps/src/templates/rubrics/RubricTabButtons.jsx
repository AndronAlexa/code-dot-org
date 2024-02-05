import React, {useState} from 'react';
import PropTypes from 'prop-types';
import style from './rubrics.module.scss';
import i18n from '@cdo/locale';
import SegmentedButtons from '@cdo/apps/componentLibrary/segmentedButtons/SegmentedButtons';
import RunAIAssessmentButton, {STATUS} from './RunAIAssessmentButton';
import {rubricShape} from './rubricShapes';
import {InfoAlert} from './RubricContent';

export default function RubricTabButtons({
  tabSelectCallback,
  selectedTab,
  showSettings,
  canProvideFeedback,
  teacherHasEnabledAi,
  studentUserId,
  refreshAiEvaluations,
  rubric,
  studentName,
}) {
  const TAB_NAMES = {
    RUBRIC: 'rubric',
    SETTINGS: 'settings',
  };

  const [status, setStatus] = useState(STATUS.INITIAL_LOAD);

  const statusText = () => {
    switch (status) {
      case STATUS.INITIAL_LOAD:
        return i18n.aiEvaluationStatus_initial_load();
      case STATUS.NOT_ATTEMPTED:
        return i18n.aiEvaluationStatus_not_attempted();
      case STATUS.ALREADY_EVALUATED:
        return i18n.aiEvaluationStatus_already_evaluated();
      case STATUS.READY:
        return null;
      case STATUS.SUCCESS:
        return i18n.aiEvaluationStatus_success();
      case STATUS.EVALUATION_PENDING:
        return i18n.aiEvaluationStatus_pending();
      case STATUS.EVALUATION_RUNNING:
        return i18n.aiEvaluationStatus_in_progress();
      case STATUS.ERROR:
        return i18n.aiEvaluationStatus_error();
      case STATUS.PII_ERROR:
        return i18n.aiEvaluationStatus_pii_error();
      case STATUS.PROFANITY_ERROR:
        return i18n.aiEvaluationStatus_profanity_error();
    }
  };

  return (
    <div>
      <div className={style.rubricTabGroup}>
        <SegmentedButtons
          className="uitest-rubric-tab-buttons"
          selectedButtonValue={selectedTab}
          size="s"
          buttons={[
            {label: i18n.rubricTabStudent(), value: TAB_NAMES.RUBRIC},
            {
              label: i18n.rubricTabClassManagement(),
              value: TAB_NAMES.SETTINGS,
              disabled: !showSettings,
            },
          ]}
          onChange={value => tabSelectCallback(value)}
        />
        {selectedTab === TAB_NAMES.RUBRIC && (
          <div>
            <RunAIAssessmentButton
              canProvideFeedback={canProvideFeedback}
              teacherHasEnabledAi={teacherHasEnabledAi}
              studentUserId={studentUserId}
              refreshAiEvaluations={refreshAiEvaluations}
              rubric={rubric}
              studentName={studentName}
              status={status}
              setStatus={setStatus}
            />
          </div>
        )}
      </div>
      {selectedTab === TAB_NAMES.RUBRIC &&
        canProvideFeedback &&
        !!statusText() && (
          <InfoAlert text={statusText() || ''} dismissable={true} />
        )}
    </div>
  );
}

RubricTabButtons.propTypes = {
  tabSelectCallback: PropTypes.func,
  selectedTab: PropTypes.string,
  showSettings: PropTypes.bool,
  canProvideFeedback: PropTypes.bool,
  teacherHasEnabledAi: PropTypes.bool,
  updateTeacherAiSetting: PropTypes.func,
  studentUserId: PropTypes.number,
  refreshAiEvaluations: PropTypes.func,
  rubric: rubricShape.isRequired,
  studentName: PropTypes.string,
};
