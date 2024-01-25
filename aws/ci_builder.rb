require 'cdo/rake_utils'
require 'cdo/git_utils'
require_relative 'ci_build_metrics'
module CiBuilder
  require_relative '../lib/cdo/rake_utils'
  extend self
  BUILD_STARTED = 'build-started'.freeze

  def build
    Dir.chdir(deploy_dir) do
      return 0 unless build_required?
      ChatClient.log 'Starting build', message_format: 'text', color: 'white'
      FileUtils.touch BUILD_STARTED
      ChatClient.log 'Updating repository', message_format: 'text', color: 'white'
      update_repository
      ChatClient.log 'Displaying commit link', message_format: 'text', color: 'white'
      display_commit_link
      ChatClient.log 'Installing dependencies', message_format: 'text', color: 'white'
      install_dependencies
      ChatClient.log 'Notifying honeybadger', message_format: 'text', color: 'white'
      notify_honeybadger
      ChatClient.log 'Executing ci task', message_format: 'text', color: 'white'
      execute_ci_task
      ChatClient.log 'Done', message_format: 'text', color: 'white'
    end
  end

  private

  def build_required?
    RakeUtils.git_updates_available? || File.file?(BUILD_STARTED) || !CDO.daemon
  end

  def update_repository
    RakeUtils.git_fetch
    update_count = RakeUtils.git_update_count
    RakeUtils.git_pull if update_count > 0
    update_log = `git log --pretty=format:"%h %s (%an)" -n #{[1, update_count].max}`
    File.write(deploy_dir('rebuild'), update_log)
  end

  def display_commit_link
    git_revision = RakeUtils.git_revision
    git_revision_short = GitUtils.git_revision_short

    ChatClient.log "https://github.com/code-dot-org/code-dot-org/commit/#{git_revision}", message_format: 'text', color: 'purple'
    CiBuildMetrics.write_build_status rack_env, git_revision_short, :start
  end

  def install_dependencies
    RakeUtils.bundle_install
  end

  def notify_honeybadger
    git_revision = RakeUtils.git_revision
    Honeybadger.notify_new_release(rack_env, git_revision)
  end

  def execute_ci_task
    status = begin
      result = RakeUtils.rake_stream_output 'ci'
      validate_git_revision if CDO.test_system?
      result
    rescue => exception
      CDO.backtrace exception
    ensure
      FileUtils.rm BUILD_STARTED if File.file?(BUILD_STARTED)
    end
    status
  end

  def validate_git_revision
    git_revision = RakeUtils.git_revision
    exception_message = "Git revision unexpectedly changed from #{git_revision} to #{RakeUtils.git_revision} during DTT"
    is_valid_revision = git_revision == RakeUtils.git_revision
    return true if is_valid_revision
    ChatClient.log exception_message, color: 'red'
    raise ArgumentError, exception_message
  end
end
