import React from 'react';
import {shallow} from 'enzyme';
import {expect} from '../../util/reconfiguredChai';
import {UnconnectedMultipleSectionsAssigner as MultipleSectionsAssigner} from '@cdo/apps/templates/MultipleSectionsAssigner';
import {fakeTeacherSectionsForDropdown} from '@cdo/apps/templates/teacherDashboard/sectionAssignmentTestHelper';
import {
  assignToSection,
  unassignSection
} from '@cdo/apps/templates/teacherDashboard/teacherSectionsRedux';
import {updateHiddenScript} from '@cdo/apps/code-studio/hiddenLessonRedux';
import sinon from 'sinon';

describe('MultipleSectionsAssigner', () => {
  const assigedStandaloneUnitSection = fakeTeacherSectionsForDropdown[3];
  const assigedCourseButNOTUnitSection = fakeTeacherSectionsForDropdown[4];
  const assignedCourseANDUnitSection = fakeTeacherSectionsForDropdown[5];
  const unassignedSection = fakeTeacherSectionsForDropdown[2];
  const assignedSection = fakeTeacherSectionsForDropdown[1];
  const defaultProps = {
    assignmentName: 'testing section',
    onClose: () => {},
    sections: fakeTeacherSectionsForDropdown,
    unassignSection: unassignSection,
    assignToSection: assignToSection,
    updateHiddenScript: updateHiddenScript,
    participantAudience: 'student'
  };
  const setUp = (overrideProps = {}) => {
    const props = {...defaultProps, ...overrideProps};
    return shallow(<MultipleSectionsAssigner {...props} />);
  };

  it('renders checked and unchecked checkboxes for sections on the UNIT landing page', () => {
    const wrapper = setUp({
      isOnCoursePage: false,
      courseId: assignedCourseANDUnitSection.courseId,
      isStandAloneUnit: false,
      scriptId: assignedCourseANDUnitSection.unitId
    });

    // Checks that an assigned section is checked
    expect(
      wrapper
        .find('TeacherSectionOption')
        .filterWhere(
          n => n.props().section.id === assignedCourseANDUnitSection.id
        )
        .first()
        .props().isChecked
    ).to.be.true;

    // Checks that a section assiged the course but not the unit is NOT checked
    expect(
      wrapper
        .find('TeacherSectionOption')
        .filterWhere(
          n => n.props().section.id === assigedCourseButNOTUnitSection.id
        )
        .first()
        .props().isChecked
    ).to.be.false;
  });

  it('renders checked and unchecked checkboxes for sections on the COURSE landing page', () => {
    const wrapper = setUp({
      isOnCoursePage: true,
      courseId: assignedCourseANDUnitSection.courseId,
      isStandAloneUnit: false,
      scriptId: assignedCourseANDUnitSection.unitId
    });

    // Checks that an assigned section is checked
    expect(
      wrapper
        .find('TeacherSectionOption')
        .filterWhere(
          n => n.props().section.id === assignedCourseANDUnitSection.id
        )
        .first()
        .props().isChecked
    ).to.be.true;

    // Checks that a section assiged the course but not the unit is checked
    expect(
      wrapper
        .find('TeacherSectionOption')
        .filterWhere(
          n => n.props().section.id === assigedCourseButNOTUnitSection.id
        )
        .first()
        .props().isChecked
    ).to.be.true;

    // Checks that a section not assigned ANY curriculum is NOT checked
    expect(
      wrapper
        .find('TeacherSectionOption')
        .filterWhere(n => n.props().section.id === unassignedSection.id)
        .first()
        .props().isChecked
    ).to.be.false;

    // Checks that a section assigned to a different curriculum is NOT checked
    expect(
      wrapper
        .find('TeacherSectionOption')
        .filterWhere(n => n.props().section.id === assignedSection.id)
        .first()
        .props().isChecked
    ).to.be.false;
  });

  it('renders checked and unchecked checkboxes for sections on a STAND ALONE landing page', () => {
    const wrapper = setUp({
      isOnCoursePage: false,
      courseId: assigedStandaloneUnitSection.courseId,
      isStandAloneUnit: true,
      scriptId: assigedStandaloneUnitSection.unitId,
      courseVersionId: assigedStandaloneUnitSection.courseVersionId
    });

    // Checks that an assigned section is checked
    expect(
      wrapper
        .find('TeacherSectionOption')
        .filterWhere(
          n => n.props().section.id === assigedStandaloneUnitSection.id
        )
        .first()
        .props().isChecked
    ).to.be.true;

    // Checks that a section assiged the course but not the unit is NOT checked
    expect(
      wrapper
        .find('TeacherSectionOption')
        .filterWhere(n => n.props().section.id === assignedSection.id)
        .first()
        .props().isChecked
    ).to.be.false;
  });

  // this feels like a spot check - should we check another version where the participant audience is 'teacher'?
  it('renders all assignable sections for the course', () => {
    const wrapper = setUp({
      isOnCoursePage: true,
      courseId: assignedCourseANDUnitSection.courseId,
      isStandAloneUnit: false,
      scriptId: assignedCourseANDUnitSection.unitId,
      courseOfferingId: assignedCourseANDUnitSection.courseOfferingId,
      courseVersionId: assignedCourseANDUnitSection.courseVersionId
    });

    // Check that courses 1-6 have TeacherOptions and course 7 does not.
    for (let i = 0; i < wrapper.instance().props.sections.length; i++) {
      wrapper.instance().props.sections[i].participantType ===
      wrapper.instance().props.participantAudience
        ? expect(
            wrapper
              .find('TeacherSectionOption')
              .filterWhere(
                n =>
                  n.props().section.id ===
                  wrapper.instance().props.sections[i].id
              )
          ).to.exist
        : expect(
            wrapper
              .find('TeacherSectionOption')
              .filterWhere(
                n =>
                  n.props().section.id ===
                  wrapper.instance().props.sections[i].id
              )
          ).to.have.lengthOf(0);
    }
  });

  it('unassigns a unit but keeps the course assignment on the UNIT landing page of a non-standalone course when checkbox is unchecked', () => {
    let assignToSection = sinon.fake();
    let reassignConfirm = sinon.fake();

    const wrapper = setUp({
      isOnCoursePage: false,
      courseId: assignedCourseANDUnitSection.courseId,
      isStandAloneUnit: false,
      scriptId: assignedCourseANDUnitSection.unitId,
      assignToSection,
      reassignConfirm,
      courseOfferingId: assignedCourseANDUnitSection.courseOfferingId,
      courseVersionId: assignedCourseANDUnitSection.courseVersionId
    });

    wrapper
      .find('TeacherSectionOption')
      .filterWhere(
        n => n.props().section.id === assignedCourseANDUnitSection.id
      )
      .first()
      .simulate('change');

    expect(
      wrapper
        .find('TeacherSectionOption')
        .filterWhere(
          n => n.props().section.id === assignedCourseANDUnitSection.id
        )
        .first()
        .props().isChecked
    ).to.be.false;

    wrapper.find('#confirm-assign').simulate('click');

    expect(assignToSection).to.have.been.calledOnce;
    expect(reassignConfirm).to.have.been.calledOnce;
    expect(assignToSection).to.have.been.calledWith(
      assignedCourseANDUnitSection.id,
      assignedCourseANDUnitSection.courseId,
      assignedCourseANDUnitSection.courseOfferingId,
      assignedCourseANDUnitSection.courseVersionId
    );
  });

  it('assigns a unit on the unit landing page of STANDALONE course when checkbox is checked', () => {
    let assignToSection = sinon.fake();
    let reassignConfirm = sinon.fake();
    let updateHiddenScript = sinon.fake();

    const wrapper = setUp({
      isOnCoursePage: false,
      courseId: assigedStandaloneUnitSection.courseId,
      isStandAloneUnit: true,
      scriptId: assigedStandaloneUnitSection.unitId,
      assignToSection,
      reassignConfirm,
      updateHiddenScript,
      courseOfferingId: assigedStandaloneUnitSection.courseOfferingId,
      courseVersionId: assigedStandaloneUnitSection.courseVersionId
    });

    wrapper
      .find('TeacherSectionOption')
      .filterWhere(n => n.props().section.id === unassignedSection.id)
      .first()
      .simulate('change');

    expect(
      wrapper
        .find('TeacherSectionOption')
        .filterWhere(n => n.props().section.id === unassignedSection.id)
        .first()
        .props().isChecked
    ).to.be.true;

    wrapper.find('#confirm-assign').simulate('click');

    expect(updateHiddenScript).to.have.been.calledOnce;
    expect(assignToSection).to.have.been.calledOnce;
    expect(assignToSection).to.have.been.calledWith(
      unassignedSection.id,
      assigedStandaloneUnitSection.courseId,
      assigedStandaloneUnitSection.courseOfferingId,
      assigedStandaloneUnitSection.courseVersionId,
      assigedStandaloneUnitSection.unitId
    );
  });

  it('unassigns a unit on the unit landing page of STANDALONE course when checkbox is unchecked', () => {
    let unassignSection = sinon.fake();
    let reassignConfirm = sinon.fake();

    const wrapper = setUp({
      isOnCoursePage: false,
      courseId: assigedStandaloneUnitSection.courseId,
      isStandAloneUnit: true,
      scriptId: assigedStandaloneUnitSection.unitId,
      unassignSection,
      reassignConfirm,
      courseOfferingId: assigedStandaloneUnitSection.courseOfferingId,
      courseVersionId: assigedStandaloneUnitSection.courseVersionId
    });

    wrapper
      .find('TeacherSectionOption')
      .filterWhere(
        n => n.props().section.id === assigedStandaloneUnitSection.id
      )
      .first()
      .simulate('change');

    expect(
      wrapper
        .find('TeacherSectionOption')
        .filterWhere(
          n => n.props().section.id === assigedStandaloneUnitSection.id
        )
        .first()
        .props().isChecked
    ).to.be.false;

    wrapper.find('#confirm-assign').simulate('click');

    expect(unassignSection).to.have.been.calledOnce;
    expect(reassignConfirm).to.have.been.calledOnce;
    expect(unassignSection).to.have.been.calledWith(
      assigedStandaloneUnitSection.id
    );
  });

  it('assigns a unit on the UNIT landing page of non-standalone course when checkbox is checked', () => {
    let reassignConfirm = sinon.fake();
    let assignToSection = sinon.fake();
    let updateHiddenScript = sinon.fake();

    const wrapper = setUp({
      isOnCoursePage: false,
      courseId: assignedCourseANDUnitSection.courseId,
      isStandAloneUnit: false,
      scriptId: assignedCourseANDUnitSection.unitId,
      reassignConfirm,
      assignToSection,
      updateHiddenScript,
      courseOfferingId: assignedCourseANDUnitSection.courseOfferingId,
      courseVersionId: assignedCourseANDUnitSection.courseVersionId
    });

    wrapper
      .find('TeacherSectionOption')
      .filterWhere(n => n.props().section.id === unassignedSection.id)
      .first()
      .simulate('change');

    expect(
      wrapper
        .find('TeacherSectionOption')
        .filterWhere(n => n.props().section.id === unassignedSection.id)
        .first()
        .props().isChecked
    ).to.be.true;

    wrapper.find('#confirm-assign').simulate('click');

    expect(updateHiddenScript).to.have.been.calledOnce;
    expect(assignToSection).to.have.been.calledOnce;
    expect(reassignConfirm).to.have.been.calledOnce;
    expect(assignToSection).to.have.been.calledWith(
      unassignedSection.id,
      assignedCourseANDUnitSection.courseId,
      assignedCourseANDUnitSection.courseOfferingId,
      assignedCourseANDUnitSection.courseVersionId,
      assignedCourseANDUnitSection.unitId
    );
  });

  it('unassigns a course on the COURSE landing page checkbox is unchecked', () => {
    let unassignSection = sinon.fake();
    let reassignConfirm = sinon.fake();

    const wrapper = setUp({
      isOnCoursePage: true,
      courseId: assignedCourseANDUnitSection.courseId,
      isStandAloneUnit: false,
      scriptId: assignedCourseANDUnitSection.unitId,
      unassignSection,
      reassignConfirm,
      courseOfferingId: assignedCourseANDUnitSection.courseOfferingId,
      courseVersionId: assignedCourseANDUnitSection.courseVersionId
    });

    wrapper
      .find('TeacherSectionOption')
      .filterWhere(
        n => n.props().section.id === assignedCourseANDUnitSection.id
      )
      .first()
      .simulate('change');

    expect(
      wrapper
        .find('TeacherSectionOption')
        .filterWhere(
          n => n.props().section.id === assignedCourseANDUnitSection.id
        )
        .first()
        .props().isChecked
    ).to.be.false;

    wrapper.find('#confirm-assign').simulate('click');

    expect(unassignSection).to.have.been.calledOnce;
    expect(reassignConfirm).to.have.been.calledOnce;
    expect(unassignSection).to.have.been.calledWith(
      assignedCourseANDUnitSection.id,
      ''
    );
  });

  it('assigns a course on the COURSE landing page checkbox is checked', () => {
    let assignToSection = sinon.fake();
    let reassignConfirm = sinon.fake();

    const wrapper = setUp({
      isOnCoursePage: true,
      courseId: assignedCourseANDUnitSection.courseId,
      isStandAloneUnit: false,
      scriptId: assignedCourseANDUnitSection.unitId,
      assignToSection,
      reassignConfirm,
      courseOfferingId: assignedCourseANDUnitSection.courseOfferingId,
      courseVersionId: assignedCourseANDUnitSection.courseVersionId
    });

    wrapper
      .find('TeacherSectionOption')
      .filterWhere(n => n.props().section.id === unassignedSection.id)
      .first()
      .simulate('change');

    expect(
      wrapper
        .find('TeacherSectionOption')
        .filterWhere(n => n.props().section.id === unassignedSection.id)
        .first()
        .props().isChecked
    ).to.be.true;

    wrapper.find('#confirm-assign').simulate('click');

    expect(assignToSection).to.have.been.calledOnce;
    expect(reassignConfirm).to.have.been.calledOnce;
    expect(assignToSection).to.have.been.calledWith(
      unassignedSection.id,
      assignedCourseANDUnitSection.courseId,
      assignedCourseANDUnitSection.courseOfferingId,
      assignedCourseANDUnitSection.courseVersionId,
      assignedCourseANDUnitSection.unitId
    );
  });

  it('can select all sections using the `select all` link', () => {
    const wrapper = setUp({
      isOnCoursePage: false,
      courseId: assignedCourseANDUnitSection.courseId,
      isStandAloneUnit: false,
      scriptId: assignedCourseANDUnitSection.unitId
    });

    wrapper.find('.select-all-sections').simulate('click');
    const allSections = wrapper.find('TeacherSectionOption');
    for (let i = 0; i < allSections.length; i++) {
      expect(allSections.at(i).props().isChecked).to.be.true;
    }
  });
});
