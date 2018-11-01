module Pd
  module Teacher1920ApplicationConstants
    include Pd::TeacherCommonApplicationConstants

    # Remove newlines and leading whitespace from multiline strings
    def self.clean_multiline(string)
      string.gsub(/\n\s*/, ' ')
    end

    SECTION_HEADERS = {
      section_1_about_you: 'About You',
      section_2_choose_your_program: 'Choose Your Program',
      section_3_teaching_background: 'Teaching Background',
      section_4_professional_learning_program_requirements: 'Professional Learning Program Requirements',
      section_5_additional_demographic_information: 'Additional Demographic Information',
      section_6_submission: 'Submission',
      school_stats_and_principal_approval_section: 'Principal Approval and School Information'
    }

    PAGE_LABELS = {
      section_1_about_you: BASE_PAGE_LABELS[:section_1_about_you].slice(
        :country,
        :title,
        :first_name,
        :last_name,
        :account_email,
        :alternate_email
      ).merge(
        {
          phone: 'Home or Cell Phone',
          gender_identity: 'Gender Identity',
          race: 'Race',
          address: 'Home Address',
          city: 'City',
          state: 'State',
          zip_code: 'Zip Code',
          school: 'School',
          school_name: 'School name',
          school_district_name: 'School district name',
          school_address: 'School address',
          school_city: 'City',
          school_state: 'State',
          school_zip_code: 'Zip code',
          school_type: 'My school is a',

          principal_title: "Principal's title",
          principal_first_name: "Principal's first name",
          principal_last_name: "Principal's last name",
          principal_email: "Principal's email address",
          principal_confirm_email: "Confirm principal's email address",
          principal_phone_number: "Principal's phone number",
          current_role: 'What is your current role at your school?',
          completing_on_behalf_of_someone_else: 'Are you completing this application on behalf of someone else?',
          completing_on_behalf_of_name: 'If yes, please include the full name and role of the teacher and why you are applying on behalf of this teacher.'
        }
      ),
      section_2_choose_your_program: {
        program: clean_multiline(
          'Which professional learning program would you like to join for the 2019-20
          school year? Note: this application is only for Computer Science Discoveries and
          Computer Science Principles. If you are interested in teaching Advanced
          Placement CS A (in Java), visit this
          [AP CS A overview](https://code.org/educate/curriculum/apcsa). Review this
          [guidance document](https://docs.google.com/document/d/1nFp033SuO_BMR-Bkinrlp0Ti_s-XYQDsOc-UjqNdrGw/edit#heading=h.6s62vrpws18)
          to make sure your course implementation plans meet program requirements.'
        ),
        csd_which_grades: clean_multiline(
          'To which grades does your school plan to offer CS Discoveries in the 2019-20 school year?
           Please note that the CS Discoveries Professional Learning Program
           is not available for grades K-5. (select all that apply)'
        ),
        csp_which_grades: clean_multiline(
          'To which grades does your school plan to offer CS Principles in the 2019-20
          school year? Please note that the CS Principles Professional Learning Program
          is not available for grades K-8. (select all that apply)'
        ),
        csp_how_offer: BASE_PAGE_LABELS[:section_3_choose_your_program][:csp_how_offer],
        cs_how_many_minutes: clean_multiline(
          'How many minutes will your CS program class last? (Include the
          number of minutes from start to finish that you see your students per class
          period. If it varies from day to day, estimate the average number of minutes
          you meet per class period.)'
        ),
        cs_how_many_days_per_week: 'How many days per week will your CS program class be offered to one section of students?',
        cs_how_many_weeks_per_year: 'How many weeks during the year will this course be taught to one section of students?',
        cs_total_course_hours: 'Computed total course hours',
        cs_terms: 'How will you be offering this CS program course to students?',
        plan_to_teach: BASE_PAGE_LABELS[:section_3_choose_your_program][:plan_to_teach].sub('18-19', '19-20'),
        replace_existing: 'Will this course replace an existing computer science course in the master schedule? If yes, please list the course(s) that will be replaced.',
        replace_which_course: 'If yes, please describe the course it will be replacing and why:'
      },
      section_3_teaching_background:
        {subjects_teaching: BASE_PAGE_LABELS[:section_2_your_school][:subjects_teaching].gsub('17-18', '18-19')}.merge(
          BASE_PAGE_LABELS[:section_2_your_school].slice(
            :does_school_require_cs_license,
            :what_license_required,
            :have_cs_license,
            :subjects_licensed_to_teach,
            :taught_in_past,
            :cs_offered_at_school,
            :cs_opportunities_at_school,
            :previous_yearlong_cdo_pd
          )
        ),
      section_4_professional_learning_program_requirements:
        {
          committed: BASE_PAGE_LABELS[:section_4_summer_workshop][:committed],
          able_to_attend_multiple: 'Your Regional Partner is hosting local summer workshop(s) at the following dates and locations. Please indicate which workshops you are able to attend. Select all that apply.',
          travel_to_another_workshop: 'If you are unable to make any of the above workshop dates, would you be open to traveling to another region for your local summer workshop?',
          willing_to_travel: BASE_PAGE_LABELS[:section_4_summer_workshop][:willing_to_travel],
          interested_in_online_program: 'Are you interested in this online program for school year workshops?',
          pay_fee: BASE_PAGE_LABELS[:section_4_summer_workshop][:pay_fee],
          scholarship_reasons: 'Please provide any additional information you’d like to share about why your application should be considered for a scholarship.'
        },
      section_5_additional_demographic_information:
        BASE_PAGE_LABELS[:section_5_submission].slice(:gender_identity, :race).merge(
          {
            how_heard: 'How did you hear about this program?'
          }
        ),
      section_6_submission: BASE_PAGE_LABELS[:section_5_submission].slice(:agree),
      school_stats_and_principal_approval_section: {
        title_i_status: 'Title I status',
        school_type: 'School Type',
        total_student_enrollment: 'Total Student Enrollment',
        free_lunch_percent: 'Percent of students that receive free/reduced lunch',
        underrepresented_minority_percent: 'Percent of students that are underrepresented minorities',
        american_indian_or_native_alaskan_percent: 'Percentage of student enrollment by race: American Indian or Native Alaskan',
        asian_percent: 'Percentage of student enrollment by race: Asian',
        black_or_african_american_percent: 'Percentage of student enrollment by race: Black or African American',
        hispanic_or_latino_percent: 'Percentage of student enrollment by race: Hispanic or Latino',
        native_hawaiian_or_pacific_islander_percent: 'Percentage of student enrollment by race: Native Hawaiian or Pacific Islander',
        white_percent: 'Percentage of student enrollment by race: White',
        two_or_more_races_percent: 'Percentage of student enrollment by race: Two or More Races',
        other_races_percent: 'Percentage of student enrollment by race: Other',
        principal_approval: "Do you approve of <Teacher Name> participating in Code.org's 2019-20 Professional Learning Program?",
        principal_plan_to_teach: 'Is <Teacher Name> planning to teach this course in the 2019-20 school year?',
        principal_schedule_confirmed: 'Are you committed to including Computer Science <Program> on the master schedule in 2019-20 if <Teacher Name> is accepted into the program?',
        principal_implementation: 'To participate in Code.org’s Computer Science <Program> Professional Learning Program, we require that this course be offered in one of the following ways. Please select which option will be implemented at your school.',
        principal_diversity_recruitment: 'Do you commit to recruiting and enrolling a diverse group of students in this course, representative of the overall demographics of your school?',
      }
    }.freeze

    LABEL_OVERRIDES = {
      program: 'Which professional learning program would you like to join for the 2019-20 school year?',
      cs_how_many_minutes: 'How many minutes will your class last?'
    }.freeze

    MULTI_ANSWER_QUESTION_FIELDS = {
      school_name: {principal: :principal_school_name},
      district_name: {principal: :principal_school_district},
      principal_first_name: {teacher: :principal_first_name, principal: :principal_response_first_name},
      principal_last_name: {teacher: :principal_last_name, principal: :principal_response_last_name},
      principal_email: {teacher: :principal_email, principal: :principal_response_email},

      plan_to_teach: {teacher: :plan_to_teach, principal: :principal_plan_to_teach},
      replace_existing: {teacher: :replace_existing, principal: :principal_wont_replace_existing_course},

      pay_fee: {teacher: :pay_fee, principal: :principal_pay_fee},

      how_heard: {teacher: :how_heard, principal: :principal_how_heard},

      title_i_status: {stats: :title_i_status},
      school_type: {teacher: :school_type, stats: :school_type},
      total_student_enrollment: {principal: :principal_total_enrollment, stats: :students_total},
      free_lunch_percent: {principal: :principal_free_lunch_percent, stats: :frl_eligible_percent},
      underrepresented_minority_percent: {principal: :principal_underrepresented_minority_percent, stats: :urm_percent},
      american_indian_or_native_alaskan_percent: {principal: :principal_american_indian_or_native_alaskan_percent, stats: :american_indian_alaskan_native_percent},
      asian_percent: {principal: :principal_asian_percent, stats: :asian_percent},
      black_or_african_american_percent: {principal: :principal_black_or_african_american_percent, stats: :black_or_african_american_percent},
      hispanic_or_latino_percent: {principal: :principal_hispanic_or_latino_percent, stats: :hispanic_or_latino_percent},
      native_hawaiian_or_pacific_islander_percent: {principal: :principal_native_hawaiian_or_pacific_islander_percent, stats: :native_hawaiian_or_pacific_islander_percent},
      white_percent: {principal: :principal_white_percent, stats: :white_percent},
      two_or_more_races_percent: {stats: :two_or_more_races_percent},
      other_races_percent: {principal: :principal_other_percent}
    }

    ALL_LABELS = PAGE_LABELS.values.reduce(:merge).freeze
    ALL_LABELS_WITH_OVERRIDES = ALL_LABELS.map {|k, v| [k, LABEL_OVERRIDES[k] || v]}.to_h.freeze
    ADDITIONAL_KEYS_IN_ANSWERS = MULTI_ANSWER_QUESTION_FIELDS.values.flat_map(&:values).uniq.freeze

    VALID_SCORES = {
      # Minimum requirements
      regional_partner_name: YES_NO,
      csd_which_grades: YES_NO,
      csp_which_grades: YES_NO,
      cs_total_course_hours: YES_NO,
      plan_to_teach: YES_NO,
      committed: YES_NO,
      willing_to_travel: YES_NO,
      principal_approval: YES_NO,
      principal_schedule_confirmed: YES_NO,
      principal_diversity_recruitment: YES_NO,
      # Scholarship requirements
      previous_yearlong_cdo_pd: YES_NO,
      # Bonus Points
      csp_how_offer: [2, 0],
      replace_existing: [5, 0],
      taught_in_past: [2, 0],
      free_lunch_percent: [5, 0],
      underrepresented_minority_percent: [5, 0],
      race: [2, 0],
      principal_implementation: [2, 0]
    }

    # Need to explicitly list these for the shared constant generation to work.
    SCOREABLE_QUESTIONS = {
      bonus_points: [
        :csp_how_offer,
        :replace_existing,
        :taught_in_past,
        :free_lunch_percent,
        :underrepresented_minority_percent,
        :race
      ],
      scholarship_questions: [
        :plan_to_teach,
        :previous_yearlong_cdo_pd,
        :principal_approval,
        :principal_schedule_confirmed,
        :principal_diversity_recruitment
      ],
      criteria_score_questions_csd: [
        :regional_partner_name,
        :csd_which_grades,
        :cs_total_course_hours,
        :plan_to_teach,
        :committed,
        :willing_to_travel,
        :principal_implementation
      ],
      criteria_score_questions_csp: [
        :regional_partner_name,
        :csp_which_grades,
        :cs_total_course_hours,
        :plan_to_teach,
        :committed,
        :willing_to_travel,
        :principal_implementation
      ]
    }
  end
end
