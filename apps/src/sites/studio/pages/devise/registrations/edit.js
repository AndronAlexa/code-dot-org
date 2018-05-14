import $ from 'jquery';
import React from 'react';
import ReactDOM from 'react-dom';
import ChangeEmailModal from '@cdo/apps/lib/ui/ChangeEmailModal';
import color from '@cdo/apps/util/color';
import getScriptData from '@cdo/apps/util/getScriptData';

const scriptData = getScriptData('edit');
const initialUserType = scriptData.userType;

const changeEmailMountPoint = document.createElement('div');
function showChangeEmailModal() {
  document.body.appendChild(changeEmailMountPoint);
  const form = document.getElementById('change-email-modal-form');
  const userAge = parseInt(document.getElementById('user_age').value, 10);
  const userHashedEmail = document.getElementById('change-email-modal_user_hashed_email').value;
  ReactDOM.render(
    <ChangeEmailModal
      isOpen
      handleSubmit={onEmailChanged}
      handleCancel={hideChangeEmailModal}
      railsForm={form}
      userAge={userAge}
      currentHashedEmail={userHashedEmail}
    />,
    changeEmailMountPoint
  );
}

function onEmailChanged(newEmail) {
  const displayedUserEmail = $('#displayed-user-email');
  if ('***encrypted***' !== displayedUserEmail.text()) {
    displayedUserEmail.text(newEmail);
  }
  hideChangeEmailModal();
  $(displayedUserEmail).effect('highlight', {
    duration: 1500,
    color: color.orange,
  });
}

function hideChangeEmailModal() {
  ReactDOM.unmountComponentAtNode(changeEmailMountPoint);
  document.body.removeChild(changeEmailMountPoint);
}

function onUserTypeChange(selectedType) {
  $('#change-user-type-button').prop('disabled', selectedType === initialUserType);
}

$(document).ready(() => {
  $( "#edit_user_create_personal_account" ).on("submit", function (e) {
    if ($('#create_personal_user_email').length) {
      window.dashboard.hashEmail({
        email_selector: '#create_personal_user_email',
        hashed_email_selector: '#create_personal_user_hashed_email',
        age_selector: '#user_age'
      });
    }
  });

  // Enable
  $('#change-user-type_user_user_type').change(e => onUserTypeChange(e.target.value));
  onUserTypeChange(initialUserType);

  $('#edit-email-link').click(showChangeEmailModal);
});
