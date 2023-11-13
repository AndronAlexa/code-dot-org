class TeacherDashboardController < ApplicationController
  load_and_authorize_resource :section

  def show
    @section_summary = @section.summarize
    @sections = current_user.sections_owned_or_instructed.map(&:summarize)
    @locale_code = request.locale
  end

  def parent_letter
    @section_summary = @section.summarize
    @sections = current_user.sections_owned_or_instructed.map(&:summarize)
    render layout: false
  end
end
