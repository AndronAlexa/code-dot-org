import React, {PropTypes} from 'react';
import ReactTooltip from 'react-tooltip';
import _ from 'lodash';
import i18n from '@cdo/locale';
import color from '@cdo/apps/util/color';
import {tableLayoutStyles} from "@cdo/apps/templates/tables/tableConstants";
import BootstrapButton from './BootstrapButton';

const OAUTH_PROVIDERS = {
  GOOGLE: 'google_oauth2',
  FACEBOOK: 'facebook',
  CLEVER: 'clever',
  MICROSOFT: 'windowslive',
};
const ENCRYPTED = `*** ${i18n.encrypted()} ***`;

export default class ManageLinkedAccounts extends React.Component {
  static propTypes = {
    userType: PropTypes.string.isRequired,
    authenticationOptions: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.number.isRequired,
      credential_type: PropTypes.string.isRequired,
      email: PropTypes.string,
      hashed_email: PropTypes.string,
    })).isRequired,
    connect: PropTypes.func.isRequired,
    disconnect: PropTypes.func.isRequired,
  };

  getAuthenticationOption = (provider) => {
    return this.props.authenticationOptions.find(option => {
      return option.credential_type === provider;
    });
  };

  getEmailForProvider = (provider) => {
    const authOption = this.getAuthenticationOption(provider);
    if (authOption) {
      if (this.props.userType === 'student') {
        return ENCRYPTED;
      }
      return authOption.email;
    }
  };

  toggleProvider = (provider) => {
    const authOption = this.getAuthenticationOption(provider);
    if (authOption) {
      this.disconnect(authOption.id);
    } else {
      this.props.connect(provider);
    }
  };

  disconnect = (authOptionId) => {
    this.props.disconnect(authOptionId).then(_, this.onFailure);
  };

  onFailure = (error) => {
    // TODO: (madelynkasula) display error to user
    console.log(error.message);
  };

  render() {
    return (
      <div style={styles.container}>
        <hr/>
        <h2 style={styles.header}>{i18n.manageLinkedAccounts()}</h2>
        <table style={styles.table}>
          <thead>
            <tr>
              <th style={styles.headerCell}>{i18n.manageLinkedAccounts_loginType()}</th>
              <th style={styles.headerCell}>{i18n.manageLinkedAccounts_emailAddress()}</th>
              <th style={styles.headerCell}>{i18n.manageLinkedAccounts_actions()}</th>
            </tr>
          </thead>
          <tbody>
            <OauthConnection
              type={OAUTH_PROVIDERS.GOOGLE}
              displayName={i18n.manageLinkedAccounts_google_oauth2()}
              email={this.getEmailForProvider(OAUTH_PROVIDERS.GOOGLE)}
              onClick={() => this.toggleProvider(OAUTH_PROVIDERS.GOOGLE)}
            />
            <OauthConnection
              type={OAUTH_PROVIDERS.MICROSOFT}
              displayName={i18n.manageLinkedAccounts_microsoft()}
              email={this.getEmailForProvider(OAUTH_PROVIDERS.MICROSOFT)}
              onClick={() => this.toggleProvider(OAUTH_PROVIDERS.MICROSOFT)}
            />
            <OauthConnection
              type={OAUTH_PROVIDERS.CLEVER}
              displayName={i18n.manageLinkedAccounts_clever()}
              email={this.getEmailForProvider(OAUTH_PROVIDERS.CLEVER)}
              onClick={() => this.toggleProvider(OAUTH_PROVIDERS.CLEVER)}
            />
            <OauthConnection
              type={OAUTH_PROVIDERS.FACEBOOK}
              displayName={i18n.manageLinkedAccounts_facebook()}
              email={this.getEmailForProvider(OAUTH_PROVIDERS.FACEBOOK)}
              onClick={() => this.toggleProvider(OAUTH_PROVIDERS.FACEBOOK)}
            />
          </tbody>
        </table>
      </div>
    );
  }
}

class OauthConnection extends React.Component {
  static propTypes = {
    type: PropTypes.oneOf(Object.values(OAUTH_PROVIDERS)).isRequired,
    displayName: PropTypes.string.isRequired,
    email: PropTypes.string,
    onClick: PropTypes.func.isRequired,
    cannotDisconnect: PropTypes.bool
  };

  render() {
    const {displayName, email, onClick, cannotDisconnect} = this.props;
    const emailStyles = !!email ? styles.cell : {...styles.cell, ...styles.emptyEmailCell};
    const buttonText = !!email ?
      i18n.manageLinkedAccounts_disconnect() :
      i18n.manageLinkedAccounts_connect();
    const tooltipId = _.uniqueId();

    return (
      <tr>
        <td style={styles.cell}>
          {displayName}
        </td>
        <td style={emailStyles}>
          {email || i18n.manageLinkedAccounts_notConnected()}
        </td>
        <td style={styles.cell}>
          <span
            data-for={tooltipId}
            data-tip
          >
            {/* This button intentionally uses BootstrapButton to match other account page buttons */}
            <BootstrapButton
              style={styles.button}
              text={buttonText}
              onClick={onClick}
              disabled={cannotDisconnect}
            />
            {cannotDisconnect &&
              <ReactTooltip
                id={tooltipId}
                offset={styles.tooltipOffset}
                role="tooltip"
                effect="solid"
              >
                <div style={styles.tooltip}>
                  {i18n.manageLinkedAccounts_cannotDisconnectTooltip()}
                </div>
              </ReactTooltip>
            }
          </span>
        </td>
      </tr>
    );
  }
}

const GUTTER = 20;
const BUTTON_WIDTH = 105;
const styles = {
  container: {
    paddingTop: GUTTER,
  },
  header: {
    fontSize: 22,
  },
  table: {
    ...tableLayoutStyles.table,
    marginTop: GUTTER,
  },
  headerCell: {
    ...tableLayoutStyles.headerCell,
    paddingLeft: GUTTER,
    paddingRight: GUTTER,
    fontWeight: 'normal',
    width: tableLayoutStyles.table.width / 3,
  },
  cell: {
    ...tableLayoutStyles.cell,
    paddingLeft: GUTTER,
    paddingRight: GUTTER,
  },
  emptyEmailCell: {
    color: color.light_gray,
    fontStyle: 'italic',
  },
  button: {
    width: BUTTON_WIDTH,
    fontFamily: '"Gotham 5r", sans-serif',
    color: color.charcoal,
    padding: 8,
  },
  tooltipOffset: {
    left: -(BUTTON_WIDTH / 2)
  },
  tooltip: {
    width: BUTTON_WIDTH * 2
  },
};
