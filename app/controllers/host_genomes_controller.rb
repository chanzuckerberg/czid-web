class HostGenomesController < SecuredController
  before_action :set_host_genome, only: [:show, :edit, :update, :destroy]
  
  # GET /host_genomes
  # GET /host_genomes.json
  def index
    @host_genomes = HostGenome.all
  end

  # GET /host_genomes/1
  # GET /host_genomes/1.json
  def show
  end

  # GET /host_genomes/new
  def new
    @host_genome = HostGenome.new
  end

  # GET /host_genomes/1/edit
  def edit
  end

  # POST /host_genomes
  # POST /host_genomes.json
  def create
    @host_genome = HostGenome.new(host_genome_params)

    respond_to do |format|
      if @host_genome.save
        format.html { redirect_to @host_genome, notice: 'HostGenome was successfully created.' }
        format.json { render :show, status: :created, location: @host_genome }
      else
        format.html { render :new }
        format.json { render json: @host_genome.errors, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /host_genomes/1
  # PATCH/PUT /host_genomes/1.json
  def update
    respond_to do |format|
      if @host_genome.update(host_genome_params)
        format.html { redirect_to @host_genome, notice: 'HostGenome was successfully updated.' }
        format.json { render :show, status: :ok, location: @host_genome }
      else
        format.html { render :edit }
        format.json { render json: @host_genome.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /host_genomes/1
  # DELETE /host_genomes/1.json
  def destroy
    @host_genome.destroy
    respond_to do |format|
      format.html { redirect_to host_genomes_url, notice: 'HostGenome was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_host_genome
    @host_genome = HostGenome.find(params[:id])
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def host_genome_params
    params.require(:host_genome).permit(:name, :sample_memory, :job_queue, :s3_star_index_path,
                                        :s3_bowtie2_index_path, :default_background_id)
  end
end
