import React from 'react';
import ResourceCard from './ResourceCard';
import ContentContainer from './ContentContainer';
import i18n from "@cdo/locale";

const TeacherAssignablesCatalog = React.createClass({
  propTypes: {
    codeOrgUrlPrefix: React.PropTypes.string.isRequired,
    isRtl: React.PropTypes.bool.isRequired
  },

  render() {
    const { codeOrgUrlPrefix, isRtl } = this.props;

    return (
      <ContentContainer heading={i18n.teacherCoursesHeading()} isRtl={false}>
        <ResourceCard
          title={i18n.teacherCourseHoc()}
          description={i18n.teacherCourseHocDescription()}
          image="hourofcode"
          buttonText={i18n.learnMore()}
          link={`${codeOrgUrlPrefix}/hourofcode/overview`}
          isRtl={isRtl}
        />
        <ResourceCard
          title={i18n.teacherCourseElementary()}
          description={i18n.teacherCourseElementaryDescription()}
          image="elementary"
          buttonText={i18n.learnMore()}
          link={`${codeOrgUrlPrefix}/educate/curriculum/elementary-school`}
          isRtl={isRtl}
        />
        <ResourceCard
          title={i18n.teacherCourseMiddle()}
          description={i18n.teacherCourseMiddleDescription()}
          image="middleschool"
          buttonText={i18n.learnMore()}
          link={`${codeOrgUrlPrefix}/educate/curriculum/middle-school`}
          isRtl={isRtl}
        />
        <ResourceCard
          title={i18n.teacherCourseHighOlder()}
          description={i18n.teacherCourseHighDescription()}
          image="highschool"
          buttonText={i18n.learnMore()}
          link={`${codeOrgUrlPrefix}/educate/curriculum/high-school`}
          isRtl={isRtl}
        />
      </ContentContainer>
    );
  }
});

export default TeacherAssignablesCatalog;
