class BackgroundsController < ApplicationController
  include BackgroundsHelper

  before_action :login_required
  before_action :admin_required, except: [:create, :show_taxon_dist, :index]
  before_action :set_background, only: [:show, :edit, :update, :destroy, :show_taxon_dist]

  # GET /backgrounds
  # GET /backgrounds.json
  def index
    permitted_params = index_params
    json_response = {}.tap do |h|
      if permitted_params[:categorizeBackgrounds]
        # Categorize backgrounds into background the user owns and all other viewable backgrounds that do not belong to the user.
        h[:other_backgrounds] = current_power.backgrounds.where.not(user: current_user).or(current_power.backgrounds.created_by_idseq).order(created_at: :desc)
        h[:owned_backgrounds] = current_power.owned_backgrounds.order(created_at: :desc)
      else
        @backgrounds = permitted_params[:ownedOrPublicBackgroundsOnly] ? current_power.owned_backgrounds.or(current_power.public_backgrounds) : current_power.backgrounds
        @backgrounds = @backgrounds.order(created_at: :desc)
        h[:backgrounds] = @backgrounds
      end
    end

    respond_to do |format|
      format.html { render :index }
      format.json { render json: json_response }
    end
  end

  # GET /backgrounds/1
  # GET /backgrounds/1.json
  def show
  end

  def show_taxon_dist
    # Output count_type => rpm information for specified taxid
    # Example: /backgrounds/4/show_taxon_dist?taxid=570
    taxid = params[:taxid].to_i
    ts = TaxonSummary.where(background_id: @background.id, tax_id: taxid)
    output = {}
    ts.each do |t|
      fields = t.slice(:tax_level, :mean, :stdev, :rpm_list)
      fields[:rpm_list] = JSON.parse(fields[:rpm_list])
      output[t[:count_type]] = fields
    end

    render json: output
  end

  # GET /backgrounds/new
  def new
    @background = Background.new
  end

  # GET /backgrounds/1/edit
  def edit
  end

  # POST /backgrounds
  # POST /backgrounds.json
  def create
    name = params[:name]
    description = params[:description]
    sample_ids = params[:sample_ids].map(&:to_i)
    mass_normalized = params[:mass_normalized].present?

    non_viewable_sample_ids = sample_ids.to_set - current_power.samples.pluck(:id).to_set
    if !non_viewable_sample_ids.empty?
      render json: {
        status: :unauthorized,
        message: "You are not authorized to view all samples in the list.",
      }
    else
      pipeline_run_ids = Background.eligible_pipeline_runs.where(sample_id: sample_ids).pluck(:id)
      @background = Background.new(
        user_id: current_user.id,
        name: name,
        description: description,
        pipeline_run_ids: pipeline_run_ids,
        mass_normalized: mass_normalized
      )
      if @background.save
        render json: {
          status: :ok,
        }
      else
        render json: {
          status: :not_acceptable,
          message: @background.errors.full_messages,
        }
      end
    end
  end

  # PATCH/PUT /backgrounds/1
  # PATCH/PUT /backgrounds/1.json
  def update
    current_data = @background.to_json(include: [{ pipeline_runs: { only: [:id, :sample_id] } }])
    current_data_full_string = @background.to_json(include: [{ pipeline_runs: { only: [:id, :sample_id] } },
                                                             :taxon_summaries,])
    background_changed = assign_attributes_and_has_changed?(background_params)
    if background_changed
      s3_archive_successful, s3_backup_path = archive_background_to_s3(current_data_full_string)
      db_archive_successful = archive_background_to_db(current_data, s3_backup_path)
      update_successful = db_archive_successful && s3_archive_successful ? @background.save : false # this triggers recomputation of @background's taxon_summaries if archiving was successful
    else
      update_successful = true
      @background.save # recompute
    end
    respond_to do |format|
      if update_successful
        format.html { redirect_to @background, notice: 'Background was successfully updated.' }
        format.json { render :show, status: :ok, location: @background }
      else
        format.html { render :edit }
        format.json { render json: @background.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /backgrounds/1
  # DELETE /backgrounds/1.json
  def destroy
    @background.destroy
    respond_to do |format|
      format.html { redirect_to backgrounds_url, notice: 'Background was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_background
    @background = Background.find(params[:id])
  end

  def index_params
    params.permit(:ownedOrPublicBackgroundsOnly, :categorizeBackgrounds)
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def background_params
    params.require(:background).permit(:name, :ownedOrPublicBackgroundsOnly, pipeline_run_ids: [], sample_ids: [])
  end
end
