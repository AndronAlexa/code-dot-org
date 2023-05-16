class HoneybadgerUrlBuilder
  def initialize(time_filters, filters)
    @time_filters = time_filters
    @filters = filters
    @api_base_url = "https://app.honeybadger.io"
    @filters_map = {}
  end

  def set_environment(environemnt)
    @filters_map[:environment] = environemnt
  end

  #'-is:resolved', '-is:paused%20', '-is:ignored', "environment:\"#{rack_env}\"", 'assignee:"nobody"
  def set_is_resolved(is_resolved)
    @filters_map[:is_resolved] = is_resolved
  end

  def set_is_paused(is_paused)
    @filters_map[:is_paused] = is_paused
  end

  def set_is_ignored(is_paused)
    @filters_map[:is_paused] = is_paused
  end

  def set_assignee(assignee)
    @filters_map[:assignee] = assignee
  end

  def get_query_from_filters
    filters = []
    hash.each do |key, value|
      if value.nil_or_empty?
        continue
      end
      puts value ? key : "-#{key}"
      filters << (value ? key : "-#{key}")
    end
    joined_filters = filters..join("%20")
    joined_filters.empty? ? '' : "q=#{joined_filters}"
  end

  def call_api_response_from_url(url)
    curl_request = "curl -s -u #{CDO.honeybadger_api_token}: \"#{@api_base_url}#{url}\""
    puts curl_request
    response = `#{curl_request}`
    JSON.parse response
  end

  def get_affected_users(fault)
    return get_api_response("affected_users", {fault: fault})
  end

  def get_faults(project_id)
    return get_api_response("faults", {project_id: project_id})
  end

  def get_report_by_user(project_id)
    return get_api_response("reports_by_user", {project_id: project_id})
  end

  def get_report_notices_per_day(project_id)
    return get_api_response("notices_per_day", {project_id: project_id})
  end

  private

  def get_api_response(type, params)
    operation_url = get_api_url_request(type, params)
    call_api_response_from_url(operation_url)
  end

  def get_api_url_request(type, params = {})
    case type
    when 'affected_users'
      return get_affected_users_url(params[:fault])
    when type == 'faults'
      return get_faults_url(params[:project_id])
    when type == "reports_by_user"
      return get_reports_by_user_url(params[:project_id])
    when type == "notices_per_day"
      return get_reports_notices_per_day(params[:project_id])
    end
  end

  # join the filters by a 'white space' or "%20"
  # This is used while a better query builder for honeybadger is implemented
  def get_filters_query
    joined_filters = @filters.join("%20")
    joined_filters.empty? ? '' : "q=#{joined_filters}"
  end

  def get_time_filter_query
    @time_filters.join('&').to_s
  end

  def get_summary_url(project_id)
    "/v2/projects/#{project_id}/faults/summary?#{get_time_filter_query}&#{get_filters_query}"
  end

  def get_reports_notices_per_day(project_id)
    "/v2/projects/#{project_id}/reports/notices_per_day?#{get_time_filter_query}&#{get_filters_query}"
  end

  def get_reports_by_user_url(project_id)
    "/v2/projects/#{project_id}/reports/notices_by_user?#{get_time_filter_query}&#{get_filters_query}"
  end

  def get_affected_users_url(fault)
    "/v2/projects/#{fault.project_id}/faults/#{fault.id}/affected_users?#{get_time_filter_query}"
  end

  def get_faults_url(project_id)
    "/v2/projects/#{project_id}/faults?#{get_time_filter_query}"
  end
end
