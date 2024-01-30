import React from 'react';
import PropTypes from 'prop-types';
import SafeMarkdown from '@cdo/apps/templates/SafeMarkdown';
import SetupInstructions from '@cdo/apps/lib/kits/maker/ui/SetupInstructions';
import Notification, {NotificationType} from '@cdo/apps/templates/Notification';
import {isCodeOrgBrowser, getChromeVersion} from '../util/browserChecks';
import applabI18n from '@cdo/applab/locale';
import i18n from '@cdo/locale';
import {
  MAKER_DEPRECATION_SUPPORT_URL,
  MIN_CHROME_VERSION,
} from '@cdo/apps/lib/kits/maker/util/makerConstants';

const style = {
  descriptionFlexCard: {
    width: '45%',
  },
};

export default class SetupGuide extends React.Component {
  setupGuideContent = content => {
    return {
      id: 'general-description',
      title: applabI18n.makerSetupGeneralTitle(),
      description: applabI18n.makerSetupGeneralDescription(),
    };
  };

  render() {
    const chromeVersion = getChromeVersion();

    return (
      <div>
        {isCodeOrgBrowser() && (
          <Notification
            type={NotificationType.failure}
            notice={i18n.makerAppDeprecationNoticeTitle()}
            details={i18n.makerAppDeprecationNoticeDetails()}
            detailsLinkText={i18n.makerDeprecationNoticeLinkText()}
            detailsLink={MAKER_DEPRECATION_SUPPORT_URL}
            dismissible
          />
        )}
        {!isCodeOrgBrowser() &&
          chromeVersion &&
          chromeVersion < MIN_CHROME_VERSION && (
            <Notification
              type={NotificationType.warning}
              notice={i18n.makerSetupDeprecationNoticeOldChromeTitle()}
              details={i18n.makerSetupDeprecationNoticeOldChromeDetails({
                minChromeVersion: MIN_CHROME_VERSION,
              })}
              detailsLinkText={i18n.makerDeprecationNoticeLinkText()}
              detailsLink={MAKER_DEPRECATION_SUPPORT_URL}
              dismissible
            />
          )}
        <h1>{applabI18n.makerSetupPageTitle()}</h1>

        <div>
          <div style={style.oneColumn}>
            <HeaderCard {...this.setupGuideContent('general')} />
          </div>
        </div>

        <div id="setup-status-mount">
          <SetupInstructions />
        </div>
      </div>
    );
  }
}

function DescriptionCard(props) {
  return (
    <div id={props.id} style={props.divStyle}>
      <h2>{props.title}</h2>
      <center>
        <a href={props.href}>
          <img
            src={props.imgSrc}
            width={200}
            style={props.imgStyle}
            alt={props.alt}
          />
        </a>
      </center>
      <div className="description-content">
        <SafeMarkdown markdown={props.description} />
      </div>
    </div>
  );
}
DescriptionCard.propTypes = {
  id: PropTypes.string,
  title: PropTypes.string.isRequired,
  href: PropTypes.string.isRequired,
  imgSrc: PropTypes.string.isRequired,
  imgStyle: PropTypes.object,
  description: PropTypes.string.isRequired,
  divStyle: PropTypes.object,
  alt: PropTypes.string.isRequired,
};

function HeaderCard(props) {
  return (
    <div id={props.id} style={props.divStyle}>
      <h2>{props.title}</h2>
      <div className="description-content">
        <SafeMarkdown markdown={props.description} />
      </div>
    </div>
  );
}
HeaderCard.propTypes = {
  id: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  divStyle: PropTypes.object,
};
