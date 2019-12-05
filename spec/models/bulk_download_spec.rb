require 'rails_helper'

describe BulkDownload, type: :model do
  context "#success_url" do
    before do
      @joe = create(:joe)
      @bulk_download = create(:bulk_download, user: @joe)
    end

    it "returns correct success url for prod" do
      allow(ENV).to receive(:[]).with("SERVER_DOMAIN").and_return("https://idseq.net")
      expect(@bulk_download.success_url).to eq("https://idseq.net/bulk_downloads/#{@bulk_download.id}/success/#{@bulk_download.access_token}")
    end

    it "returns correct success url for staging" do
      allow(ENV).to receive(:[]).with("SERVER_DOMAIN").and_return("https://staging.idseq.net")
      expect(@bulk_download.success_url).to eq("https://staging.idseq.net/bulk_downloads/#{@bulk_download.id}/success/#{@bulk_download.access_token}")
    end

    it "returns nil if nothing set" do
      expect(@bulk_download.success_url).to eq(nil)
    end
  end

  context "#error_url" do
    before do
      @joe = create(:joe)
      @bulk_download = create(:bulk_download, user: @joe)
    end

    it "returns correct error url for prod" do
      allow(ENV).to receive(:[]).with("SERVER_DOMAIN").and_return("https://idseq.net")
      expect(@bulk_download.error_url).to eq("https://idseq.net/bulk_downloads/#{@bulk_download.id}/error/#{@bulk_download.access_token}")
    end

    it "returns correct error url for staging" do
      allow(ENV).to receive(:[]).with("SERVER_DOMAIN").and_return("https://staging.idseq.net")
      expect(@bulk_download.error_url).to eq("https://staging.idseq.net/bulk_downloads/#{@bulk_download.id}/error/#{@bulk_download.access_token}")
    end

    it "returns nil if nothing set" do
      allow(Rails).to receive(:env).and_return("development")

      expect(@bulk_download.error_url).to eq(nil)
    end
  end

  context "#progress_url" do
    before do
      @joe = create(:joe)
      @bulk_download = create(:bulk_download, user: @joe)
    end

    it "returns correct progress url for prod" do
      allow(ENV).to receive(:[]).with("SERVER_DOMAIN").and_return("https://idseq.net")
      expect(@bulk_download.progress_url).to eq("https://idseq.net/bulk_downloads/#{@bulk_download.id}/progress/#{@bulk_download.access_token}")
    end

    it "returns correct progress url for staging" do
      allow(ENV).to receive(:[]).with("SERVER_DOMAIN").and_return("https://staging.idseq.net")
      expect(@bulk_download.progress_url).to eq("https://staging.idseq.net/bulk_downloads/#{@bulk_download.id}/progress/#{@bulk_download.access_token}")
    end

    it "returns nil if nothing set" do
      allow(Rails).to receive(:env).and_return("development")

      expect(@bulk_download.progress_url).to eq(nil)
    end
  end

  context "#bulk_download_ecs_task_command" do
    before do
      @joe = create(:joe)
      @project = create(:project, users: [@joe], name: "Test Project")
      @sample_one = create(:sample, project: @project, name: "Test Sample One",
                                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, pipeline_version: "3.12" }])
      @sample_two = create(:sample, project: @project, name: "Test Sample Two",
                                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, pipeline_version: "3.12" }])
    end

    it "returns the correct task command for original_input_file download type" do
      @bulk_download = create(:bulk_download, user: @joe, download_type: BulkDownloadTypesHelper::ORIGINAL_INPUT_FILE_BULK_DOWNLOAD_TYPE, pipeline_run_ids: [
                                @sample_one.first_pipeline_run.id,
                                @sample_two.first_pipeline_run.id,
                              ])
      allow(ENV).to receive(:[]).with("SERVER_DOMAIN").and_return("https://idseq.net")
      allow(ENV).to receive(:[]).with("SAMPLES_BUCKET_NAME").and_return("idseq-samples-prod")

      task_command = [
        "python",
        "s3_tar_writer.py",
        "--src-urls",
        "s3://idseq-samples-prod/samples/#{@project.id}/#{@sample_one.id}/fastqs/#{@sample_one.input_files[0].name}",
        "s3://idseq-samples-prod/samples/#{@project.id}/#{@sample_one.id}/fastqs/#{@sample_one.input_files[1].name}",
        "s3://idseq-samples-prod/samples/#{@project.id}/#{@sample_two.id}/fastqs/#{@sample_two.input_files[0].name}",
        "s3://idseq-samples-prod/samples/#{@project.id}/#{@sample_two.id}/fastqs/#{@sample_two.input_files[1].name}",
        "--tar-names",
        "Test Sample One__project-test_project_#{@project.id}__original_R1.fastq.gz",
        "Test Sample One__project-test_project_#{@project.id}__original_R2.fastq.gz",
        "Test Sample Two__project-test_project_#{@project.id}__original_R1.fastq.gz",
        "Test Sample Two__project-test_project_#{@project.id}__original_R2.fastq.gz",
        "--dest-url",
        "s3://idseq-samples-prod/downloads/#{@bulk_download.id}/Original Input Files.tar.gz",
        "--success-url",
        "https://idseq.net/bulk_downloads/#{@bulk_download.id}/success/#{@bulk_download.access_token}",
        "--error-url",
        "https://idseq.net/bulk_downloads/#{@bulk_download.id}/error/#{@bulk_download.access_token}",
        "--progress-url",
        "https://idseq.net/bulk_downloads/#{@bulk_download.id}/progress/#{@bulk_download.access_token}",
      ]

      expect(@bulk_download.bulk_download_ecs_task_command).to eq(task_command)
    end

    it "returns the correct task command for unmapped_reads download type" do
      @bulk_download = create(:bulk_download, user: @joe, download_type: BulkDownloadTypesHelper::UNMAPPED_READS_BULK_DOWNLOAD_TYPE, pipeline_run_ids: [
                                @sample_one.first_pipeline_run.id,
                                @sample_two.first_pipeline_run.id,
                              ])

      allow(ENV).to receive(:[]).with("SERVER_DOMAIN").and_return("https://idseq.net")
      allow(ENV).to receive(:[]).with("SAMPLES_BUCKET_NAME").and_return("idseq-samples-prod")

      task_command = [
        "python",
        "s3_tar_writer.py",
        "--src-urls",
        "s3://idseq-samples-prod/samples/#{@project.id}/#{@sample_one.id}/postprocess/3.12/assembly/refined_unidentified.fa",
        "s3://idseq-samples-prod/samples/#{@project.id}/#{@sample_two.id}/postprocess/3.12/assembly/refined_unidentified.fa",
        "--tar-names",
        "Test Sample One__project-test_project_#{@project.id}__unmapped.fasta",
        "Test Sample Two__project-test_project_#{@project.id}__unmapped.fasta",
        "--dest-url",
        "s3://idseq-samples-prod/downloads/#{@bulk_download.id}/Unmapped Reads.tar.gz",
        "--success-url",
        "https://idseq.net/bulk_downloads/#{@bulk_download.id}/success/#{@bulk_download.access_token}",
        "--error-url",
        "https://idseq.net/bulk_downloads/#{@bulk_download.id}/error/#{@bulk_download.access_token}",
        "--progress-url",
        "https://idseq.net/bulk_downloads/#{@bulk_download.id}/progress/#{@bulk_download.access_token}",
      ]

      expect(@bulk_download.bulk_download_ecs_task_command).to eq(task_command)
    end

    it "returns the correct task command for reads_non_host download type with fasta file format" do
      @bulk_download = create(:bulk_download, user: @joe, download_type: BulkDownloadTypesHelper::READS_NON_HOST_BULK_DOWNLOAD_TYPE, pipeline_run_ids: [
                                @sample_one.first_pipeline_run.id,
                                @sample_two.first_pipeline_run.id,
                              ], params: {
                                "file_format" => {
                                  "value" => ".fasta",
                                  "displayName" => ".fasta",
                                },
                              })

      allow(ENV).to receive(:[]).with("SERVER_DOMAIN").and_return("https://idseq.net")
      allow(ENV).to receive(:[]).with("SAMPLES_BUCKET_NAME").and_return("idseq-samples-prod")

      task_command = [
        "python",
        "s3_tar_writer.py",
        "--src-urls",
        "s3://idseq-samples-prod/samples/#{@project.id}/#{@sample_one.id}/postprocess/3.12/assembly/refined_taxid_annot.fasta",
        "s3://idseq-samples-prod/samples/#{@project.id}/#{@sample_two.id}/postprocess/3.12/assembly/refined_taxid_annot.fasta",
        "--tar-names",
        "Test Sample One__project-test_project_#{@project.id}__reads_nonhost_all.fasta",
        "Test Sample Two__project-test_project_#{@project.id}__reads_nonhost_all.fasta",
        "--dest-url",
        "s3://idseq-samples-prod/downloads/#{@bulk_download.id}/Reads (Non-host).tar.gz",
        "--success-url",
        "https://idseq.net/bulk_downloads/#{@bulk_download.id}/success/#{@bulk_download.access_token}",
        "--error-url",
        "https://idseq.net/bulk_downloads/#{@bulk_download.id}/error/#{@bulk_download.access_token}",
        "--progress-url",
        "https://idseq.net/bulk_downloads/#{@bulk_download.id}/progress/#{@bulk_download.access_token}",
      ]

      expect(@bulk_download.bulk_download_ecs_task_command).to eq(task_command)
    end

    it "returns the correct task command for reads_non_host download type with fastq file format" do
      @bulk_download = create(:bulk_download, user: @joe, download_type: BulkDownloadTypesHelper::READS_NON_HOST_BULK_DOWNLOAD_TYPE, pipeline_run_ids: [
                                @sample_one.first_pipeline_run.id,
                                @sample_two.first_pipeline_run.id,
                              ], params: {
                                "file_format" => {
                                  "value" => ".fastq",
                                  "displayName" => ".fastq",
                                },
                              })

      allow(ENV).to receive(:[]).with("SERVER_DOMAIN").and_return("https://idseq.net")
      allow(ENV).to receive(:[]).with("SAMPLES_BUCKET_NAME").and_return("idseq-samples-prod")

      task_command = [
        "python",
        "s3_tar_writer.py",
        "--src-urls",
        "s3://idseq-samples-prod/samples/#{@project.id}/#{@sample_one.id}/postprocess/3.12/nonhost_R1.fastq",
        "s3://idseq-samples-prod/samples/#{@project.id}/#{@sample_one.id}/postprocess/3.12/nonhost_R2.fastq",
        "s3://idseq-samples-prod/samples/#{@project.id}/#{@sample_two.id}/postprocess/3.12/nonhost_R1.fastq",
        "s3://idseq-samples-prod/samples/#{@project.id}/#{@sample_two.id}/postprocess/3.12/nonhost_R2.fastq",
        "--tar-names",
        "Test Sample One__project-test_project_#{@project.id}__reads_nonhost_all_R1.fastq",
        "Test Sample One__project-test_project_#{@project.id}__reads_nonhost_all_R2.fastq",
        "Test Sample Two__project-test_project_#{@project.id}__reads_nonhost_all_R1.fastq",
        "Test Sample Two__project-test_project_#{@project.id}__reads_nonhost_all_R2.fastq",
        "--dest-url",
        "s3://idseq-samples-prod/downloads/#{@bulk_download.id}/Reads (Non-host).tar.gz",
        "--success-url",
        "https://idseq.net/bulk_downloads/#{@bulk_download.id}/success/#{@bulk_download.access_token}",
        "--error-url",
        "https://idseq.net/bulk_downloads/#{@bulk_download.id}/error/#{@bulk_download.access_token}",
        "--progress-url",
        "https://idseq.net/bulk_downloads/#{@bulk_download.id}/progress/#{@bulk_download.access_token}",
      ]
      expect(@bulk_download.bulk_download_ecs_task_command).to eq(task_command)
    end

    it "returns the correct task command for contigs_non_host download type with fasta file format" do
      @bulk_download = create(:bulk_download, user: @joe, download_type: BulkDownloadTypesHelper::CONTIGS_NON_HOST_BULK_DOWNLOAD_TYPE, pipeline_run_ids: [
                                @sample_one.first_pipeline_run.id,
                                @sample_two.first_pipeline_run.id,
                              ])

      allow(ENV).to receive(:[]).with("SERVER_DOMAIN").and_return("https://idseq.net")
      allow(ENV).to receive(:[]).with("SAMPLES_BUCKET_NAME").and_return("idseq-samples-prod")

      task_command = [
        "python",
        "s3_tar_writer.py",
        "--src-urls",
        "s3://idseq-samples-prod/samples/#{@project.id}/#{@sample_one.id}/postprocess/3.12/assembly/contigs.fasta",
        "s3://idseq-samples-prod/samples/#{@project.id}/#{@sample_two.id}/postprocess/3.12/assembly/contigs.fasta",
        "--tar-names",
        "Test Sample One__project-test_project_#{@project.id}__contigs_nonhost_all.fasta",
        "Test Sample Two__project-test_project_#{@project.id}__contigs_nonhost_all.fasta",
        "--dest-url",
        "s3://idseq-samples-prod/downloads/#{@bulk_download.id}/Contigs (Non-host).tar.gz",
        "--success-url",
        "https://idseq.net/bulk_downloads/#{@bulk_download.id}/success/#{@bulk_download.access_token}",
        "--error-url",
        "https://idseq.net/bulk_downloads/#{@bulk_download.id}/error/#{@bulk_download.access_token}",
        "--progress-url",
        "https://idseq.net/bulk_downloads/#{@bulk_download.id}/progress/#{@bulk_download.access_token}",
      ]

      expect(@bulk_download.bulk_download_ecs_task_command).to eq(task_command)
    end

    it "returns the correct task command for host_gene_counts download type" do
      @bulk_download = create(:bulk_download, user: @joe, download_type: BulkDownloadTypesHelper::HOST_GENE_COUNTS_BULK_DOWNLOAD_TYPE, pipeline_run_ids: [
                                @sample_one.first_pipeline_run.id,
                                @sample_two.first_pipeline_run.id,
                              ])

      allow(ENV).to receive(:[]).with("SERVER_DOMAIN").and_return("https://idseq.net")
      allow(ENV).to receive(:[]).with("SAMPLES_BUCKET_NAME").and_return("idseq-samples-prod")

      task_command = [
        "python",
        "s3_tar_writer.py",
        "--src-urls",
        "s3://idseq-samples-prod/samples/#{@project.id}/#{@sample_one.id}/results/3.12/reads_per_gene.star.tab",
        "s3://idseq-samples-prod/samples/#{@project.id}/#{@sample_two.id}/results/3.12/reads_per_gene.star.tab",
        "--tar-names",
        "Test Sample One__project-test_project_#{@project.id}__reads_per_gene.star.tab",
        "Test Sample Two__project-test_project_#{@project.id}__reads_per_gene.star.tab",
        "--dest-url",
        "s3://idseq-samples-prod/downloads/#{@bulk_download.id}/Host Gene Counts.tar.gz",
        "--success-url",
        "https://idseq.net/bulk_downloads/#{@bulk_download.id}/success/#{@bulk_download.access_token}",
        "--error-url",
        "https://idseq.net/bulk_downloads/#{@bulk_download.id}/error/#{@bulk_download.access_token}",
        "--progress-url",
        "https://idseq.net/bulk_downloads/#{@bulk_download.id}/progress/#{@bulk_download.access_token}",
      ]

      expect(@bulk_download.bulk_download_ecs_task_command).to eq(task_command)
    end
  end

  context "#aegea_ecs_submit_command" do
    before do
      @joe = create(:joe)
      @bulk_download = create(:bulk_download, user: @joe)
    end

    it "returns the correct aegea ecs submit command" do
      allow(Rails).to receive(:env).and_return("prod")
      allow(ENV).to receive(:[]).with("SAMPLES_BUCKET_NAME").and_return("idseq-samples-prod")

      task_command = [
        "aegea", "ecs", "run", "--command=MOCK\\ SHELL\\ COMMAND",
        "--task-role", "idseq-downloads-prod",
        "--task-name", "bulk_download_#{@bulk_download.id}",
        "--ecr-image", "idseq-s3-tar-writer:latest",
        "--fargate-cpu", "4096",
        "--fargate-memory", "8192",
      ]

      expect(@bulk_download.aegea_ecs_submit_command(["MOCK SHELL COMMAND"])).to eq(task_command)
    end

    it "allows override of ecr image via AppConfig" do
      AppConfigHelper.set_app_config(AppConfig::S3_TAR_WRITER_SERVICE_ECR_IMAGE, "idseq-s3-tar-writer:v1.0")
      allow(Rails).to receive(:env).and_return("prod")
      allow(ENV).to receive(:[]).with("SAMPLES_BUCKET_NAME").and_return("idseq-samples-prod")

      task_command = [
        "aegea", "ecs", "run", "--command=MOCK\\ SHELL\\ COMMAND",
        "--task-role", "idseq-downloads-prod",
        "--task-name", "bulk_download_#{@bulk_download.id}",
        "--ecr-image", "idseq-s3-tar-writer:v1.0",
        "--fargate-cpu", "4096",
        "--fargate-memory", "8192",
      ]

      expect(@bulk_download.aegea_ecs_submit_command(["MOCK SHELL COMMAND"])).to eq(task_command)
    end
  end

  context "#kickoff_ecs_task" do
    before do
      @joe = create(:joe)
      @bulk_download = create(:bulk_download, user: @joe)
    end

    it "correctly updates bulk download on aegea ecs success" do
      expect(Open3).to receive(:capture3).exactly(1).times.and_return(
        [JSON.generate("taskArn": "ABC"), "", instance_double(Process::Status, exitstatus: 0)]
      )

      @bulk_download.kickoff_ecs_task(["SHELL_COMMAND"])

      expect(@bulk_download.ecs_task_arn).to eq("ABC")
      expect(@bulk_download.status).to eq(BulkDownload::STATUS_RUNNING)
    end

    it "correctly updates bulk download on aegea ecs failure" do
      expect(Open3).to receive(:capture3).exactly(1).times.and_return(
        ["", "An error occurred", instance_double(Process::Status, exitstatus: 1)]
      )

      expect do
        @bulk_download.kickoff_ecs_task(["SHELL_COMMAND"])
      end.to raise_error(StandardError, 'An error occurred')

      expect(@bulk_download.error_message).to eq(BulkDownloadsHelper::KICKOFF_FAILURE)
      expect(@bulk_download.status).to eq(BulkDownload::STATUS_ERROR)
    end
  end

  context "#generate_download_file" do
    before do
      @joe = create(:joe)
      @project = create(:project, users: [@joe], name: "Test Project")
      @alignment_config = create(:alignment_config, lineage_version: 3)
      @sample_one = create(:sample, project: @project, name: "Test Sample One",
                                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, pipeline_version: "3.12", alignment_config_id: @alignment_config.id }])
      @sample_two = create(:sample, project: @project, name: "Test Sample Two",
                                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, pipeline_version: "3.12", alignment_config_id: @alignment_config.id }])
    end

    def create_bulk_download(type, params)
      create(
        :bulk_download,
        user: @joe,
        download_type: type,
        pipeline_run_ids: [
          @sample_one.first_pipeline_run.id,
          @sample_two.first_pipeline_run.id,
        ],
        params: params
      )
    end

    def add_s3_tar_writer_expectations(file_data, exitstatus = 0, success = true)
      expect_any_instance_of(S3TarWriter).to receive(:start_streaming)

      file_data.each do |file_name, data|
        expect_any_instance_of(S3TarWriter).to receive(:add_file_with_data).with(
          file_name, data
        )
      end
      expect_any_instance_of(S3TarWriter).to receive(:close)
      expect_any_instance_of(S3TarWriter).to receive(:process_status).and_return(
        instance_double(Process::Status, exitstatus: exitstatus, success?: success)
      )
    end

    def create_taxon_lineage(taxid)
      # Creates a taxon lineage with effective tax_level 2 (genus)
      create(:taxon_lineage, taxid: taxid, genus_taxid: taxid, version_start: 3, version_end: 5)
    end

    it "correctly generates download file for download type sample_taxon_report" do
      bulk_download = create_bulk_download(BulkDownloadTypesHelper::SAMPLE_TAXON_REPORT_BULK_DOWNLOAD_TYPE, {})

      expect(ReportHelper).to receive(:taxonomy_details).exactly(2).times
      expect(ReportHelper).to receive(:generate_report_csv).exactly(1).times.and_return("mock_report_csv")
      expect(ReportHelper).to receive(:generate_report_csv).exactly(1).times.and_return("mock_report_csv_2")

      add_s3_tar_writer_expectations(
        "Test Sample One__project-test_project_#{@project.id}__taxon_report.csv" => "mock_report_csv",
        "Test Sample Two__project-test_project_#{@project.id}__taxon_report.csv" => "mock_report_csv_2"
      )

      bulk_download.generate_download_file

      expect(bulk_download.status).to eq(BulkDownload::STATUS_SUCCESS)
    end

    it "correctly updates the bulk_download status and progress as the sample_taxon_report runs" do
      bulk_download = create_bulk_download(BulkDownloadTypesHelper::SAMPLE_TAXON_REPORT_BULK_DOWNLOAD_TYPE, {})

      expect(ReportHelper).to receive(:taxonomy_details).exactly(2).times
      expect(ReportHelper).to receive(:generate_report_csv).exactly(1).times.and_return("mock_report_csv")
      expect(ReportHelper).to receive(:generate_report_csv).exactly(1).times.and_return("mock_report_csv_2")

      add_s3_tar_writer_expectations(
        "Test Sample One__project-test_project_#{@project.id}__taxon_report.csv" => "mock_report_csv",
        "Test Sample Two__project-test_project_#{@project.id}__taxon_report.csv" => "mock_report_csv_2"
      )

      expect(bulk_download).to receive(:progress_update_delay).exactly(2).times.and_return(0)

      expect(bulk_download).to receive(:update).with(status: BulkDownload::STATUS_RUNNING).exactly(1).times
      expect(bulk_download).to receive(:update).with(progress: 0.5).exactly(1).times
      expect(bulk_download).to receive(:update).with(progress: 1).exactly(1).times
      expect(bulk_download).to receive(:update).with(status: BulkDownload::STATUS_SUCCESS).exactly(1).times

      bulk_download.generate_download_file
    end

    it "correctly generates download file for download type sample_overview" do
      bulk_download = create_bulk_download(BulkDownloadTypesHelper::SAMPLE_OVERVIEW_BULK_DOWNLOAD_TYPE, {})

      expect(bulk_download).to receive(:format_samples).exactly(1).times
      expect(bulk_download).to receive(:generate_sample_list_csv).exactly(1).times.and_return("mock_sample_overview_csv")

      add_s3_tar_writer_expectations(
        "sample_overviews.csv" => "mock_sample_overview_csv"
      )

      bulk_download.generate_download_file

      expect(bulk_download.status).to eq(BulkDownload::STATUS_SUCCESS)
    end

    it "correctly generates download file for download type contig_summary_report" do
      bulk_download = create_bulk_download(BulkDownloadTypesHelper::CONTIG_SUMMARY_REPORT_BULK_DOWNLOAD_TYPE, {})

      allow_any_instance_of(PipelineRun).to receive(:generate_contig_mapping_table_csv).and_return("mock_contigs_summary_csv")

      add_s3_tar_writer_expectations(
        "Test Sample One__project-test_project_#{@project.id}__contig_summary_report.csv" => "mock_contigs_summary_csv",
        "Test Sample Two__project-test_project_#{@project.id}__contig_summary_report.csv" => "mock_contigs_summary_csv"
      )

      bulk_download.generate_download_file

      expect(bulk_download.status).to eq(BulkDownload::STATUS_SUCCESS)
    end

    let(:mock_tax_id) { 28_901 }
    let(:mock_tax_level) { 2 }

    it "correctly generates download file for download type reads_non_host for single taxon" do
      create_taxon_lineage(mock_tax_id)

      bulk_download = create_bulk_download(BulkDownloadTypesHelper::READS_NON_HOST_BULK_DOWNLOAD_TYPE, "taxa_with_reads" => {
                                             "value" => mock_tax_id,
                                             "displayName" => "Salmonella enterica",
                                           })

      expect(bulk_download).to receive(:get_taxon_fasta_from_pipeline_run_combined_nt_nr).with(anything, mock_tax_id, mock_tax_level).exactly(2).times.and_return("mock_reads_nonhost_fasta")

      add_s3_tar_writer_expectations(
        "Test Sample One__project-test_project_#{@project.id}__reads_nonhost_Salmonella enterica.fasta" => "mock_reads_nonhost_fasta",
        "Test Sample Two__project-test_project_#{@project.id}__reads_nonhost_Salmonella enterica.fasta" => "mock_reads_nonhost_fasta"
      )

      bulk_download.generate_download_file

      expect(bulk_download.status).to eq(BulkDownload::STATUS_SUCCESS)
    end

    it "correctly handles empty fastas for download type reads_non_host for single taxon" do
      create_taxon_lineage(mock_tax_id)

      bulk_download = create_bulk_download(BulkDownloadTypesHelper::READS_NON_HOST_BULK_DOWNLOAD_TYPE, "taxa_with_reads" => {
                                             "value" => mock_tax_id,
                                             "displayName" => "Salmonella enterica",
                                           })

      expect(bulk_download).to receive(:get_taxon_fasta_from_pipeline_run_combined_nt_nr).with(anything, mock_tax_id, mock_tax_level).exactly(2).times.and_return(nil)

      add_s3_tar_writer_expectations(
        "Test Sample One__project-test_project_#{@project.id}__reads_nonhost_Salmonella enterica.fasta" => "",
        "Test Sample Two__project-test_project_#{@project.id}__reads_nonhost_Salmonella enterica.fasta" => ""
      )

      bulk_download.generate_download_file

      expect(bulk_download.status).to eq(BulkDownload::STATUS_SUCCESS)
    end

    it "correctly throws exception if taxa_with_reads param not found for download type reads_non_host for single taxon" do
      create_taxon_lineage(mock_tax_id)

      bulk_download = create_bulk_download(BulkDownloadTypesHelper::READS_NON_HOST_BULK_DOWNLOAD_TYPE, {})

      expect do
        bulk_download.generate_download_file
      end.to raise_error.with_message(BulkDownloadsHelper::READS_NON_HOST_TAXID_EXPECTED)

      expect(bulk_download.status).to eq(BulkDownload::STATUS_ERROR)
    end

    it "correctly throws exception if taxon count not found for download type reads_non_host for single taxon" do
      bulk_download = create_bulk_download(BulkDownloadTypesHelper::READS_NON_HOST_BULK_DOWNLOAD_TYPE, "taxa_with_reads" => {
                                             "value" => mock_tax_id,
                                             "displayName" => "Salmonella enterica",
                                           })

      expect do
        bulk_download.generate_download_file
      end.to raise_error.with_message(BulkDownloadsHelper::READS_NON_HOST_TAXON_LINEAGE_EXPECTED_TEMPLATE % mock_tax_id)

      expect(bulk_download.status).to eq(BulkDownload::STATUS_ERROR)
    end

    it "correctly generates download file for download type contigs_non_host for single taxon" do
      bulk_download = create_bulk_download(BulkDownloadTypesHelper::CONTIGS_NON_HOST_BULK_DOWNLOAD_TYPE, "taxa_with_contigs" => {
                                             "value" => mock_tax_id,
                                             "displayName" => "Salmonella enterica",
                                           })
      allow_any_instance_of(PipelineRun).to receive(:get_contigs_for_taxid).and_return([object_double(Contig.new, to_fa: "mock_contigs_nonhost_fasta")])

      add_s3_tar_writer_expectations(
        "Test Sample One__project-test_project_#{@project.id}__contigs_nonhost_Salmonella enterica.fasta" => "mock_contigs_nonhost_fasta",
        "Test Sample Two__project-test_project_#{@project.id}__contigs_nonhost_Salmonella enterica.fasta" => "mock_contigs_nonhost_fasta"
      )

      bulk_download.generate_download_file

      expect(bulk_download.status).to eq(BulkDownload::STATUS_SUCCESS)
    end

    it "correctly handles individual sample failures" do
      bulk_download = create_bulk_download(BulkDownloadTypesHelper::SAMPLE_TAXON_REPORT_BULK_DOWNLOAD_TYPE, {})

      expect(ReportHelper).to receive(:taxonomy_details).exactly(2).times
      expect(ReportHelper).to receive(:generate_report_csv).exactly(1).times.and_return("mock_report_csv")
      # The second sample raises an error while generating.
      expect(ReportHelper).to receive(:generate_report_csv).exactly(1).times.and_raise("error")

      add_s3_tar_writer_expectations(
        "Test Sample One__project-test_project_#{@project.id}__taxon_report.csv" => "mock_report_csv"
      )

      bulk_download.generate_download_file

      # The bulk download succeeds and the failed sample is stored in the error message.
      expect(bulk_download.status).to eq(BulkDownload::STATUS_SUCCESS)
      expect(bulk_download.error_message).to eq(BulkDownloadsHelper::FAILED_SAMPLES_ERROR_TEMPLATE % 1)
    end

    it "correctly handles s3 tar file upload error" do
      bulk_download = create_bulk_download(BulkDownloadTypesHelper::SAMPLE_TAXON_REPORT_BULK_DOWNLOAD_TYPE, {})

      expect(ReportHelper).to receive(:taxonomy_details).exactly(2).times
      expect(ReportHelper).to receive(:generate_report_csv).exactly(1).times.and_return("mock_report_csv")
      expect(ReportHelper).to receive(:generate_report_csv).exactly(1).times.and_return("mock_report_csv_2")

      add_s3_tar_writer_expectations(
        {
          "Test Sample One__project-test_project_#{@project.id}__taxon_report.csv" => "mock_report_csv",
          "Test Sample Two__project-test_project_#{@project.id}__taxon_report.csv" => "mock_report_csv_2",
        },
        99,
        false
      )

      expect do
        bulk_download.generate_download_file
      end.to raise_error.with_message(BulkDownloadsHelper::BULK_DOWNLOAD_GENERATION_FAILED)

      expect(bulk_download.status).to eq(BulkDownload::STATUS_ERROR)
    end
  end

  context "#execution_type" do
    before do
      @joe = create(:joe)
      @project = create(:project, users: [@joe], name: "Test Project")
      @sample_one = create(:sample, project: @project, name: "Test Sample One",
                                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, pipeline_version: "3.12" }])
    end

    it "correctly returns the execution type" do
      expect(BulkDownloadTypesHelper).to receive(:bulk_download_type).with("FOOBAR").and_return(
        type: "FOOBAR",
        display_name: "Sample Overviews",
        description: "Sample metadata and QC metrics",
        category: "report",
        execution_type: BulkDownloadTypesHelper::RESQUE_EXECUTION_TYPE
      )
      bulk_download = create(
        :bulk_download,
        user: @joe,
        download_type: "FOOBAR",
        pipeline_run_ids: [@sample_one.first_pipeline_run.id]
      )

      expect(bulk_download.execution_type).to eq(BulkDownloadTypesHelper::RESQUE_EXECUTION_TYPE)
    end

    it "correctly throws error if execution type missing" do
      expect(BulkDownloadTypesHelper).to receive(:bulk_download_type).with("FOOBAR").and_return(
        type: "FOOBAR",
        display_name: "Sample Overviews",
        description: "Sample metadata and QC metrics",
        category: "report"
      )

      bulk_download = create(
        :bulk_download,
        user: @joe,
        download_type: "FOOBAR",
        pipeline_run_ids: [@sample_one.first_pipeline_run.id]
      )

      expect do
        bulk_download.execution_type
      end.to raise_error.with_message(BulkDownloadsHelper::UNKNOWN_EXECUTION_TYPE)
    end
  end

  context "#kickoff_resque_task" do
    before do
      @joe = create(:joe)
      @project = create(:project, users: [@joe], name: "Test Project")
      @sample_one = create(:sample, project: @project, name: "Test Sample One",
                                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, pipeline_version: "3.12" }])
    end

    it "properly kicks off resque task" do
      bulk_download = create(
        :bulk_download,
        user: @joe,
        pipeline_run_ids: [@sample_one.first_pipeline_run.id]
      )

      expect(Resque).to receive(:enqueue).with(
        GenerateBulkDownload, bulk_download.id
      )

      bulk_download.kickoff_resque_task
    end
  end

  context "#kickoff" do
    before do
      @joe = create(:joe)
      @project = create(:project, users: [@joe], name: "Test Project")
      @sample_one = create(:sample, project: @project, name: "Test Sample One",
                                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, pipeline_version: "3.12" }])
    end

    it "properly kicks off ecs task for download with ecs execution type" do
      bulk_download = create(
        :bulk_download,
        user: @joe,
        pipeline_run_ids: [@sample_one.first_pipeline_run.id]
      )

      expect(bulk_download).to receive(:execution_type).exactly(1).times.and_return(BulkDownloadTypesHelper::ECS_EXECUTION_TYPE)
      expect(bulk_download).to receive(:bulk_download_ecs_task_command).exactly(1).times.and_return("mock_ecs_command")
      expect(bulk_download).to receive(:kickoff_ecs_task).exactly(1).times.with("mock_ecs_command")

      bulk_download.kickoff
    end

    it "properly kicks off resque task for download with resque execution type" do
      bulk_download = create(
        :bulk_download,
        user: @joe,
        pipeline_run_ids: [@sample_one.first_pipeline_run.id]
      )

      expect(bulk_download).to receive(:execution_type).exactly(1).times.and_return(BulkDownloadTypesHelper::RESQUE_EXECUTION_TYPE)
      expect(bulk_download).to receive(:kickoff_resque_task).exactly(1).times

      bulk_download.kickoff
    end
  end
end
