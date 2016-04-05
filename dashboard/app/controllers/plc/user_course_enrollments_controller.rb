class Plc::UserCourseEnrollmentsController < ApplicationController
  before_filter :create_enrollment, only: :create
  load_and_authorize_resource except: :course_view
  authorize_resource only: :course_view

  # GET /plc/user_course_enrollments/new
  def new
  end

  # POST /plc/user_course_enrollments
  # POST /plc/user_course_enrollments.json
  def create
    if @user_course_enrollment.save
      redirect_to action: :course_view
    else
      redirect_to action: :new
    end
  end

  def course_view
    @enrollments = current_user.plc_enrollments
  end

  private
  def create_enrollment
    validated_params = user_course_enrollment_params
    user = User.find_by_email_or_hashed_email(validated_params[:user_email])
    plc_course = Plc::Course.find(validated_params[:plc_course_id])

    @user_course_enrollment = Plc::UserCourseEnrollment.new(user: user, plc_course: plc_course)
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def user_course_enrollment_params
    params.permit(:user_email, :plc_course_id)
  end
end
