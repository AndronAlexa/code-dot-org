#!/usr/bin/env ruby

# Downloads all translations from Crowdin Code.org, Code.org-Markdown, and
# Hourofcode projects to i18n/locales.
# https://crowdin.com/project/codeorg

require_relative 'i18n_script_utils'

require_relative './crowdin/utils'
require_relative './crowdin/project'

def sync_down
  I18nScriptUtils.with_syncronous_stdout do
    puts "Beginning sync down"

    CROWDIN_PROJECTS.each do |name, options|
      puts "Downloading translations from #{name} project"

      logger = Logger.new(STDOUT)
      logger.level = Logger::INFO
      api_key = YAML.load_file(options[:identity_file])["api_key"]
      project_id = YAML.load_file(options[:config_file])["project_identifier"]
      project = Crowdin::Project.new(project_id, api_key)
      utils = Crowdin::Utils.new(project, {logger: logger})

      puts "Fetching list of changed files"
      prefetch = Time.now
      utils.fetch_changes
      postfetch = Time.now
      puts "Changes fetched in #{Time.at(postfetch - prefetch).utc.strftime('%H:%M:%S')}"
      puts "Downloading changed files"
      predownload = Time.now
      utils.download_changed_files
      postdownload = Time.now
      puts "Files downloaded in #{Time.at(postdownload - predownload).utc.strftime('%H:%M:%S')}"
    end

    puts "Sync down complete"
  end
end

sync_down if __FILE__ == $0
