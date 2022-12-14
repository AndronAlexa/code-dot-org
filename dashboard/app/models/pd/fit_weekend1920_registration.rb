# == Schema Information
#
# Table name: pd_fit_weekend_registrations
#
#  id                :integer          not null, primary key
#  pd_application_id :integer
#  registration_year :string(255)      not null
#  form_data         :text(65535)
#  created_at        :datetime         not null
#  updated_at        :datetime         not null
#
# Indexes
#
#  index_pd_fit_weekend_registrations_on_pd_application_id  (pd_application_id)
#  index_pd_fit_weekend_registrations_on_registration_year  (registration_year)
#
# This model is needed to purge accounts but is no longer maintained.

class Pd::FitWeekend1920Registration < Pd::FitWeekendRegistrationBase
end
