import React from 'react';
import {mount, shallow} from 'enzyme';
import {expect} from '../../../util/reconfiguredChai';
import {Body} from '@cdo/apps/templates/Dialog';
import SchoolInfoInterstitial from '@cdo/apps/lib/ui/SchoolInfoInterstitial';
import SchoolInfoConfirmationDialog from '@cdo/apps/lib/ui/SchoolInfoConfirmationDialog';

describe('SchoolInfoConfirmationDialog', () => {
  const MINIMUM_PROPS = {
    scriptData: {
      formUrl: '',
      authTokenName: 'auth_token',
      authTokenValue: 'fake_auth_token',
      existingSchoolInfo: {},
    },
    onClose: function () {},
  };

  it('renders the schoolinfointerstitial form', () => {
    const wrapper = shallow(
      <SchoolInfoConfirmationDialog
        {...MINIMUM_PROPS}
        scriptData={{
          ...MINIMUM_PROPS.scriptData,
          existingSchoolInfo: {
            country: 'US',
          },
        }}
      />
    );

    wrapper.setState({showSchoolInterstitial: true});
    expect(wrapper.find(SchoolInfoInterstitial)).to.have.lengthOf(1);
  });

  it('renders the school info confirmation dialog', () => {
    const wrapper = shallow(
      <SchoolInfoConfirmationDialog
        {...MINIMUM_PROPS}
        scriptData={{
          ...MINIMUM_PROPS.scriptData,
          existingSchoolInfo: {
            country: 'US',
          },
        }}
      />
    );

    expect(wrapper.find(Body)).to.have.lengthOf(1);
  });

  it('confirms there are two buttons in the school information confirmation modal', () => {
    const wrapper = mount(
      <SchoolInfoConfirmationDialog
        {...MINIMUM_PROPS}
        scriptData={{
          ...MINIMUM_PROPS.scriptData,
          existingSchoolInfo: {
            country: 'US',
          },
        }}
      />
    );
    const handleClickUpdateStub = jest
      .spyOn(wrapper.instance(), 'handleClickUpdate')
      .mockClear()
      .mockImplementation();
    handleClickUpdateStub.callsFake(() => {});
    wrapper.setState({showSchoolInterstitial: false});
    wrapper.find('Button');
    expect(wrapper.find('Button').length).to.equal(3);
  });

  describe('fetch', () => {
    let stubedFetch;

    beforeEach(() => {
      stubedFetch = jest
        .spyOn(window, 'fetch')
        .mockClear()
        .mockImplementation();
    });

    afterEach(() => {
      stubedFetch.mockRestore();
    });

    describe('school info confirmation dialog behavior', () => {
      const onClose = jest.fn();
      const wrapper = mount(
        <SchoolInfoConfirmationDialog
          {...MINIMUM_PROPS}
          scriptData={{
            ...MINIMUM_PROPS.scriptData,
            existingSchoolInfo: {
              country: 'US',
            },
          }}
          onClose={onClose}
          isOpen={true}
        />
      );

      it('calls handleClickUpdate method when a user clicks the button to update school information', async () => {
        const wrapperInstance = wrapper.instance();
        jest.spyOn(wrapperInstance, 'handleClickUpdate').mockClear();
        wrapper.setState({showSchoolInterstitial: false});
        wrapper.find('button#update-button').simulate('click');

        expect(wrapperInstance.handleClickUpdate).to.have.been.called;
        await setTimeout(() => {}, 50);
        expect(wrapper.state('showSchoolInterstitial')).to.be.true;
      });

      it('calls handleClickYes method when a user does not need to update school information', async () => {
        stubedFetch.resolves();
        const wrapperInstance = wrapper.instance();
        const handleClickYesSpy = jest
          .spyOn(wrapperInstance, 'handleClickYes')
          .mockClear();
        wrapper.setState({showSchoolInterstitial: false});
        wrapper.find('button#yes-button').simulate('click');

        expect(wrapperInstance.handleClickYes).to.have.been.called;
        await setTimeout(() => {}, 50);
        expect(onClose).to.have.been.called;
        await setTimeout(() => {}, 50);
        expect(wrapper.state('showSchoolInterstitial')).to.be.false;
        handleClickYesSpy.mockRestore();
      });
    });
  });

  describe('when to render school info confirmation dialog', () => {
    let onClose, wrapper;

    beforeEach(() => {
      onClose = jest.fn();
      wrapper = mount(
        <SchoolInfoConfirmationDialog
          {...MINIMUM_PROPS}
          scriptData={{
            ...MINIMUM_PROPS.scriptData,
            existingSchoolInfo: {
              country: 'US',
            },
          }}
          onClose={onClose}
          isOpen={true}
        />
      );
    });

    it('renders school info form when school info interstitial is set to true', () => {
      const wrapperInstance = wrapper.instance();
      const renderSchoolInformationForm = jest
        .spyOn(wrapperInstance, 'renderSchoolInformationForm')
        .mockClear();
      wrapper.setState({showSchoolInterstitial: true});

      expect(renderSchoolInformationForm).to.have.been.called;
    });

    it('renders school info confirmation dialog when school info interstitial is set to false', () => {
      const wrapperInstance = wrapper.instance();
      const renderSchoolInfoConfirmationDialog = jest
        .spyOn(wrapperInstance, 'renderInitialContent')
        .mockClear();
      wrapper.setState({showSchoolInterstitial: false});

      expect(renderSchoolInfoConfirmationDialog).to.have.been.called;
    });
  });
});
