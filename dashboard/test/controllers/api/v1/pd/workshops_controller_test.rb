require 'test_helper'

class Api::V1::Pd::WorkshopsControllerTest < ::ActionController::TestCase
  freeze_time

  self.use_transactional_test_case = true
  setup_all do
    @admin = create(:admin)
    @workshop_admin = create(:workshop_admin)
    @organizer = create(:workshop_organizer)
    @facilitator = create(:facilitator)

    @workshop = create(
      :pd_workshop,
      organizer: @organizer,
      facilitators: [@facilitator],
      on_map: true,
      funded: true
    )

    @standalone_workshop = create(:pd_workshop)
  end

  setup do
    # Don't actually call the geocoder.
    Geocoder.stubs(:search).with('Seattle, WA')
  end

  # Action: Index

  test 'admins can list all workshops' do
    sign_in @admin
    assert_equal 2, Pd::Workshop.count

    get :index
    assert_response :success
    assert_equal 2, JSON.parse(@response.body).length
  end

  test 'workshop organizers can list all their workshops' do
    sign_in @organizer
    get :index
    assert_response :success
    assert_equal 1, JSON.parse(@response.body).length
  end

  test 'with the facilitated param, workshop organizers only view workshops they facilitated' do
    workshop_2 = create(:pd_workshop, organizer: @organizer, facilitators: [@organizer])

    sign_in @organizer
    get :index, params: {facilitator_view: 1}
    assert_response :success
    response = JSON.parse(@response.body)
    assert_equal 1, response.length
    assert_equal workshop_2.id, response[0]['id']
  end

  test_user_gets_response_for :workshops_user_enrolled_in, user: nil, response: :forbidden

  test 'workshops_user_enrolled_in returns workshops the user is enrolled in' do
    teacher = create :teacher
    sign_in(teacher)
    other_teacher = create :teacher

    workshop_2 = create :pd_workshop

    enrollment_1 = create(:pd_enrollment, workshop: @workshop, email: teacher.email, user_id: nil)
    enrollment_2 = create(:pd_enrollment, workshop: workshop_2, email: 'other@example.com', user_id: teacher.id)
    create(:pd_enrollment, workshop: @workshop, email: other_teacher.email, user_id: other_teacher.id)

    get :workshops_user_enrolled_in
    assert_response :success

    response = JSON.parse(@response.body)
    assert_equal 2, response.length
    assert_equal enrollment_1.code, response.find {|workshop| @workshop.id == workshop['id']}['enrollment_code']
    assert_equal enrollment_2.code, response.find {|workshop| workshop_2.id == workshop['id']}['enrollment_code']
  end

  test 'workshop organizers cannot list workshops they are not organizing' do
    sign_in create(:workshop_organizer)
    get :index
    assert_response :success
    assert_equal 0, JSON.parse(@response.body).length
  end

  test 'facilitators can list workshops they are facilitating' do
    sign_in @facilitator
    get :index
    assert_response :success
    assert_equal 1, JSON.parse(@response.body).length
    sign_out @facilitator
  end

  test 'facilitators cannot list workshops they are not facilitating' do
    sign_in create(:facilitator)
    get :index
    assert_response :success
    assert_equal 0, JSON.parse(@response.body).length
  end

  test 'filter by state' do
    sign_in @admin
    workshop_in_progress = create :pd_workshop
    workshop_in_progress.sessions << create(:pd_session)
    workshop_in_progress.start!
    assert_equal Pd::Workshop::STATE_IN_PROGRESS, workshop_in_progress.state

    get :index, params: {state: Pd::Workshop::STATE_IN_PROGRESS}
    assert_response :success
    response = JSON.parse(@response.body)
    assert_equal 1, response.length
    assert_equal workshop_in_progress.id, response[0]['id']
  end

  # Action: filter
  test 'admins can filter' do
    sign_in @admin
    get :filter
    assert_response :success
  end

  test 'organizers can filter' do
    sign_in @organizer
    get :filter
    assert_response :success
  end

  test 'facilitators can filter' do
    sign_in @facilitator
    get :filter
    assert_response :success
  end

  test 'filter defaults' do
    sign_in @admin
    get :filter
    response = JSON.parse(@response.body)
    assert_nil response['limit']
    assert_equal 2, response['total_count']
    assert_empty response['filters']
    assert_equal 2, response['workshops'].count
  end

  test 'filter limit' do
    # 10 more workshops, bringing the total to 12
    10.times do
      create :pd_workshop
    end

    sign_in @admin
    get :filter, params: {limit: 5}
    response = JSON.parse(@response.body)
    assert_equal 5, response['limit']
    assert_equal 12, response['total_count']
    assert_empty response['filters']
    assert_equal 5, response['workshops'].count
  end

  test 'filters' do
    # 10 workshops from different organizers that will be filtered out
    10.times do
      create :pd_workshop, num_sessions: 1
    end

    # Same organizer
    organizer = create :workshop_organizer
    earlier_workshop = create :pd_workshop, organizer: organizer, num_sessions: 1, sessions_from: Time.now
    later_workshop = create :pd_workshop, organizer: organizer, num_sessions: 1, sessions_from: Time.now + 1.week

    sign_in @admin
    filters = {organizer_id: organizer.id.to_s, order_by: 'date desc'}
    get :filter, params: filters
    response = JSON.parse(@response.body)

    assert_equal 2, response['workshops'].count
    assert_equal [later_workshop.id, earlier_workshop.id], response['workshops'].map {|w| w['id']}
    assert_equal filters.stringify_keys, response['filters']
  end

  # Action: Show

  test 'admins can view workshops' do
    [@admin, @workshop_admin].each do |admin|
      sign_in admin
      get :show, params: {id: @workshop.id}
      assert_response :success
      assert_equal @workshop.id, JSON.parse(@response.body)['id']
      sign_out admin
    end
  end

  test 'workshop organizers can view their workshops' do
    sign_in @organizer
    get :show, params: {id: @workshop.id}
    assert_response :success
    assert_equal @workshop.id, JSON.parse(@response.body)['id']
  end

  test_user_gets_response_for(
    :show,
    name: 'workshop organizers cannot view a workshop they are not organizing',
    response: :forbidden,
    user: -> {@organizer},
    params: -> {{id: @standalone_workshop.id}}
  )

  test_user_gets_response_for(
    :show,
    name: 'facilitators can view a workshop they are facilitating',
    user: -> {@facilitator},
    params: -> {{id: @workshop}}
  ) do
    assert_equal @workshop.id, JSON.parse(@response.body)['id']
  end

  test_user_gets_response_for(
    :show,
    name: 'facilitators cannot view a workshop they are not organizing',
    response: :forbidden,
    user: -> {@facilitator},
    params: -> {{id: @standalone_workshop.id}}
  )

  # Action: Create

  test 'admins can create workshops' do
    sign_in @admin

    assert_creates(Pd::Workshop) do
      post :create, params: {pd_workshop: workshop_params}
      assert_response :success
    end

    id = JSON.parse(@response.body)['id']
    workshop = Pd::Workshop.find id
    assert_equal 1, workshop.sessions.length
  end

  test 'workshop organizers can create workshops' do
    sign_in @organizer

    assert_creates(Pd::Workshop) do
      post :create, params: {pd_workshop: workshop_params}
      assert_response :success
    end
  end

  test_user_gets_response_for(
    :create,
    name: 'facilitators cannot create workshops',
    method: :post,
    response: :forbidden,
    user: :facilitator,
    params: -> {{pd_workshop: workshop_params}}
  )

  # Action: Destroy

  test 'organizers can delete their workshops' do
    sign_in @organizer
    assert_destroys(Pd::Workshop) do
      delete :destroy, params: {id: @workshop.id}
    end
    assert_response :success
  end

  test 'admins can delete any workshop' do
    sign_in @admin
    assert_destroys(Pd::Workshop) do
      delete :destroy, params: {id: @workshop.id}
    end
    assert_response :success
  end

  test_user_gets_response_for(
    :destroy,
    name: 'organizers cannot delete workshops they do not own',
    method: :delete,
    response: :forbidden,
    user: -> {@organizer},
    params: -> {{id: @standalone_workshop.id}}
  )

  test_user_gets_response_for(
    :destroy,
    name: 'facilitators cannot delete workshops',
    method: :delete,
    response: :forbidden,
    user: -> {@facilitator},
    params: -> {{id: @workshop.id}}
  )

  # Action: Update

  test 'admins can update any workshop' do
    sign_in @admin
    put :update, params: {id: @workshop.id, pd_workshop: workshop_params}
    assert_response :success
  end

  test 'organizers can update their workshops' do
    sign_in @organizer
    put :update, params: {id: @workshop.id, pd_workshop: workshop_params}
    assert_response :success
  end

  test 'organizers cannot update workshops they are not organizing' do
    sign_in @organizer
    put :update, params: {
      id: @standalone_workshop.id,
      pd_workshop: workshop_params
    }
    assert_response :forbidden
  end

  test_user_gets_response_for(
    :update,
    name: 'facilitators cannot update workshops',
    method: :put,
    response: :forbidden,
    user: -> {@facilitator},
    params: -> {{id: @workshop.id, pd_workshop: workshop_params}}
  )

  test 'updating with notify true sends detail change notification emails' do
    sign_in @admin

    # create some enrollments
    5.times do
      create :pd_enrollment, workshop: @workshop
    end
    mock_mail = stub(deliver_now: nil)
    Pd::WorkshopMailer.any_instance.expects(:detail_change_notification).times(5).returns(mock_mail)
    Pd::WorkshopMailer.any_instance.expects(:facilitator_detail_change_notification).returns(mock_mail)
    Pd::WorkshopMailer.any_instance.expects(:organizer_detail_change_notification).returns(mock_mail)

    put :update, params: {
      id: @workshop.id,
      pd_workshop: workshop_params,
      notify: true
    }
  end

  test 'updating with notify false does not send detail change notification emails' do
    sign_in @admin

    # create some enrollments
    5.times do
      create :pd_enrollment, workshop: @workshop
    end
    Pd::WorkshopMailer.any_instance.expects(:detail_change_notification).never

    put :update, params: {
      id: @workshop.id,
      pd_workshop: workshop_params,
      notify: false
    }
  end

  # Update sessions via embedded attributes

  test 'organizers can add workshop sessions' do
    sign_in @organizer
    assert_equal 0, @workshop.sessions.count

    session_start = tomorrow_at 9
    session_end = tomorrow_at 17
    params = {sessions_attributes: [{start: session_start, end: session_end}]}

    put :update, params: {id: @workshop.id, pd_workshop: params}
    assert_response :success
    @workshop.reload
    assert_equal 1, @workshop.sessions.count
    assert_equal session_start, @workshop.sessions.first[:start]
    assert_equal session_end, @workshop.sessions.first[:end]
  end

  test 'organizers can update existing workshop sessions' do
    sign_in @organizer
    session_initial_start = tomorrow_at 9
    session_initial_end = tomorrow_at 15
    session = create(:pd_session, start: session_initial_start, end: session_initial_end)
    @workshop.sessions << session
    @workshop.save!
    assert_equal 1, @workshop.sessions.count

    session_updated_start = session_initial_start + 2.days
    session_updated_end = session_initial_end + 2.days + 2.hours
    params = {
      sessions_attributes: [{id: session.id, start: session_updated_start, end: session_updated_end}]
    }

    put :update, params: {id: @workshop.id, pd_workshop: params}
    assert_response :success
    @workshop.reload
    assert_equal 1, @workshop.sessions.count
    assert_equal session_updated_start, @workshop.sessions.first[:start]
    assert_equal session_updated_end, @workshop.sessions.first[:end]
  end

  test 'organizers can destroy workshop sessions' do
    sign_in @organizer
    session = create(:pd_session)
    @workshop.sessions << session
    @workshop.save!
    assert_equal 1, @workshop.sessions.count

    params = {sessions_attributes: [{id: session.id, _destroy: true}]}

    put :update, params: {id: @workshop.id, pd_workshop: params}
    assert_response :success
    @workshop.reload
    assert_equal 0, @workshop.sessions.count
  end

  test 'organizers can add and remove facilitators' do
    sign_in @organizer
    new_facilitator = create :facilitator
    assert_equal 1, @workshop.facilitators.length
    assert_equal @facilitator, @workshop.facilitators.first

    params = workshop_params.merge(
      {facilitators: [new_facilitator.id]}
    )
    put :update, params: {id: @workshop.id, pd_workshop: params}
    assert_response :success
    @workshop.reload
    assert_equal 1, @workshop.facilitators.length
    assert_equal new_facilitator, @workshop.facilitators.first
  end

  # Actions: Start, End

  test 'admins can start and end workshops' do
    Pd::AsyncWorkshopHandler.expects(:process_ended_workshop).with(@workshop.id)

    sign_in @admin
    @workshop.sessions << create(:pd_session)
    assert_equal 'Not Started', @workshop.state

    post :start, params: {id: @workshop.id}
    assert_response :success
    @workshop.reload
    assert_equal 'In Progress', @workshop.state

    post :end, params: {id: @workshop.id}
    assert_response :success
    @workshop.reload
    assert_equal 'Ended', @workshop.state
  end

  test 'organizers can start and stop their workshops' do
    Pd::AsyncWorkshopHandler.expects(:process_ended_workshop).with(@workshop.id)

    sign_in @organizer
    @workshop.sessions << create(:pd_session)
    assert_equal 'Not Started', @workshop.state

    post :start, params: {id: @workshop.id}
    assert_response :success
    @workshop.reload
    assert_equal 'In Progress', @workshop.state

    post :end, params: {id: @workshop.id}
    assert_response :success
    @workshop.reload
    assert_equal 'Ended', @workshop.state
  end

  test 'organizers cannot start and stop workshops they are not organizing' do
    sign_in create(:workshop_organizer)
    @workshop.sessions << create(:pd_session)
    assert_equal 'Not Started', @workshop.state

    post :start, params: {id: @workshop.id}
    assert_response :forbidden

    post :end, params: {id: @workshop.id}
    assert_response :forbidden
    @workshop.reload
    assert_equal 'Not Started', @workshop.state
  end

  # No access

  [:teacher, :user].each do |user_type|
    test_user_gets_response_for :index, response: :forbidden, user: user_type
    test_user_gets_response_for :show, response: :forbidden, user: user_type, params: -> {{id: @workshop.id}}
  end

  test 'anyone can see the K5 public map index' do
    get :k5_public_map_index
    assert_response :success
  end

  test_user_gets_response_for(
    :summary,
    name: 'facilitators can get summary for their workshops',
    user: -> {@facilitator},
    params: -> {{id: @workshop.id}}
  )

  test_user_gets_response_for(
    :summary,
    name: 'facilitators cannot get summary for other workshops',
    response: :forbidden,
    user: -> {@facilitator},
    params: -> {{id: @standalone_workshop.id}}
  )

  test_user_gets_response_for(
    :summary,
    name: 'organizers can get summary for their workshops',
    user: -> {@organizer},
    params: -> {{id: @workshop.id}}
  )

  test_user_gets_response_for(
    :summary,
    name: 'organizers cannot get summary for other workshops',
    response: :forbidden,
    user: -> {@organizer},
    params: -> {{id: @standalone_workshop.id}}
  )

  test 'summary' do
    sign_in @admin
    workshop = create :pd_workshop, num_sessions: 3
    workshop.start!

    get :summary, params: {id: workshop.id}
    assert_response :success
    response = JSON.parse(@response.body)

    assert_equal workshop.state, response['state']
    assert_equal 3, response['sessions'].count
  end

  # Multi-facilitator special loading for index
  test 'Loads both facilitators when calling index' do
    workshop = create :pd_workshop, num_facilitators: 2
    sign_in(workshop.facilitators.first)
    get :index
    assert_response :success
    response = JSON.parse(@response.body)

    assert_equal 2, response.first['facilitators'].size
  end

  # Facilitators who are also organizers get workshops they facilitated and organized
  test 'Facilitator-organizers get all their workshops when calling index' do
    user = create :workshop_organizer
    user.permission = UserPermission::FACILITATOR
    expected_workshops = [
      create(:pd_workshop, facilitators: [user]),
      create(:pd_workshop, num_facilitators: 1, organizer: user),
      create(:pd_workshop, facilitators: [user], organizer: user),
      create(:pd_workshop, organizer: user)
    ]

    sign_in(user)
    get :index
    response = JSON.parse(@response.body)
    assert_equal expected_workshops.map(&:id).sort, response.map {|x| x['id']}.sort
  end

  test 'Teachercon workshops are public' do
    tc = create(
      :pd_workshop,
      course: Pd::Workshop::COURSE_CSD,
      num_sessions: 1,
      organizer: @organizer,
      subject: Pd::Workshop::SUBJECT_TEACHER_CON,
    )

    get :upcoming_teachercon
    assert_response :success
    assert_equal 1, JSON.parse(@response.body).length
    assert_equal tc.id, JSON.parse(@response.body).first['id']
  end

  test 'Teachercon workshops can be filtered by course' do
    csd = create(
      :pd_workshop,
      course: Pd::Workshop::COURSE_CSD,
      num_sessions: 1,
      organizer: @organizer,
      subject: Pd::Workshop::SUBJECT_TEACHER_CON,
    )
    csp = create(
      :pd_workshop,
      course: Pd::Workshop::COURSE_CSP,
      num_sessions: 1,
      organizer: @organizer,
      subject: Pd::Workshop::SUBJECT_TEACHER_CON,
    )

    get :upcoming_teachercon, params: {course: Pd::Workshop::COURSE_CSD}
    assert_response :success
    assert_equal 1, JSON.parse(@response.body).length
    assert_equal csd.id, JSON.parse(@response.body).first['id']

    get :upcoming_teachercon, params: {course: Pd::Workshop::COURSE_CSP}
    assert_response :success
    assert_equal 1, JSON.parse(@response.body).length
    assert_equal csp.id, JSON.parse(@response.body).first['id']
  end

  private

  def tomorrow_at(hour, minute = nil)
    tomorrow = Time.zone.now + 1.day
    Time.zone.local(tomorrow.year, tomorrow.month, tomorrow.mday, hour, minute)
  end

  def workshop_params
    session_start = tomorrow_at 9
    session_end = session_start + 8.hours
    {
      location_address: 'Seattle, WA',
      on_map: true,
      funded: true,
      course: Pd::Workshop::COURSE_CSF,
      capacity: 10,
      sessions_attributes: [
        {
          start: session_start,
          end: session_end
        }
      ]
    }
  end
end
