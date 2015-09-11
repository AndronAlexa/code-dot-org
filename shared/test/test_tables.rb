require 'minitest/autorun'
require 'rack/test'
require File.expand_path '../../../deployment', __FILE__
require File.expand_path '../../middleware/channels_api', __FILE__
require File.expand_path '../../middleware/tables_api', __FILE__

ENV['RACK_ENV'] = 'test'

class TablesTest < Minitest::Test

  def test_create_read_update_delete
    init_apis

    create_channel

    assert read_records.first.nil?

    record_id = create_record({name: 'alice', age: 7, male: false})
    record = read_records.first
    assert_equal record_id.to_i, record['id'].to_i
    assert_equal 'alice', record['name']
    assert_equal 7, record['age']
    assert_equal false, record['male']

    assert_equal 8, update_record(record_id, {id: record_id, age: 8})['age']
    record = read_records.first
    assert_equal 8, record['age']

    delete_record(record_id)
    assert read_records.first.nil?

    delete_channel
  end

  def test_import
    init_apis
    create_channel

    # this record should not appear in the output
    create_record(name: 'eve', age: 9)

    csv_filename = File.expand_path('../roster.csv', __FILE__)
    import(csv_filename)

    records = read_records
    assert_equal 2, records.length
    assert_equal 'alice', records[0]['name']
    assert_equal 'bob', records[1]['name']

    delete_channel
  end

  def test_rename_column
    init_apis
    create_channel

    create_record(name: 'trevor', age: 30)
    create_record(name: 'mitra', age: 29)

    rename_column('name', 'first_name')
    records = read_records()

    assert_equal records[0]['first_name'], 'trevor'
    assert_equal records[1]['name'], nil

    delete_channel
  end

  def test_delete_column
    init_apis
    create_channel

    create_record(name: 'trevor', age: 30)
    create_record(name: 'mitra', age: 29)

    delete_column('age')

    records = read_records()
    assert_equal records[0]['age'], nil
    assert_equal records[1]['age'], nil

    delete_channel
  end

  def test_delete
    init_apis
    create_channel

    create_record(name: 'trevor', age: 30)
    create_record(name: 'mitra', age: 29)

    records = read_records
    assert_equal records.length, 2

    delete_table

    records = read_records

    assert_equal records.length, 0
    delete_channel
  end

  def test_export
    init_apis
    create_channel

    csv_filename = File.expand_path('../roster.csv', __FILE__)
    import(csv_filename)

    result_body = export().body.split("\n")
    original_body = File.read(csv_filename).split("\n")

    result_columns = result_body[0]
    original_columns = original_body[0]

    result_first_row = result_body[1]
    original_first_row = original_body[1]

    assert_equal result_columns, "id,#{original_columns}"
    assert_equal result_first_row, "1,#{original_first_row}"

    delete_channel
  end
  # Methods below this line are test utilities, not actual tests
  private

  def init_apis
    # The Tables API does not need to share a cookie jar with the Channels API.
    @channels = Rack::Test::Session.new(Rack::MockSession.new(ChannelsApi, "studio.code.org"))
    @tables = Rack::Test::Session.new(Rack::MockSession.new(TablesApi, "studio.code.org"))
    @table_name = '_testTable'
  end

  def create_channel
    @channels.post '/v3/channels', {}.to_json, 'CONTENT_TYPE' => 'application/json;charset=utf-8'
    @channel_id = @channels.last_response.location.split('/').last
  end

  def delete_channel
    @channels.delete "/v3/channels/#{@channel_id}"
    assert @channels.last_response.successful?
  end

  def create_record(record)
    @tables.post "/v3/shared-tables/#{@channel_id}/#{@table_name}", record.to_json, 'CONTENT_TYPE' => 'application/json;charset=utf-8'
    @tables.last_response.location.split('/').last
  end

  def read_records
    @tables.get "/v3/shared-tables/#{@channel_id}/#{@table_name}"
    JSON.parse(@tables.last_response.body)
  end

  def update_record(id, record)
    @tables.put "/v3/shared-tables/#{@channel_id}/#{@table_name}/#{id}", record.to_json, 'CONTENT_TYPE' => 'application/json;charset=utf-8'
    JSON.parse(@tables.last_response.body)
  end

  def delete_record(id)
    @tables.delete "/v3/shared-tables/#{@channel_id}/#{@table_name}/#{id}"
  end

  def import(csv_filename)
    import_file = Rack::Test::UploadedFile.new csv_filename, "text/csv"
    @tables.post "/v3/import-shared-tables/#{@channel_id}/#{@table_name}", "import_file" => import_file
  end

  def export()
    @tables.get "/v3/export-shared-tables/#{@channel_id}/#{@table_name}"
  end

  def delete_column(column)
    @tables.delete "/v3/shared-tables/#{@channel_id}/#{@table_name}/column/#{column}"
  end

  def rename_column(old, new)
    @tables.post "/v3/shared-tables/#{@channel_id}/#{@table_name}/column/#{old}?new_name=#{new}"
  end

  def delete_table()
    @tables.delete "/v3/shared-tables/#{@channel_id}/#{@table_name}"
  end

end
