require 'rails_helper'

RSpec.describe AmrHeatmapController, type: :controller do
  create_users

  # Admin context
  context 'Admin user' do
    # create users
    before do
      sign_in @admin
    end

    describe "GET index" do
      it "assigns @sample_ids" do
        project = create(:project, users: [@admin, @joe])
        sample_one = create(:sample, project: project, pipeline_runs_data: [{
                              amr_counts_data: [{
                                gene: "IamA_Gene"
                              }],
                              job_status: PipelineRun::STATUS_CHECKED,
                              output_states_data: [{
                                output: "amr_counts",
                                state: PipelineRun::STATUS_LOADED
                              }]
                            }])
        sample_two = create(:sample, project: project, pipeline_runs_data: [{
                              amr_counts_data: [{
                                gene: "AnoT_Her"
                              }],
                              job_status: PipelineRun::STATUS_CHECKED,
                              output_states_data: [{
                                output: "amr_counts",
                                state: PipelineRun::STATUS_LOADED
                              }]
                            }])

        get :index, params: { sampleIds: [sample_one["id"], sample_two["id"]] }
        expect(assigns(:sample_ids)).to eq([sample_one["id"].to_i, sample_two["id"].to_i])
      end

      it "renders the index template" do
        project = create(:project, users: [@admin, @joe])
        sample_one = create(:sample, project: project, pipeline_runs_data: [{
                              amr_counts_data: [{
                                gene: "IamA_Gene"
                              }],
                              job_status: PipelineRun::STATUS_CHECKED,
                              output_states_data: [{
                                output: "amr_counts",
                                state: PipelineRun::STATUS_LOADED
                              }]
                            }])
        sample_two = create(:sample, project: project, pipeline_runs_data: [{
                              amr_counts_data: [{
                                gene: "AnoT_Her"
                              }],
                              job_status: PipelineRun::STATUS_CHECKED,
                              output_states_data: [{
                                output: "amr_counts",
                                state: PipelineRun::STATUS_LOADED
                              }]
                            }])

        get :index, params: { sampleIds: [sample_one["id"], sample_two["id"]] }
        expect(response).to render_template("index")
      end
    end

    describe "GET json" do
      it "sees correct AMR data from multiple samples" do
        # Create a test sample (in a project, as required) that contains Amr data.
        # Note that pipeline_runs_data needs to have two attributes in order for the sample
        # to be available for the AmrHeatmapController: a job_status equal to the constant
        # STATUS_CHECKED as defined in the PipelineRun class, and an output_states array
        # containing an OutputState for amr_counts with state equal to the constant
        # STATUS_LOADED as defined in the PipelineRun class.
        project = create(:project, users: [@admin, @joe])
        sample_one = create(:sample, project: project, pipeline_runs_data: [{
                              amr_counts_data: [{
                                gene: "IamA_Gene"
                              }],
                              job_status: PipelineRun::STATUS_CHECKED,
                              output_states_data: [{
                                output: "amr_counts",
                                state: PipelineRun::STATUS_LOADED
                              }]
                            }])
        sample_two = create(:sample, project: project, pipeline_runs_data: [{
                              amr_counts_data: [{
                                gene: "AnoT_Her"
                              }],
                              job_status: PipelineRun::STATUS_CHECKED,
                              output_states_data: [{
                                output: "amr_counts",
                                state: PipelineRun::STATUS_LOADED
                              }]
                            }])

        amr_counts_one = sample_one.first_pipeline_run.amr_counts[0] # Because we only have one AmrCount in amr_counts_data
        amr_counts_two = sample_two.first_pipeline_run.amr_counts[0]

        get :amr_counts, params: { sampleIds: [sample_one["id"], sample_two["id"]] }
        expect(response.content_type).to eq("application/json")
        expect(response).to have_http_status(:ok)

        # Compare controller output to our test sample.
        # The created_at and updated_at fields seem to differ in format (though not content)
        # when this is run, so they are left them out of the comparison.
        json_response = JSON.parse(response.body)
        expect(json_response[0]).to include_json(sample_id: sample_one["id"],
                                                 sample_name: sample_one["name"],
                                                 amr_counts: [{
                                                   id: amr_counts_one["id"],
                                                   gene: amr_counts_one["gene"],
                                                   allele: amr_counts_one["allele"],
                                                   coverage: amr_counts_one["coverage"],
                                                   depth: amr_counts_one["depth"],
                                                   pipeline_run_id: amr_counts_one["pipeline_run_id"],
                                                   drug_family: amr_counts_one["drug_family"]
                                                 }])
        expect(json_response[1]).to include_json(sample_id: sample_two["id"],
                                                 sample_name: sample_two["name"],
                                                 amr_counts: [{
                                                   id: amr_counts_two["id"],
                                                   gene: amr_counts_two["gene"],
                                                   allele: amr_counts_two["allele"],
                                                   coverage: amr_counts_two["coverage"],
                                                   depth: amr_counts_two["depth"],
                                                   pipeline_run_id: amr_counts_two["pipeline_run_id"],
                                                   drug_family: amr_counts_two["drug_family"]
                                                 }])
      end

      it "works even if a sample doesn't exist" do
        # Create a test sample (in a project, as required) that contains AMR data.
        project = create(:project, users: [@admin, @joe])
        sample_one = create(:sample, project: project, pipeline_runs_data: [{
                              amr_counts_data: [{
                                gene: "IamA_Gene"
                              }],
                              job_status: PipelineRun::STATUS_CHECKED,
                              output_states_data: [{
                                output: "amr_counts",
                                state: PipelineRun::STATUS_LOADED
                              }]
                            }])

        amr_counts_one = sample_one.first_pipeline_run.amr_counts[0] # Because we only have one AmrCount in amr_counts_data

        get :amr_counts, params: { sampleIds: [sample_one["id"], 99_999] } # Sample ID 99999 should not exist
        expect(response.content_type).to eq("application/json")
        expect(response).to have_http_status(:ok)

        # Compare controller output to our test sample.
        # The created_at and updated_at fields seem to differ in format (though not content)
        # when this is run, so they are left them out of the comparison.
        json_response = JSON.parse(response.body)
        expect(json_response[0]).to include_json(sample_id: sample_one["id"],
                                                 sample_name: sample_one["name"],
                                                 amr_counts: [{
                                                   id: amr_counts_one["id"],
                                                   gene: amr_counts_one["gene"],
                                                   allele: amr_counts_one["allele"],
                                                   coverage: amr_counts_one["coverage"],
                                                   depth: amr_counts_one["depth"],
                                                   pipeline_run_id: amr_counts_one["pipeline_run_id"],
                                                   drug_family: amr_counts_one["drug_family"]
                                                 }],
                                                 error: "")
        expect(json_response[1]).to include_json(sample_id: 99_999,
                                                 sample_name: "",
                                                 amr_counts: [],
                                                 error: "sample not found")
      end

      it "works even if a sample doesn't have amr counts" do
        # Create a test sample without AMR data.
        project = create(:project, users: [@admin, @joe])
        sample_one = create(:sample, project: project, pipeline_runs_data: [{
                              job_status: PipelineRun::STATUS_CHECKED
                            }])

        get :amr_counts, params: { sampleIds: [sample_one["id"]] }
        expect(response.content_type).to eq("application/json")
        expect(response).to have_http_status(:ok)

        # Compare controller output to our test sample.
        json_response = JSON.parse(response.body)
        expect(json_response[0]).to include_json(sample_id: sample_one["id"],
                                                 sample_name: sample_one["name"],
                                                 amr_counts: [],
                                                 error: "")
      end
    end

    describe "GET CARD entry information" do
      it "should return relevant information from the CARD Ontology database" do
        get :fetch_card_info, params: { geneName: "dfrA1" }
        expect(response.content_type).to eq("application/json")
        expect(response).to have_http_status(:ok)

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(
          accession: "3003080",
          label: "daptomycin resistant pgsA",
          synonyms: [
            "phosphatidylglycerophosphate synthetase"
          ],
          description: "gsA or phosphatidylglycerophosphate synthetase is an integral membrane protein involved in phospholipid biosynthesis. It is a CDP-diacylglycerol-glycerol-3-phosphate 3-phosphatidyltransferase. Laboratory experiments have detected mutations conferring daptomycin resistance in Entercoccus.",
          geneFamily: [
            {
              label: "determinant of resistance to lipopeptide antibiotics",
              description: "Enzymes, other proteins or other gene products shown clinically to confer resistance to lipopeptide antibiotics."
            },
            {
              label: "antibiotic resistant pgsA",
              description: "pgsA or phosphatidylglycerophosphate synthetase is an integral membrane protein involved in phospholipid biosynthesis. It is a CDP-diacylglycerol-glycerol-3-phosphate 3-phosphatidyltransferase."
            }
          ],
          drugClass: [
            {
              label: "daptomycin",
              description: "Daptomycin is a novel lipopeptide antibiotic used in the treatment of certain infections caused by Gram-positive organisms. Daptomycin interferes with the bacterial cell membrane, reducing membrane potential and inhibiting cell wall synthesis."
            },
            {
              label: "peptide antibiotic",
              description: "Peptide antibiotics have a wide range of antibacterial mechanisms, depending on the amino acids that make up the antibiotic, although most act to disrupt the cell membrane in some manner. Subclasses of peptide antibiotics can include additional sidechains of other types, such as lipids in the case of the lipopeptide antibiotics."
            }
          ],
          publications: [
            "Hachmann AB1, Sevim E, Gaballa A, Popham DL, Antelmann H, Helmann JD. Reduction in membrane phosphatidylglycerol content leads to daptomycin resistance in Bacillus subtilis. (PMID 21709092)",
            "Peleg AY1, Miyakis S, Ward DV, Earl AM, Rubio A, Cameron DR, Pillai S, Moellering RC Jr, Eliopoulos GM. Whole genome characterization of the mechanisms of daptomycin resistance in clinical and laboratory derived isolates of Staphylococcus aureus. (PMID 22238576)"
          ],
          error: ""
        )
      end

      it "should return an ontology object with an error message if no match is found" do
        get :fetch_card_info, params: { geneName: "ImNotInCard" }
        expect(response.content_type).to eq("application/json")
        expect(response).to have_http_status(:ok)

        json_response = JSON.parse(response.body)
        expect(json_response).to include_json(
          accession: "",
          label: "",
          synonyms: [],
          description: "",
          geneFamily: [],
          drugClass: [],
          publications: [],
          error: "No match found for ImNotInCard in the CARD Antibiotic Resistance Ontology."
        )
      end
    end
  end

  # Regular Joe context
  # Ensure that this feature cannot be accessed by non-admin users
  # TODO: Add a test case where the user tries to access a sample that they don't have access to.
  context 'Joe' do
    before do
      sign_in @joe
    end

    describe "GET json" do
      it "should not see any AMR information" do
        # As above
        project = create(:project, users: [@admin, @joe])
        sample = create(:sample, project: project, pipeline_runs_data: [{
                          amr_counts_data: [{
                            gene: "IamA_Gene"
                          }],
                          job_status: PipelineRun::STATUS_CHECKED,
                          output_states_data: [{
                            output: "amr_counts",
                            state: PipelineRun::STATUS_LOADED
                          }]
                        }])

        get :amr_counts, params: { id: [sample["id"]] }
        expect(response).to redirect_to("/")
      end
    end
  end
end
