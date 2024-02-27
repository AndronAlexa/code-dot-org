class DatablockStorageController < ApplicationController
  before_action :validate_channel_id
  before_action :authenticate_user!
  skip_before_action :verify_authenticity_token

  class StudentFacingError < StandardError; end
  rescue_from StudentFacingError do |exception|
    render json: {msg: exception.message}, status: :bad_request
  end

  SUPPORTED_PROJECT_TYPES = ['applab', 'gamelab']

  ##########################################################
  #   Debug View                                           #
  ##########################################################
  def index
    @key_value_pairs = DatablockStorageKvp.where(project_id: @project_id)
    @records = DatablockStorageRecord.where(project_id: @project_id)
    @tables = DatablockStorageTable.where(project_id: @project_id)
    @library_manifest = DatablockStorageLibraryManifest.instance.library_manifest
    @storage_backend = ProjectUseDatablockStorage.use_data_block_storage_for?(params[:channel_id]) ? "Datablock Storage" : "Firebase"
    puts "####################################################"
  end

  ##########################################################
  #   Key-Value-Pair API                                   #
  ##########################################################

  def set_key_value
    raise StudentFacingError, "value must be less than #{DatablockStorageKvp::MAX_VALUE_LENGTH} bytes" if params[:value].length > DatablockStorageKvp::MAX_VALUE_LENGTH
    value = JSON.parse params[:value]
    DatablockStorageKvp.set_kvp @project_id, params[:key], value
    render json: {key: params[:key], value: value}
  end

  def get_key_value
    kvp = DatablockStorageKvp.find_by(project_id: @project_id, key: params[:key])
    render json: kvp ? JSON.parse(kvp.value).to_json : nil
  end

  def delete_key_value
    key = params[:key]
    DatablockStorageKvp.where(project_id: @project_id, key: key).delete_all

    render json: true
  end

  def get_key_values
    # SELECT key, value FROM datablock_storage_kvps WHERE project_id='{@project_id}';
    kvps = DatablockStorageKvp.
      where(project_id: @project_id).
      select(:key, :value).
      to_h {|kvp| [kvp.key, JSON.parse(kvp.value)]}

    render json: kvps
  end

  def populate_key_values
    key_values_json = JSON.parse params[:key_values_json]
    raise "key_values_json must be a hash" unless key_values_json.is_a? Hash
    DatablockStorageKvp.set_kvps(@project_id, key_values_json)
    render json: true
  end

  ##########################################################
  #   Table API                                            #
  ##########################################################

  def create_table
    table_or_create

    render json: true
  end

  def add_shared_table
    DatablockStorageTable.add_shared_table @project_id, params[:table_name]

    render json: true
  end

  def import_csv
    table = table_or_create
    table.import_csv params[:table_data_csv]
    table.save!

    render json: true
  end

  def clear_table
    table = find_table
    table.records.delete_all
    table.save!

    render json: true
  end

  def delete_table
    find_table.destroy

    render json: true
  end

  def get_table_names
    table_names = shared_table? ?
      DatablockStorageTable.get_shared_table_names :
      DatablockStorageTable.get_table_names(@project_id)

    render json: table_names
  end

  def populate_tables
    tables_json = JSON.parse params[:tables_json]
    # FIXME: unfirebase - Why are json encoding a string that's already a json encoded object?
    tables_json = JSON.parse tables_json unless tables_json.is_a? Hash
    DatablockStorageTable.populate_tables @project_id, tables_json
    render json: true
  end

  ##########################################################
  #   Table Column API                                     #
  ##########################################################

  def add_column
    table = find_table
    table.add_column params[:column_name]
    table.save!

    render json: true
  end

  def rename_column
    table = find_table
    table.rename_column params[:old_column_name], params[:new_column_name]
    table.save!

    render json: true
  end

  def coerce_column
    table = find_table
    table.coerce_column params[:column_name], params[:column_type]
    table.save!

    render json: true
  end

  def delete_column
    table = find_table
    table.delete_column params[:column_name]
    table.save!

    render json: true
  end

  def get_column
    table = find_table
    column = table.get_column params[:column_name]
    render json: column
  end

  def get_columns_for_table
    table = find_table_or_shared_table
    render json: table.get_columns
  end

  ##########################################################
  #   Table Record API                                     #
  ##########################################################

  def create_record
    raise StudentFacingError, "record must be less than #{DatablockStorageRecord::MAX_RECORD_LENGTH} bytes" if params[:record_json].length > DatablockStorageRecord::MAX_RECORD_LENGTH
    record_json = JSON.parse params[:record_json]
    raise "record must be a hash" unless record_json.is_a? Hash

    table = table_or_create
    table.create_records [record_json]
    table.save!

    render json: record_json
  end

  def read_records
    table = find_table_or_shared_table

    render json: table.read_records.map(&:record_json)
  end

  def update_record
    raise StudentFacingError, "record must be less than #{DatablockStorageRecord::MAX_RECORD_LENGTH} bytes" if params[:record_json].length > DatablockStorageRecord::MAX_RECORD_LENGTH

    table = find_table
    record_json = table.update_record params[:record_id], JSON.parse(params[:record_json])
    table.save!

    render json: record_json
  end

  def delete_record
    table = find_table
    begin
      table.delete_record params[:record_id]
    rescue ActiveRecord::RecordNotFound
      raise StudentFacingError, "You tried to delete a record with id \"#{params[:record_id]}\" from table \"#{table.table_name}\" but no recording matching that ID could be found."
    end
    table.save!
    render json: nil
  end

  ##########################################################
  #   Library Manifest API (shared table metadata)         #
  ##########################################################

  def get_library_manifest
    render json: DatablockStorageLibraryManifest.instance.library_manifest
  end

  def set_library_manifest
    library_manifest = JSON.parse params[:library_manifest]
    DatablockStorageLibraryManifest.instance.update!(library_manifest: library_manifest)
    render json: true
  end

  ##########################################################
  #   Channel API                                          #
  ##########################################################

  # Returns true if validation checks pass
  def channel_exists
    render json: true
  end

  # deletes the entire channel in firebase
  # used only one place, applab.js config.afterClearPuzzle()
  def clear_all_data
    # FIXME: unfirebase, do we have an index on project_id alone?
    DatablockStorageTable.where(project_id: @project_id).delete_all
    # FIXME: unfirebase, do we have an index on project_id alone?
    DatablockStorageKvp.where(project_id: @project_id).delete_all
    # FIXME: unfirebase, do we have an index on project_id alone?
    DatablockStorageRecord.where(project_id: @project_id).delete_all

    render json: true
  end

  ##########################################################
  #   Project Use Datablock Storage API                    #
  ##########################################################

  # TODO: post-firebase-cleanup, remove
  def use_datablock_storage
    ProjectUseDatablockStorage.set_data_block_storage_for!(params[:channel_id], true)
    render json: true
  end

  # TODO: post-firebase-cleanup, remove
  def use_firebase_storage
    ProjectUseDatablockStorage.set_data_block_storage_for!(params[:channel_id], false)
    render json: true
  end

  ##########################################################
  #   Private                                              #
  ##########################################################
  private

  def shared_table?
    ActiveRecord::Type::Boolean.new.cast(params[:is_shared_table])
  end

  def find_table_or_shared_table
    shared_table? ?
      DatablockStorageTable.find_shared_table(params[:table_name]) :
      find_table
  end

  def find_table
    DatablockStorageTable.find([@project_id, params[:table_name]])
  rescue ActiveRecord::RecordNotFound
    raise StudentFacingError, "You tried to use a table called \"#{params[:table_name]}\" but that table doesn't exist in this app"
  end

  def where_table
    DatablockStorageTable.where(project_id: @project_id, table_name: params[:table_name])
  end

  def table_or_create
    where_table.first_or_create
  end

  def validate_channel_id
    # channel_id is valid if it decrypts into a valid + loadable project_id
    _, @project_id = storage_decrypt_channel_id(params[:channel_id])
    @project = Project.find(@project_id)
    unless SUPPORTED_PROJECT_TYPES.include? @project.project_type
      raise "DatablockStorage is only available for applab and gamelab projects"
    end
  end
end
