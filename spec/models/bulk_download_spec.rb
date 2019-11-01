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
end
