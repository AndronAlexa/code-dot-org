require_relative '../test_helper'
require_relative '../../i18n/redact_restore_utils'
require_relative '../../i18n/i18n_script_utils'

class RedactRestoreUtilsTest < Minitest::Test
  YAML_FIXTURE_PATH = CDO.dir('bin/test/fixtures/i18n_locales_source_dashboard_blocks.yml').freeze
  JSON_FIXTURE_PATH = CDO.dir('bin/test/fixtures/i18n_locales_source_dashboard_docs.json').freeze
  MARKDOWN_FIXTURE_PATH = CDO.dir('bin/test/fixtures/i18n_locales_source_dashboard_emails.md').freeze

  def test_redaction_of_yaml_file
    expected_source_path = YAML_FIXTURE_PATH
    expected_source_data = 'expected_source_data'
    expected_dest_dir_path = 'expected_dest_dir'
    expected_dest_path = "#{expected_dest_dir_path}/dest.yml"
    expected_plugins = %w[testPlugin]
    expected_format = 'txt'
    expected_redacted_data = 'expected_redacted_data'

    I18nScriptUtils.stubs(:parse_file).with(expected_source_path).returns(expected_source_data)
    RedactRestoreUtils.stubs(:redact_data).with(expected_source_data, expected_plugins, expected_format).returns(expected_redacted_data)

    I18nScriptUtils.stubs(:write_yaml_file).with(expected_dest_path, expected_redacted_data)

    RedactRestoreUtils.redact(expected_source_path, expected_dest_path, expected_plugins, expected_format)
  end

  def test_redaction_of_json_file
    expected_source_path = JSON_FIXTURE_PATH
    expected_source_data = 'expected_source_data'
    expected_dest_dir_path = 'expected_dest_dir'
    expected_dest_path = "#{expected_dest_dir_path}/dest.json"
    expected_plugins = %w[testPlugin]
    expected_format = 'txt'
    expected_redacted_data = 'expected_redacted_data'

    I18nScriptUtils.stubs(:parse_file).with(expected_source_path).returns(expected_source_data)
    RedactRestoreUtils.stubs(:redact_data).with(expected_source_data, expected_plugins, expected_format).returns(expected_redacted_data)

    I18nScriptUtils.stubs(:write_json_file).with(expected_dest_path, expected_redacted_data)

    RedactRestoreUtils.redact(expected_source_path, expected_dest_path, expected_plugins, expected_format)
  end

  def test_redact_markdown_with_md_file
    expected_source_path = MARKDOWN_FIXTURE_PATH
    expected_dest_path = "expected_dest_dir/dest.md"
    expected_plugins = %w[testPlugin]
    expected_format = 'md'
    expected_redacted_markdown = 'expected_redacted_markdown'

    RedactRestoreUtils.stubs(:redact_file).with(expected_source_path, expected_plugins, expected_format).returns(expected_redacted_markdown)
    I18nScriptUtils.stubs(:write_file).with(expected_dest_path, expected_redacted_markdown)

    RedactRestoreUtils.redact_markdown(expected_source_path, expected_dest_path, expected_plugins, expected_format)
  end

  def test_redact_markdown_with_not_md_file
    expected_source_path = JSON_FIXTURE_PATH
    expected_dest_path = "expected_dest_dir/dest.json"
    expected_plugins = %w[testPlugin]
    expected_format = 'md'

    RedactRestoreUtils.stubs(:redact_file).never
    I18nScriptUtils.stubs(:write_file).never

    RedactRestoreUtils.redact_markdown(expected_source_path, expected_dest_path, expected_plugins, expected_format)
  end

  def test_redaction_of_data_with_blockfield_plugin_with_txt_format
    raw_redact_data = {'test' => "{TEST} \n {EXAMPLE}"}
    expected_result = {'test' => "[TEST][0] \n [EXAMPLE][1]"}

    assert_equal expected_result, RedactRestoreUtils.redact_data(raw_redact_data, %w[blockfield], 'txt')
  end

  def test_redaction_of_data_with_visual_code_block_plugin
    raw_redact_data = {'test' => "\r\n - *test* - \n"}
    expected_result = {'test' => "-   _test_ - "}

    assert_equal expected_result, RedactRestoreUtils.redact_data(raw_redact_data, %w[visualCodeBlock])
  end

  def test_redaction_of_data_with_link_plugin
    raw_redact_data = {'test' => '[link](https://example.org)'}
    expected_result = {'test' => '[link][0]'}

    assert_equal expected_result, RedactRestoreUtils.redact_data(raw_redact_data, %w[link])
  end

  def test_redaction_of_data_with_resource_link_plugin
    raw_redact_data = {'valid' => '[r test/example/1]', 'invalid' => '[r test/example]'}
    expected_result = {'valid' => '[test][0]', 'invalid' => '[r test/example]'}

    assert_equal expected_result, RedactRestoreUtils.redact_data(raw_redact_data, %w[resourceLink])
  end

  def test_redaction_of_data_with_vocabulary_definition_plugin
    raw_redact_data = {'valid' => '[v test/example/1]', 'invalid' => '[v test/example]'}
    expected_result = {'valid' => '[test][0]', 'invalid' => '[v test/example]'}

    assert_equal expected_result, RedactRestoreUtils.redact_data(raw_redact_data, %w[vocabularyDefinition])
  end

  def test_redaction_of_data_with_blockly_plugin
    raw_redact_data = {'test' => '<xml><block>block_content</block></xml>'}
    expected_result = {'test' => '[blockly block][0]'}

    assert_equal expected_result, RedactRestoreUtils.redact_data(raw_redact_data, %w[blockly])
  end
end
