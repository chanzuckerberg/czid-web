require 'rails_helper'

RSpec.describe ProjectsController, type: :controller do
  create_users

  # Admin specific behavior
  context "Admin user" do
    # create_users
    before do
      sign_in @admin
    end

    describe "GET index" do
      it "sees all projects" do
        expected_projects = [
          create(:project, users: [@admin]),
          create(:project, users: [@joe]),
          create(:project, users: [@joe, @admin]),
          create(:public_project),
          create(:project, samples_data: [{ created_at: 1.year.ago }]),
          create(:project, users: [@admin], samples_data: [{ created_at: 1.year.ago }])
        ]

        get :index, params: { format: "json" }

        json_response = JSON.parse(response.body)
        expect(json_response.count).to eq(expected_projects.count)
        expect(json_response.pluck("id")).to contain_exactly(*expected_projects.pluck("id"))
      end
    end

    describe "GET index for updatable domain" do
      it "sees all projects" do
        expected_projects = [
          create(:project, users: [@admin]),
          create(:project, users: [@joe]),
          create(:project, users: [@joe, @admin]),
          create(:public_project),
          create(:project, samples_data: [{ created_at: 1.year.ago }]),
          create(:project, users: [@admin], samples_data: [{ created_at: 1.year.ago }])
        ]

        get :index, params: { format: "json", domain: "updatable" }

        json_response = JSON.parse(response.body)
        expect(json_response.count).to eq(expected_projects.count)
        expect(json_response.pluck("id")).to contain_exactly(*expected_projects.pluck("id"))
      end
    end

    describe "GET index by project id for not owned project" do
      it "sees correct project id" do
        create(:project, :with_sample, users: [@admin])
        chosen_project = create(:project, :with_sample, users: [@joe])
        create(:project, :with_sample, users: [@joe, @admin])

        get :index, params: { format: "json", projectId: chosen_project.id }

        json_response = JSON.parse(response.body)
        expect(json_response.count).to eq(1)
        expect(json_response[0]["id"]).to eq(chosen_project.id)
      end
    end
  end

  # Non-admin, aka Joe, specific behavior
  context "Joe" do
    before do
      sign_in @joe
    end

    describe "GET index" do
      it "sees own projects" do
        expected_projects = []
        create(:project, users: [@admin])
        expected_projects << create(:project, users: [@joe])
        expected_projects << create(:project, users: [@joe, @admin])
        create(:public_project)

        get :index, params: { format: "json" }

        json_response = JSON.parse(response.body)
        expect(json_response.count).to eq(expected_projects.count)
        expect(json_response.pluck("id")).to contain_exactly(*expected_projects.pluck("id"))
      end
    end

    describe "GET index for updatable" do
      it "sees own projects" do
        expected_projects = []
        create(:project, users: [@admin])
        expected_projects << create(:project, users: [@joe])
        expected_projects << create(:project, users: [@joe, @admin])
        create(:public_project)

        get :index, params: { format: "json", domain: "updatable" }

        json_response = JSON.parse(response.body)
        expect(json_response.count).to eq(expected_projects.count)
        expect(json_response.pluck("id")).to contain_exactly(*expected_projects.pluck("id"))
      end
    end

    describe "GET index by project id for not owned project" do
      it "sees correct project id" do
        create(:project, :with_sample, users: [@admin])
        chosen_project = create(:project, :with_sample, users: [@joe])
        create(:project, :with_sample, users: [@joe, @admin])

        get :index, params: { format: "json", projectId: chosen_project.id }

        json_response = JSON.parse(response.body)
        expect(json_response.count).to eq(1)
        expect(json_response[0]["id"]).to eq(chosen_project.id)
      end
    end
  end

  # Actions that are common to all users
  # We make use of parameterized tests to make sure behavior is the same for different roles
  with_signed_in_users(:joe, :admin) do |user_name|
    context "User #{user_name}" do
      describe "GET index for my_data domain" do
        it "sees own projects" do
          other_user = create(:user)
          expected_projects = []
          expected_projects << create(:project, users: [@user])
          create(:project, users: [other_user])
          expected_projects << create(:project, users: [other_user, @user])
          create(:public_project)
          expected_projects << create(:public_project, users: [@user])
          create(:project, samples_data: [{ created_at: 1.year.ago }])
          expected_projects << create(:project, users: [@user], samples_data: [{ created_at: 1.year.ago }])

          get :index, params: { format: "json", domain: "my_data" }

          json_response = JSON.parse(response.body)
          expect(json_response.count).to eq(expected_projects.count)
          expect(json_response.pluck("id")).to contain_exactly(*expected_projects.pluck("id"))
        end
      end

      describe "GET index for public domain" do
        it "does not see project without samples" do
          expected_projects = []
          create(:public_project)
          expected_projects << create(:public_project, :with_sample)

          get :index, params: { format: "json", domain: "public" }

          json_response = JSON.parse(response.body)
          expect(json_response.count).to eq(expected_projects.count)
          expect(json_response.pluck("id")).to eq(expected_projects.pluck("id"))
        end

        it "sees public projects" do
          expected_projects = []
          other_user = create(:user)
          create(:project, :with_sample, users: [@user])
          expected_projects << create(:public_project, :with_sample, users: [other_user])
          expected_projects << create(:public_project, :with_sample, users: [@user])

          get :index, params: { format: "json", domain: "public" }

          json_response = JSON.parse(response.body)
          expect(json_response.count).to eq(expected_projects.count)
          expect(json_response.pluck("id")).to contain_exactly(*expected_projects.pluck("id"))
        end

        it "sees projects with public samples" do
          other_user = create(:user)
          expected_projects = []
          create(:project, users: [@user], samples_data: [{ created_at: 6.months.ago }])
          expected_projects << create(:project, users: [other_user], samples_data: [{ created_at: 1.year.ago }])
          expected_projects << create(:project, users: [@user], samples_data: [{ created_at: 1.year.ago }])

          get :index, params: { format: "json", domain: "public" }

          json_response = JSON.parse(response.body)
          expect(json_response.count).to eq(expected_projects.count)
          expect(json_response.pluck("id")).to contain_exactly(*expected_projects.pluck("id"))
        end
      end

      describe "GET index with order" do
        it "sees projects sorted in descending order by default" do
          expected_projects = []
          expected_projects << create(:project, name: "Project M", users: [@user])
          expected_projects << create(:project, name: "Project Z", users: [@user])
          expected_projects << create(:project, name: "Project A", users: [@user])
          expected_projects.sort_by!(&:name).reverse!

          get :index, params: { format: "json", orderBy: "name" }

          json_response = JSON.parse(response.body)
          expect(json_response.count).to eq(expected_projects.count)
          expect(json_response.pluck("id")).to eq(expected_projects.pluck("id"))
        end
      end

      describe "GET index with ascending order" do
        it "sees projects sorted in ascending order" do
          expected_projects = []
          expected_projects << create(:project, name: "Project M", users: [@user])
          expected_projects << create(:project, name: "Project Z", users: [@user])
          expected_projects << create(:project, name: "Project A", users: [@user])
          expected_projects.sort_by!(&:name)

          get :index, params: { format: "json", orderBy: "name", orderDir: "asc" }

          json_response = JSON.parse(response.body)
          expect(json_response.count).to eq(expected_projects.count)
          expect(json_response.pluck("id")).to eq(expected_projects.pluck("id"))
        end
      end

      describe "GET index with descending order" do
        it "sees projects sorted in descending order" do
          expected_projects = []
          expected_projects << create(:project, name: "Project M", users: [@user])
          expected_projects << create(:project, name: "Project Z", users: [@user])
          expected_projects << create(:project, name: "Project A", users: [@user])
          expected_projects.sort_by!(&:name).reverse!

          get :index, params: { format: "json", orderBy: "name", orderDir: "desc" }

          json_response = JSON.parse(response.body)
          expect(json_response.count).to eq(expected_projects.count)
          expect(json_response.pluck("id")).to eq(expected_projects.pluck("id"))
        end
      end

      describe "GET index with malicious order direction field" do
        it "sees projects sorted in (default) descending order" do
          # in an exploitable query this would just work
          expected_projects = []
          expected_projects << create(:project, name: "Project M", users: [@user])
          expected_projects << create(:project, name: "Project Z", users: [@user])
          expected_projects << create(:project, name: "Project A", users: [@user])
          expected_projects.sort_by!(&:name).reverse!

          get :index, params: { format: "json", orderBy: "name", orderDir: "asc;" }

          json_response = JSON.parse(response.body)
          expect(json_response.count).to eq(expected_projects.count)
          expect(json_response.pluck("id")).to eq(expected_projects.pluck("id"))
        end
      end

      describe "GET index with malicious order by field" do
        it "sees projects sorted by default field id" do
          # not sure how to exploit but should not crash
          expected_projects = []
          expected_projects << create(:project, name: "Project M", users: [@user])
          expected_projects << create(:project, name: "Project Z", users: [@user])
          expected_projects << create(:project, name: "Project A", users: [@user])

          get :index, params: { format: "json", orderBy: "name;SELECT 1 FROM projects LIMIT 1;", orderDir: "asc" }

          json_response = JSON.parse(response.body)
          expect(json_response.count).to eq(expected_projects.count)
          expect(json_response.pluck("id")).to contain_exactly(*expected_projects.pluck("id"))
        end
      end

      describe "GET index by project id for owned project" do
        it "sees correct project id" do
          other_user = create(:user)
          create(:project, :with_sample, users: [other_user])
          create(:project, :with_sample, users: [@user])
          chosen_project = create(:project, :with_sample, users: [@user, other_user])

          get :index, params: { format: "json", projectId: chosen_project.id }

          json_response = JSON.parse(response.body)
          expect(json_response.count).to eq(1)
          expect(json_response[0]["id"]).to eq(chosen_project.id)
        end
      end

      describe "GET index by project id for public project" do
        it "sees correct project id" do
          other_user = create(:user)
          create(:project, :with_sample, users: [other_user])
          create(:project, :with_sample, users: [@user])
          chosen_project = create(:public_project, :with_sample, users: [@user, other_user])

          get :index, params: { format: "json", projectId: chosen_project.id }

          json_response = JSON.parse(response.body)
          expect(json_response.count).to eq(1)
          expect(json_response[0]["id"]).to eq(chosen_project.id)
        end
      end

      describe "GET index by project id for project with public samples" do
        it "sees correct project id" do
          other_user = create(:user)
          create(:project, :with_sample, users: [other_user])
          create(:project, :with_sample, users: [@user])
          chosen_project = create(:project, :with_public_sample, users: [@user, other_user])

          get :index, params: { format: "json", projectId: chosen_project.id }

          json_response = JSON.parse(response.body)
          expect(json_response.count).to eq(1)
          expect(json_response[0]["id"]).to eq(chosen_project.id)
        end
      end

      describe "GET index by project id for project without samples" do
        it "sees correct project id" do
          other_user = create(:user)
          create(:project, :with_sample, users: [other_user])
          chosen_project = create(:project, users: [@user])
          create(:project, :with_sample, users: [@user, other_user])

          get :index, params: { format: "json", projectId: chosen_project.id }

          json_response = JSON.parse(response.body)
          expect(json_response.count).to eq(1)
          expect(json_response[0]["id"]).to eq(chosen_project.id)
        end
      end


      ["my_data", "all_data"].each do |domain|
        describe "GET index for #{domain} domain" do
          it "sees all required fields" do
            extra_users = create_list(:user, 2)
            expected_projects = []
            expected_projects << create(
              :public_project,
              users: extra_users + [@user],
              samples_data: [
                {
                  host_genome_name: "Human",
                  user: extra_users[0],
                  metadata_fields: { collection_location: "San Francisco, USA", sample_type: "Serum" }
                },
                {
                  host_genome_name: "Mosquito",
                  user: @user,
                  metadata_fields: { collection_location: "San Francisco, USA", sample_type: "Water" }
                }
              ]
            )

            get :index, params: { format: "json", domain: domain }

            json_response = JSON.parse(response.body)
            expect(json_response.count).to eq(expected_projects.count)
            expect(json_response.pluck("id")).to eq(expected_projects.pluck("id"))

            response_project = json_response[0]
            expect(response_project).to include_json(id: expected_projects[0].id,
                                                     name: expected_projects[0].name,
                                                     created_at: expected_projects[0].created_at.as_json,
                                                     public_access: expected_projects[0].public_access,
                                                     number_of_samples: 2,
                                                     hosts: ["Human", "Mosquito"],
                                                     tissues: ["Serum", "Water"],
                                                     locations: ["San Francisco, USA"],
                                                     owner: extra_users[0].name,
                                                     editable: true,
                                                     users: (extra_users.as_json + [@user.as_json]).map { |u| u.slice("name", "email") })
          end

          it "sees all only limited fields when setting basic mode" do
            extra_users = create_list(:user, 2)
            expected_projects = []
            expected_projects << create(:public_project,
                                        users: extra_users + [@user],
                                        samples_data: [
                                          {
                                            host_genome_name: "Human",
                                            user: extra_users[0],
                                            metadata_fields: { collection_location: "San Francisco, USA", sample_type: "Serum" }
                                          },
                                          {
                                            host_genome_name: "Mosquito",
                                            user: @user,
                                            metadata_fields: { collection_location: "San Francisco, USA", sample_type: "Water" }
                                          }
                                        ])

            get :index, params: { format: "json", domain: domain, basic: true }

            json_response = JSON.parse(response.body)
            expect(json_response.count).to eq(expected_projects.count)
            expect(json_response.pluck("id")).to eq(expected_projects.pluck("id"))

            response_project = json_response[0]
            expect(response_project).to include_json(id: expected_projects[0].id,
                                                     name: expected_projects[0].name,
                                                     created_at: expected_projects[0].created_at.as_json,
                                                     public_access: expected_projects[0].public_access,
                                                     number_of_samples: 2)
            expect(response_project.keys).to contain_exactly("id", "name", "created_at", "public_access", "number_of_samples")
          end

          it "sees private projects when filtering by private visibility" do
            expected_projects = []
            # private projects with no samples will be filtered out due to
            # (1) not being able to access samples directly
            # (2) we filter both project and samples by visibility
            # TODO(tiago): refactor to handle this edge case and add to expected
            create(:project, users: [@user])
            create(:public_project, users: [@user])
            create(:public_project, :with_sample, users: [@user])
            expected_projects << create(:project, :with_sample, users: [@user])

            get :index, params: { format: "json", domain: domain, visibility: "private" }

            json_response = JSON.parse(response.body)
            expect(json_response.count).to eq(expected_projects.count)
            expect(json_response.pluck("id")).to eq(expected_projects.pluck("id"))
          end

          it "sees public projects when filtering by public visibility" do
            expected_projects = []
            # TODO(tiago): should we see public projects without samples with public filter?
            # Not useful but logically we should - currently we cannot see it due to the same edge case as in the private filter
            create(:public_project, users: [@user])
            expected_projects << create(:public_project, :with_sample, users: [@user])
            create(:project, :with_sample, users: [@user])

            get :index, params: { format: "json", domain: domain, visibility: "public" }

            json_response = JSON.parse(response.body)
            expect(json_response.count).to eq(expected_projects.count)
            expect(json_response.pluck("id")).to eq(expected_projects.pluck("id"))
          end

          it "sees correct projects when filtering by sample_type metadata field" do
            expected_projects = []

            create(:project, users: [@user])
            create(:project, :with_sample, users: [@user])
            expected_projects << create(:project, users: [@user], samples_data: [metadata_fields: { sample_type: "Serum" }])
            create(:project, users: [@user], samples_data: [metadata_fields: { sample_type: "Non-Serum" }])

            get :index, params: { format: "json", domain: domain, tissue: "Serum" }

            json_response = JSON.parse(response.body)
            expect(json_response.count).to eq(expected_projects.count)
            expect(json_response.pluck("id")).to eq(expected_projects.pluck("id"))
          end

          it "sees correct projects when filtering by location metadata field" do
            expected_projects = []

            create(:project, users: [@user])
            create(:project, :with_sample, users: [@user])
            expected_projects << create(:project, users: [@user], samples_data: [metadata_fields: { collection_location: "San Francisco, USA" }])
            create(:project, users: [@user], samples_data: [metadata_fields: { collection_location: "Lisbon, Portugal" }])

            get :index, params: { format: "json", domain: domain, location: "San Francisco, USA" }

            json_response = JSON.parse(response.body)
            expect(json_response.count).to eq(expected_projects.count)
            expect(json_response.pluck("id")).to eq(expected_projects.pluck("id"))
          end

          it "sees correct projects when filtering by host_genome" do
            expected_projects = []

            create(:project, users: [@user])
            create(:project, :with_sample, users: [@user])
            create(:project, :with_sample, users: [@user], host_genome_name: "pig")
            expected_projects << create(:project, :with_sample, users: [@user], host_genome_name: "human")

            get :index, params: { format: "json", domain: domain, host: HostGenome.find_by(name: "human").id }

            json_response = JSON.parse(response.body)
            expect(json_response.count).to eq(expected_projects.count)
            expect(json_response.pluck("id")).to eq(expected_projects.pluck("id"))
          end

          it "sees correct projects when filtering by time" do
            expected_projects = []

            create(:project, users: [@user])
            travel_to 300.days.ago do
              create(:project, :with_sample, users: [@user])
            end
            travel_to 30.days.ago do
              expected_projects << create(:project, :with_sample, users: [@user])
            end
            travel_to 5.days.ago do
              expected_projects << create(:project, :with_sample, users: [@user])
            end
            travel_to DateTime.current do
              expected_projects << create(:project, :with_sample, users: [@user])
            end
            # by default, most recent projects first
            expected_projects.reverse!

            get :index, params: { format: "json", domain: domain, time: [30.days.ago.strftime("%Y%m%d"), DateTime.current.strftime("%Y%m%d")] }

            json_response = JSON.parse(response.body)
            expect(json_response.count).to eq(expected_projects.count)
            expect(json_response.pluck("id")).to eq(expected_projects.pluck("id"))
          end

          it "sees correct projects when filtering by taxon" do
            expected_projects = []
            create(:project, users: [@user])
            create(:project, :with_sample, users: [@user])
            create(:project, users: [@user], samples_data: [{ pipeline_runs_data: [{ taxon_counts_data: [{ taxon_name: "klebsormidium", nt: 10 }], job_status: "CHECKED" }] }])
            create(:project, users: [@user], samples_data: [{ pipeline_runs_data: [{ taxon_counts_data: [{ taxon_name: "klebsiella", nt: 0 }], job_status: "CHECKED" }] }])
            expected_projects << create(:project, users: [@user], samples_data: [{ pipeline_runs_data: [{ taxon_counts_data: [{ taxon_name: "klebsiella", nt: 10 }], job_status: "CHECKED" }] }])

            get :index, params: { format: "json", domain: domain, taxon: TaxonLineage.find_by(tax_name: "klebsiella").id }

            json_response = JSON.parse(response.body)
            expect(json_response.count).to eq(expected_projects.count)
            expect(json_response.pluck("id")).to eq(expected_projects.pluck("id"))
          end

          it "sees correct projects when filtering by a search string" do
            expected_projects = []
            expected_projects << create(:project, name: "find_this_Project", users: [@user])
            expected_projects << create(:project, name: "Project_find_this", users: [@user])
            expected_projects << create(:project, name: "Project find_this", users: [@user])
            expected_projects << create(:project, name: "Project find this", users: [@user])
            expected_projects << create(:project, :with_sample, name: "find_this_Project_with_sample", users: [@user])
            create(:project, :with_sample, name: "Project", users: [@user])

            get :index, params: { format: "json", domain: domain, search: "find_this" }

            json_response = JSON.parse(response.body)
            expect(json_response.count).to eq(expected_projects.count)
            expect(json_response.pluck("id")).to contain_exactly(*expected_projects.pluck("id"))
          end
        end
      end
    end
  end
end
