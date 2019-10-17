Before('@as_student') do
  steps "Given I create a student named \"Test #{rand(100000)}_Student\""
end

Before('@as_young_student') do
  steps "Given I create a young student named \"Test #{rand(100000)}_Student\""
end

Before('@as_taught_student') do
  steps "Given I create a teacher-associated student named \"Taught #{rand(100000)}_Student\""
end

Before('@as_authorized_taught_student') do
  steps "Given I create an authorized teacher-associated student named \"Taught #{rand(100000)}_Student\""
end

Before('@as_teacher') do
  steps 'Given I am a teacher'
end

Before('@need_teacher_application_data') do
  count_before = Pd::Application::ActiveApplicationModels::TEACHER_APPLICATION_CLASS.count
  Pd::Application::ActiveApplicationModels::TEACHER_APPLICATION_CLASS.destroy_all
  count_after = Pd::Application::ActiveApplicationModels::TEACHER_APPLICATION_CLASS.count

  puts "Deleted #{count_before - count_after} existing applications. Count before = #{count_before}, after = #{count_after}"

  time_start = Time.now
  application_count = 0

  %w(csd csp).each do |course|
    Pd::Application::ApplicationBase.statuses.each do |status|
      application =
        FactoryGirl.create(
          Pd::Application::ActiveApplicationModels::TEACHER_APPLICATION_FACTORY,
          course: course
        )
      application.update(status: status)
      application_count += 1
    end
  end

  puts "Created #{application_count} applications in #{Time.now - time_start} seconds."
end

# Add After hook as the last one, which results in it being run before
# sign-out steps etc. change the page the browser is currently on.
After do
  check_window_for_js_errors('after scenario')
end

Around do |_, block|
  block.call
rescue Selenium::WebDriver::Error::TimeOutError => e
  check_window_for_js_errors('after timeout')
  raise e
end
