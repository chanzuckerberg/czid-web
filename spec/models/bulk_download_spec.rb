require 'rails_helper'

describe BulkDownload, type: :model do
  context "#success_url" do
    before do
      @joe = create(:joe)
      @bulk_download = create(:bulk_download, user: @joe)
    end

    it "returns correct success url for prod" do
      allow(Rails).to receive(:env).and_return("prod")
      expect(@bulk_download.success_url).to eq("https://idseq.net/bulk_downloads/#{@bulk_download.id}/success/#{@bulk_download.access_token}")
    end

    it "returns correct success url for staging" do
      allow(Rails).to receive(:env).and_return("staging")
      expect(@bulk_download.success_url).to eq("https://staging.idseq.net/bulk_downloads/#{@bulk_download.id}/success/#{@bulk_download.access_token}")
    end

    it "returns correct success url when development tunnel url is provided" do
      allow(Rails).to receive(:env).and_return("development")
      allow(ENV).to receive(:[]).with("DEVELOPMENT_TUNNEL_URL").and_return("https://abcdef.ngrok.io")

      expect(@bulk_download.success_url).to eq("https://abcdef.ngrok.io/bulk_downloads/#{@bulk_download.id}/success/#{@bulk_download.access_token}")
    end

    it "returns nil if nothing set" do
      allow(Rails).to receive(:env).and_return("development")

      expect(@bulk_download.success_url).to eq(nil)
    end
  end

  context "#error_url" do
    before do
      @joe = create(:joe)
      @bulk_download = create(:bulk_download, user: @joe)
    end

    it "returns correct error url for prod" do
      allow(Rails).to receive(:env).and_return("prod")
      expect(@bulk_download.error_url).to eq("https://idseq.net/bulk_downloads/#{@bulk_download.id}/error/#{@bulk_download.access_token}")
    end

    it "returns correct error url for staging" do
      allow(Rails).to receive(:env).and_return("staging")
      expect(@bulk_download.error_url).to eq("https://staging.idseq.net/bulk_downloads/#{@bulk_download.id}/error/#{@bulk_download.access_token}")
    end

    it "returns correct error url when development tunnel url is provided" do
      allow(Rails).to receive(:env).and_return("development")
      allow(ENV).to receive(:[]).with("DEVELOPMENT_TUNNEL_URL").and_return("https://abcdef.ngrok.io")

      expect(@bulk_download.error_url).to eq("https://abcdef.ngrok.io/bulk_downloads/#{@bulk_download.id}/error/#{@bulk_download.access_token}")
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
      allow(Rails).to receive(:env).and_return("prod")
      expect(@bulk_download.progress_url).to eq("https://idseq.net/bulk_downloads/#{@bulk_download.id}/progress/#{@bulk_download.access_token}")
    end

    it "returns correct progress url for staging" do
      allow(Rails).to receive(:env).and_return("staging")
      expect(@bulk_download.progress_url).to eq("https://staging.idseq.net/bulk_downloads/#{@bulk_download.id}/progress/#{@bulk_download.access_token}")
    end

    it "returns correct progress url when development tunnel url is provided" do
      allow(Rails).to receive(:env).and_return("development")
      allow(ENV).to receive(:[]).with("DEVELOPMENT_TUNNEL_URL").and_return("https://abcdef.ngrok.io")

      expect(@bulk_download.progress_url).to eq("https://abcdef.ngrok.io/bulk_downloads/#{@bulk_download.id}/progress/#{@bulk_download.access_token}")
    end

    it "returns nil if nothing set" do
      allow(Rails).to receive(:env).and_return("development")

      expect(@bulk_download.progress_url).to eq(nil)
    end
  end

  context "#bulk_download_ecs_task_command" do
    before do
      @joe = create(:joe)
      @project = create(:project, users: [@joe])
      @sample_one = create(:sample, project: @project, name: "Test Sample One",
                                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
      @sample_two = create(:sample, project: @project, name: "Test Sample Two",
                                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
      @bulk_download = create(:bulk_download, user: @joe, download_type: "original_input_file", pipeline_run_ids: [
                                @sample_one.first_pipeline_run.id,
                                @sample_two.first_pipeline_run.id,
                              ])
    end

    it "returns the correct task command for original input file download type" do
      allow(Rails).to receive(:env).and_return("prod")
      allow(ENV).to receive(:[]).with("SAMPLES_BUCKET_NAME").and_return("idseq-samples-prod")

      task_command = [
        "python s3_tar_writer.py",
        "--src-urls s3://idseq-samples-prod/samples/#{@project.id}/#{@sample_one.id}/fastqs/#{@sample_one.input_files[0].name}",
        "s3://idseq-samples-prod/samples/#{@project.id}/#{@sample_one.id}/fastqs/#{@sample_one.input_files[1].name}",
        "s3://idseq-samples-prod/samples/#{@project.id}/#{@sample_two.id}/fastqs/#{@sample_two.input_files[0].name}",
        "s3://idseq-samples-prod/samples/#{@project.id}/#{@sample_two.id}/fastqs/#{@sample_two.input_files[1].name}",
        "--tar-names Test\\ Sample\\ One__original_R1.fastq.gz",
        "Test\\ Sample\\ One__original_R2.fastq.gz",
        "Test\\ Sample\\ Two__original_R1.fastq.gz",
        "Test\\ Sample\\ Two__original_R2.fastq.gz",
        "--dest-url s3://idseq-samples-prod/downloads/#{@bulk_download.id}/original_input_file.tar.gz",
        "--success-url https://idseq.net/bulk_downloads/#{@bulk_download.id}/success/#{@bulk_download.access_token}",
        "--error-url https://idseq.net/bulk_downloads/#{@bulk_download.id}/error/#{@bulk_download.access_token}",
        "--progress-url https://idseq.net/bulk_downloads/#{@bulk_download.id}/progress/#{@bulk_download.access_token}",
      ].join(" ")

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
        "aegea ecs run --command=MOCK\\ SHELL\\ COMMAND",
        "--task-role idseq-downloads-prod",
        "--ecr-image idseq-s3-tar-writer:latest",
        "--fargate-cpu 4096",
        "--fargate-memory 8192",
      ].join(" ")

      expect(@bulk_download.aegea_ecs_submit_command("MOCK SHELL COMMAND")).to eq(task_command)
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

      @bulk_download.kickoff_ecs_task("SHELL_COMMAND")

      expect(@bulk_download.ecs_task_arn).to eq("ABC")
      expect(@bulk_download.status).to eq(BulkDownload::STATUS_RUNNING)
    end

    it "correctly updates bulk download on aegea ecs failure" do
      expect(Open3).to receive(:capture3).exactly(1).times.and_return(
        ["", "An error occurred", instance_double(Process::Status, exitstatus: 1)]
      )

      expect do
        @bulk_download.kickoff_ecs_task("SHELL_COMMAND")
      end.to raise_error(StandardError, 'An error occurred')

      expect(@bulk_download.error_message).to eq(BulkDownloadsHelper::KICKOFF_FAILURE)
      expect(@bulk_download.status).to eq(BulkDownload::STATUS_ERROR)
    end
  end
end
