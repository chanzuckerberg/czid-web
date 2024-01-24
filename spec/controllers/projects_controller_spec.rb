require 'rails_helper'

WebMock.allow_net_connect!

RSpec.describe ProjectsController, type: :controller do
  KLEBSIELLA_TAX_ID = 2

  create_users

  # Admin specific behavior
  context "Admin user" do
    # create_users
    before do
      sign_in @admin
      @project1 = create(:project, users: [@admin])
      @project2 = create(:project, users: [@joe])
      @project3 = create(:project, users: [@joe, @admin])
      @project4 = create(:public_project)
      @project5 = create(:project, samples_data: [{ created_at: 1.year.ago }])
      @project6 = create(:project, users: [@admin], samples_data: [{ created_at: 1.year.ago }])
    end

    describe "GET index" do
      it "sees all projects" do
        expected_projects = [@project1, @project2, @project3, @project4, @project5, @project6]

        get :index, params: { format: "json" }

        json_response = JSON.parse(response.body)
        expect(json_response["projects"].count).to eq(expected_projects.count)
        expect(json_response["projects"].pluck("id")).to contain_exactly(*expected_projects.pluck("id"))
        expect(json_response["projects"].pluck("users").flatten.pluck("name")).to contain_exactly(*expected_projects.map(&:users).flatten.pluck(:name))
      end
    end

    describe "GET index for updatable domain" do
      it "sees all projects" do
        expected_projects = [@project1, @project2, @project3, @project4, @project5, @project6]

        get :index, params: { format: "json", domain: "updatable" }

        json_response = JSON.parse(response.body)
        expect(json_response["projects"].count).to eq(expected_projects.count)
        expect(json_response["projects"].pluck("id")).to contain_exactly(*expected_projects.pluck("id"))
        expect(json_response["projects"].pluck("users").flatten.pluck("name")).to contain_exactly(*expected_projects.map(&:users).flatten.pluck(:name))
      end
    end

    describe "GET index by project id for not owned project" do
      it "sees correct project id" do
        create(:project, :with_sample, users: [@admin])
        chosen_project = create(:project, :with_sample, users: [@joe])
        create(:project, :with_sample, users: [@joe, @admin])

        get :index, params: { format: "json", projectId: chosen_project.id }

        json_response = JSON.parse(response.body)
        expect(json_response["projects"].count).to eq(1)
        expect(json_response["projects"][0]["id"]).to eq(chosen_project.id)
      end
    end
  end

  # Non-admin, aka Joe, specific behavior
  context "Joe" do
    before do
      sign_in @joe
      @project1 = create(:project, users: [@admin])
      @project2 = create(:project, users: [@joe])
      @project3 = create(:project, users: [@joe, @admin])
      @project4 = create(:public_project)
    end

    describe "GET index" do
      it "sees own projects ordered by descending creation date" do
        get :index, params: { format: "json" }

        json_response = JSON.parse(response.body)
        expected_projects = [@project3, @project2]
        expect(json_response["projects"].count).to eq(expected_projects.count)
        expect(json_response["projects"]).to include_json([
                                                            { id: @project3.id },
                                                            { id: @project2.id },
                                                          ])
      end

      context "when sorting_v0 is enabled" do
        it "sees own projects ordered by descending creation date if no sort parameters are specified" do
          @joe.add_allowed_feature("sorting_v0")

          get :index, params: { format: "json" }

          json_response = JSON.parse(response.body)
          expected_projects = [@project3, @project2]
          expect(json_response["projects"].count).to eq(expected_projects.count)
          expect(json_response["projects"]).to include_json([
                                                              { id: @project3.id },
                                                              { id: @project2.id },
                                                            ])
        end
      end
    end

    describe "GET index for updatable" do
      it "sees own projects" do
        expected_projects = [@project2, @project3]

        get :index, params: { format: "json", domain: "updatable" }

        json_response = JSON.parse(response.body)
        expect(json_response["projects"].count).to eq(expected_projects.count)
        expect(json_response["projects"].pluck("id")).to contain_exactly(*expected_projects.pluck("id"))
      end
    end

    describe "GET index by project id for not owned project" do
      it "sees correct project id" do
        create(:project, :with_sample, users: [@admin])
        chosen_project = create(:project, :with_sample, users: [@joe])
        create(:project, :with_sample, users: [@joe, @admin])

        get :index, params: { format: "json", projectId: chosen_project.id }

        json_response = JSON.parse(response.body)
        expect(json_response["projects"].count).to eq(1)
        expect(json_response["projects"][0]["id"]).to eq(chosen_project.id)
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
          expect(json_response["projects"].count).to eq(expected_projects.count)
          expect(json_response["projects"].pluck("id")).to contain_exactly(*expected_projects.pluck("id"))
        end
      end

      describe "GET index for my_data domain in basic mode" do
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

          get :index, params: { format: "json", domain: "my_data", basic: 1 }

          json_response = JSON.parse(response.body)
          expect(json_response["projects"].count).to eq(expected_projects.count)
          expect(json_response["projects"].pluck("id")).to contain_exactly(*expected_projects.pluck("id"))
        end
      end

      describe "GET index for public domain" do
        it "does not see project without samples" do
          expected_projects = []
          create(:public_project)
          expected_projects << create(:public_project, :with_sample)

          get :index, params: { format: "json", domain: "public" }

          json_response = JSON.parse(response.body)
          expect(json_response["projects"].count).to eq(expected_projects.count)
          expect(json_response["projects"].pluck("id")).to eq(expected_projects.pluck("id"))
        end

        it "sees public projects" do
          expected_projects = []
          other_user = create(:user)
          create(:project, :with_sample, users: [@user])
          expected_projects << create(:public_project, :with_sample, users: [other_user])
          expected_projects << create(:public_project, :with_sample, users: [@user])

          get :index, params: { format: "json", domain: "public" }

          json_response = JSON.parse(response.body)
          expect(json_response["projects"].count).to eq(expected_projects.count)
          expect(json_response["projects"].pluck("id")).to contain_exactly(*expected_projects.pluck("id"))
        end

        it "sees projects with public samples" do
          other_user = create(:user)
          expected_projects = []
          create(:project, users: [@user], samples_data: [{ created_at: 6.months.ago }])
          # Add 1.day to avoid borderline timing error:
          expected_projects << create(:project, days_to_keep_sample_private: 365, users: [other_user], samples_data: [{ created_at: (1.year + 1.day).ago }])
          expected_projects << create(:project, days_to_keep_sample_private: 365, users: [@user], samples_data: [{ created_at: (1.year + 1.day).ago }])

          get :index, params: { format: "json", domain: "public" }

          json_response = JSON.parse(response.body)
          expect(json_response["projects"].count).to eq(expected_projects.count)
          expect(json_response["projects"].pluck("id")).to contain_exactly(*expected_projects.pluck("id"))
        end
      end

      describe "GET index with order" do
        context "when sorting_v0_admin is enabled" do
          it "defaults to sorting projects in descending order by created at" do
            @user.add_allowed_feature("sorting_v0_admin")
            expected_projects = []
            expected_projects << create(:project, name: "Project M", users: [@user])
            expected_projects << create(:project, name: "Project Z", users: [@user])
            expected_projects << create(:project, name: "Project A", users: [@user])
            expected_projects.sort_by!(&:created_at).reverse!

            get :index, params: { format: "json" }

            json_response = JSON.parse(response.body)
            expect(json_response["projects"].count).to eq(expected_projects.count)
            expect(json_response["projects"].pluck("id")).to eq(expected_projects.pluck("id"))
          end

          it "sorts projects in descending order by passed orderBy param" do
            @user.add_allowed_feature("sorting_v0_admin")
            expected_projects = []
            expected_projects << create(:project, name: "Project M", users: [@user])
            expected_projects << create(:project, name: "Project Z", users: [@user])
            expected_projects << create(:project, name: "Project A", users: [@user])
            expected_projects.sort_by!(&:name).reverse!

            get :index, params: { format: "json", orderBy: "project" }

            json_response = JSON.parse(response.body)
            expect(json_response["projects"].count).to eq(expected_projects.count)
            expect(json_response["projects"].pluck("id")).to eq(expected_projects.pluck("id"))
          end
        end

        context "when sorting_v0 is disabled" do
          it "defaults to sorting projects in descending order by id" do
            expected_projects = []
            expected_projects << create(:project, name: "Project M", users: [@user])
            expected_projects << create(:project, name: "Project Z", users: [@user])
            expected_projects << create(:project, name: "Project A", users: [@user])
            expected_projects.sort_by!(&:id).reverse!

            get :index, params: { format: "json" }

            json_response = JSON.parse(response.body)
            expect(json_response["projects"].count).to eq(expected_projects.count)
            expect(json_response["projects"].pluck("id")).to eq(expected_projects.pluck("id"))
          end
        end
      end

      describe "GET index for a specific page" do
        it "sees projects from that page only and no list of all ids" do
          expected_projects = []
          create(:project, name: "Project A", users: [@user])
          create(:project, name: "Project B", users: [@user])
          expected_projects << create(:project, name: "Project C", users: [@user])
          expected_projects << create(:project, name: "Project D", users: [@user])
          create(:project, name: "Project E", users: [@user])
          create(:project, name: "Project F", users: [@user])
          expected_projects.sort_by!(&:id).reverse!

          get :index, params: { format: "json", limit: 2, offset: 2 }
          json_response = JSON.parse(response.body)

          expect(json_response["projects"].count).to eq(expected_projects.count)
          expect(json_response["projects"].pluck("id")).to eq(expected_projects.pluck("id"))
          expect(json_response).not_to have_key("all_projects_ids")
        end
      end

      describe "GET index for a specific page and request all ids" do
        it "sees page projects and a list of all ids" do
          all_projects = [
            create(:project, name: "Project A", users: [@user]),
            create(:project, name: "Project B", users: [@user]),
            create(:project, name: "Project C", users: [@user]),
            create(:project, name: "Project D", users: [@user]),
            create(:project, name: "Project E", users: [@user]),
            create(:project, name: "Project F", users: [@user]),
          ]
          all_projects.sort_by!(&:id).reverse!

          offset = 2
          limit = 2
          expected_projects = all_projects[offset, limit]

          get :index, params: { format: "json", limit: limit, offset: offset, listAllIds: 1 }

          json_response = JSON.parse(response.body)
          expect(json_response["projects"].count).to eq(expected_projects.count)
          expect(json_response["projects"].pluck("id")).to eq(expected_projects.pluck("id"))
          expect(json_response["all_projects_ids"]).to eq(all_projects.pluck("id"))
        end
      end

      describe "GET index with ascending order" do
        context "when sorting_v0_admin is enabled" do
          it "sees projects sorted in ascending order" do
            @user.add_allowed_feature("sorting_v0_admin")

            expected_projects = []
            expected_projects << create(:project, name: "Project M", users: [@user])
            expected_projects << create(:project, name: "Project Z", users: [@user])
            expected_projects << create(:project, name: "Project A", users: [@user])
            expected_projects.sort_by!(&:name)

            get :index, params: { format: "json", orderBy: "project", orderDir: "asc" }

            json_response = JSON.parse(response.body)
            expect(json_response["projects"].count).to eq(expected_projects.count)
            expect(json_response["projects"].pluck("id")).to eq(expected_projects.pluck("id"))
          end
        end

        context "when sorting_v0 is disabled" do
          it "sees projects sorted in ascending order" do
            expected_projects = []
            expected_projects << create(:project, name: "Project M", users: [@user])
            expected_projects << create(:project, name: "Project Z", users: [@user])
            expected_projects << create(:project, name: "Project A", users: [@user])
            expected_projects.sort_by!(&:id)

            get :index, params: { format: "json", orderBy: "project", orderDir: "asc" }

            json_response = JSON.parse(response.body)
            expect(json_response["projects"].count).to eq(expected_projects.count)
            expect(json_response["projects"].pluck("id")).to eq(expected_projects.pluck("id"))
          end
        end
      end

      describe "GET index with descending order" do
        context "when sorting_v0_admin is enabled" do
          it "sees projects sorted in descending order by name" do
            @user.add_allowed_feature("sorting_v0_admin")

            expected_projects = []
            expected_projects << create(:project, name: "Project M", users: [@user])
            expected_projects << create(:project, name: "Project Z", users: [@user])
            expected_projects << create(:project, name: "Project A", users: [@user])
            expected_projects.sort_by!(&:name).reverse!

            get :index, params: { format: "json", orderBy: "project", orderDir: "desc" }

            json_response = JSON.parse(response.body)
            expect(json_response["projects"].count).to eq(expected_projects.count)
            expect(json_response["projects"].pluck("id")).to eq(expected_projects.pluck("id"))
          end
        end

        context "when sorting_v0 is disabled" do
          it "sees projects sorted in descending order by id" do
            expected_projects = []
            expected_projects << create(:project, name: "Project M", users: [@user])
            expected_projects << create(:project, name: "Project Z", users: [@user])
            expected_projects << create(:project, name: "Project A", users: [@user])
            expected_projects.sort_by!(&:id).reverse!

            get :index, params: { format: "json", orderBy: "project", orderDir: "desc" }

            json_response = JSON.parse(response.body)
            expect(json_response["projects"].count).to eq(expected_projects.count)
            expect(json_response["projects"].pluck("id")).to eq(expected_projects.pluck("id"))
          end
        end
      end

      describe "GET index with malicious order direction field" do
        context "when sorting_v0_admin is enabled" do
          it "sees projects sorted in (default) descending order" do
            @user.add_allowed_feature("sorting_v0_admin")

            # in an exploitable query this would just work
            expected_projects = []
            expected_projects << create(:project, name: "Project M", users: [@user])
            expected_projects << create(:project, name: "Project Z", users: [@user])
            expected_projects << create(:project, name: "Project A", users: [@user])
            expected_projects.sort_by!(&:name).reverse!

            get :index, params: { format: "json", orderBy: "project", orderDir: "asc;" }

            json_response = JSON.parse(response.body)
            expect(json_response["projects"].count).to eq(expected_projects.count)
            expect(json_response["projects"].pluck("id")).to eq(expected_projects.pluck("id"))
          end
        end

        context "when sorting_v0 is disabled" do
          it "sees projects sorted in (default) descending order by id" do
            # in an exploitable query this would just work
            expected_projects = []
            expected_projects << create(:project, name: "Project M", users: [@user])
            expected_projects << create(:project, name: "Project Z", users: [@user])
            expected_projects << create(:project, name: "Project A", users: [@user])
            expected_projects.sort_by!(&:id).reverse!

            get :index, params: { format: "json", orderBy: "project", orderDir: "asc;" }

            json_response = JSON.parse(response.body)
            expect(json_response["projects"].count).to eq(expected_projects.count)
            expect(json_response["projects"].pluck("id")).to eq(expected_projects.pluck("id"))
          end
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
          expect(json_response["projects"].count).to eq(expected_projects.count)
          expect(json_response["projects"].pluck("id")).to contain_exactly(*expected_projects.pluck("id"))
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
          expect(json_response["projects"].count).to eq(1)
          expect(json_response["projects"][0]["id"]).to eq(chosen_project.id)
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
          expect(json_response["projects"].count).to eq(1)
          expect(json_response["projects"][0]["id"]).to eq(chosen_project.id)
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
          expect(json_response["projects"].count).to eq(1)
          expect(json_response["projects"][0]["id"]).to eq(chosen_project.id)
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
          expect(json_response["projects"].count).to eq(1)
          expect(json_response["projects"][0]["id"]).to eq(chosen_project.id)
        end
      end

      ["my_data", "all_data"].each do |domain|
        describe "GET index for #{domain} domain" do
          it "sees all required fields" do
            extra_users = create_list(:user, 2)
            project = create(
              :public_project,
              users: extra_users + [@user],
              creator: @user,
              samples_data: [
                {
                  host_genome_name: "Human",
                  user: extra_users[0],
                  metadata_fields: { collection_location: "San Francisco, USA", sample_type: "Serum" },
                  number_of_cg_workflow_runs: 5,
                  number_of_amr_workflow_runs: 1,
                  number_of_pipeline_runs: 1,
                },
                {
                  host_genome_name: "Mosquito",
                  user: @user,
                  metadata_fields: { collection_location: "San Francisco, USA", sample_type: "Water" },
                  number_of_cg_workflow_runs: 1,
                  number_of_pipeline_runs: 1,
                  number_of_amr_workflow_runs: 1,
                },
              ]
            )
            expected_projects = [project]

            get :index, params: { format: "json", domain: domain }

            json_response = JSON.parse(response.body)
            expect(json_response["projects"].count).to eq(expected_projects.count)
            expect(json_response["projects"].pluck("id")).to eq(expected_projects.pluck("id"))

            response_project = json_response["projects"][0]
            expected_users = (extra_users.as_json + [@user.as_json]).map { |u| u.slice("name", "email") }.sort_by { |u| u["name"] }

            expect(response_project).to include_json(id: expected_projects[0].id,
                                                     name: expected_projects[0].name,
                                                     created_at: expected_projects[0].created_at.as_json,
                                                     public_access: expected_projects[0].public_access,
                                                     sample_counts: {
                                                       number_of_samples: 2,
                                                       mngs_runs_count: 2,
                                                       cg_runs_count: 6,
                                                       amr_runs_count: 2,
                                                     }.as_json,
                                                     hosts: ["Human", "Mosquito"],
                                                     tissues: ["Serum", "Water"],
                                                     locations: ["San Francisco, USA"],
                                                     owner: @user.name,
                                                     editable: true,
                                                     users: expected_users)
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
                                            metadata_fields: { collection_location: "San Francisco, USA", sample_type: "Serum" },
                                          },
                                          {
                                            host_genome_name: "Mosquito",
                                            user: @user,
                                            metadata_fields: { collection_location: "San Francisco, USA", sample_type: "Water" },
                                          },
                                        ])

            get :index, params: { format: "json", domain: domain, basic: true }

            json_response = JSON.parse(response.body)
            expect(json_response["projects"].count).to eq(expected_projects.count)
            expect(json_response["projects"].pluck("id")).to eq(expected_projects.pluck("id"))

            response_project = json_response["projects"][0]

            expect(response_project).to include_json(id: expected_projects[0].id,
                                                     name: expected_projects[0].name,
                                                     created_at: expected_projects[0].created_at.as_json,
                                                     public_access: expected_projects[0].public_access,
                                                     number_of_samples: 2)
            expect(response_project.keys).to contain_exactly("id", "name", "description", "created_at", "public_access", "number_of_samples")
          end

          it "sees private projects when filtering by private visibility" do
            expected_projects = [
              create(:project, :with_sample, users: [@user]),
              create(:project, users: [@user]),
            ]
            create(:public_project, users: [@user])
            create(:public_project, :with_sample, users: [@user])
            expected_projects.reverse! # default order is descending order, but expected projects are ascending

            get :index, params: { format: "json", domain: domain, visibility: "private" }

            json_response = JSON.parse(response.body)
            expect(json_response["projects"].count).to eq(expected_projects.count)
            expect(json_response["projects"].pluck("id")).to eq(expected_projects.pluck("id"))
          end

          it "sees public projects when filtering by public visibility" do
            expected_projects = [
              create(:public_project, users: [@user]),
              create(:public_project, :with_sample, users: [@user]),
            ]
            create(:project, :with_sample, users: [@user])
            expected_projects.reverse! # default order is descending order, but expected projects are ascending

            get :index, params: { format: "json", domain: domain, visibility: "public" }

            json_response = JSON.parse(response.body)
            expect(json_response["projects"].count).to eq(expected_projects.count)
            expect(json_response["projects"].pluck("id")).to eq(expected_projects.pluck("id"))
          end

          it "sees correct projects when filtering by sample_type metadata field" do
            expected_projects = []

            create(:project, users: [@user])
            create(:project, :with_sample, users: [@user])
            expected_projects << create(:project, users: [@user], samples_data: [metadata_fields: { sample_type: "Serum" }])
            create(:project, users: [@user], samples_data: [metadata_fields: { sample_type: "Non-Serum" }])

            get :index, params: { format: "json", domain: domain, tissue: "Serum" }

            json_response = JSON.parse(response.body)
            expect(json_response["projects"].count).to eq(expected_projects.count)
            expect(json_response["projects"].pluck("id")).to eq(expected_projects.pluck("id"))
          end

          it "sees correct projects when filtering by location metadata field" do
            expected_projects = []

            create(:project, users: [@user])
            create(:project, :with_sample, users: [@user])
            expected_projects << create(:project, users: [@user], samples_data: [metadata_fields: { collection_location: "San Francisco, USA" }])
            create(:project, users: [@user], samples_data: [metadata_fields: { collection_location: "Lisbon, Portugal" }])

            get :index, params: { format: "json", domain: domain, location: "San Francisco, USA" }

            json_response = JSON.parse(response.body)
            expect(json_response["projects"].count).to eq(expected_projects.count)
            expect(json_response["projects"].pluck("id")).to eq(expected_projects.pluck("id"))
          end

          it "sees correct projects when filtering by host_genome" do
            expected_projects = []

            create(:project, users: [@user])
            create(:project, :with_sample, users: [@user])
            create(:project, :with_sample, users: [@user], host_genome_name: "pig")
            expected_projects << create(:project, :with_sample, users: [@user], host_genome_name: "Human")

            get :index, params: { format: "json", domain: domain, host: HostGenome.find_by(name: "Human").id }

            json_response = JSON.parse(response.body)
            expect(json_response["projects"].count).to eq(expected_projects.count)
            expect(json_response["projects"].pluck("id")).to eq(expected_projects.pluck("id"))
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
            expect(json_response["projects"].count).to eq(expected_projects.count)
            expect(json_response["projects"].pluck("id")).to eq(expected_projects.pluck("id"))
          end

          it "sees correct projects when filtering by taxon" do
            expected_projects = []
            create(:taxon_lineage, tax_name: "Klebsormidium", taxid: 1)
            create(:taxon_lineage, tax_name: "Klebsiella", taxid: KLEBSIELLA_TAX_ID)

            create(:project, users: [@user])
            create(:project, :with_sample, users: [@user])
            create(:project, users: [@user], samples_data: [{ pipeline_runs_data: [{ taxon_counts_data: [{ taxon_name: "Klebsormidium", nt: 10 }], job_status: "CHECKED" }] }])
            create(:project, users: [@user], samples_data: [{ pipeline_runs_data: [{ taxon_counts_data: [{ taxon_name: "Klebsiella", nt: 0 }], job_status: "CHECKED" }] }])
            expected_projects << create(:project, users: [@user], samples_data: [{ pipeline_runs_data: [{ taxon_counts_data: [{ taxon_name: "Klebsiella", nt: 10 }], job_status: "CHECKED" }] }])

            get :index, params: { format: "json", domain: domain, taxon: KLEBSIELLA_TAX_ID }

            json_response = JSON.parse(response.body)
            expect(json_response["projects"].count).to eq(expected_projects.count)
            expect(json_response["projects"].pluck("id")).to eq(expected_projects.pluck("id"))
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
            expect(json_response["projects"].count).to eq(expected_projects.count)
            expect(json_response["projects"].pluck("id")).to contain_exactly(*expected_projects.pluck("id"))
          end
        end
      end

      describe "POST create to create a project" do
        let(:fake_name) { "Test Name" }
        let(:fake_access) { 0 }
        let(:fake_description) { "Test Description" }
        let(:create_params) do
          { name: fake_name, public_access: fake_access, description: fake_description }
        end

        before do
          create(:app_config, key: AppConfig::DEFAULT_ALIGNMENT_CONFIG_NAME, value: "2021-01-22")
        end

        it "successfully creates a project with provided params" do
          post :create, params: { format: "json", project: create_params }
          expect(response).to have_http_status(:success)

          created = Project.last
          expect(created.name).to eq(fake_name)
          expect(created.public_access).to eq(fake_access)
          expect(created.description).to eq(fake_description)
          expect(created.creator_id).to eq(@user.id)
        end
      end

      describe "GET validate_project_name" do
        before do
          @project_one = create(:project, :with_sample, users: [@joe])
          @project_two = create(:project, :with_sample, users: [@joe])
        end

        it "returns true and sanitized name for a valid project name" do
          unsanitized_name = "test-name!"

          get :validate_project_name, params: {
            format: "json",
            id: @project_one.id,
            name: unsanitized_name,
          }
          expect(response).to have_http_status(:success)

          json_response = JSON.parse(response.body)
          sanitized_name = ProjectsHelper.sanitize_project_name(unsanitized_name)
          expect(json_response).to eq({ "valid" => true, "sanitizedName" => sanitized_name })
        end

        it "returns false, sanitized name, and message for a duplicate project name" do
          get :validate_project_name, params: {
            format: "json",
            id: @project_one.id,
            name: @project_two.name,
          }
          expect(response).to have_http_status(:success)

          json_response = JSON.parse(response.body)
          sanitized_name = ProjectsHelper.sanitize_project_name(@project_two.name)
          expect(json_response).to eq({ "valid" => false, "sanitizedName" => sanitized_name, "message" => "This project name is already taken. Please enter another name." })
        end
      end

      describe "PUT add_user" do
        let(:name_to_add) { "New User" }
        let(:email_to_add) { "new_user_email@example.com" }
        let(:project) { create(:project, :with_sample, users: [@joe]) }

        subject do
          put :add_user, params: {
            id: project.id,
            user_email_to_add: email_to_add,
            user_name_to_add: name_to_add,
          }
        end

        let(:email_message_double) { instance_double(ActionMailer::MessageDelivery) }

        before do
          allow(email_message_double).to receive(:deliver_now)
        end

        context "when email does not exist for a user" do
          before do
            allow(UserFactoryService).to receive(:call).and_call_original

            # stubs for methods in UserFactoryService - due to the logic in the controller
            # we have to avoid creating the user as part of the stub, so unfortunately we need to
            # let the original service run
            allow(MetricUtil).to receive(:post_to_airtable)
            allow(Auth0UserManagementHelper).to receive(:create_auth0_user).and_return(
              { "user_id" => 1 }
            )
            allow(Auth0UserManagementHelper).to receive(:get_auth0_password_reset_token).and_return(
              { "ticket" => "auth0_reset_url" }
            )
            allow(UserMailer).to receive(:new_auth0_user_new_project).and_return(email_message_double)
          end

          context "with AUTO_ACCOUNT_CREATION_V1 disabled" do
            before do
              AppConfigHelper.set_app_config(AppConfig::AUTO_ACCOUNT_CREATION_V1, "")
            end

            it "calls UserFactoryService to create a new user" do
              expect(UserFactoryService).to receive(:call).with(a_collection_including(
                                                                  name: name_to_add,
                                                                  email: email_to_add,
                                                                  profile_form_version: 1,
                                                                  project_id: project.id,
                                                                  send_activation: true,
                                                                  signup_path: User::SIGNUP_PATH[:project]
                                                                ))

              subject
            end
          end

          context "with AUTO_ACCOUNT_CREATION_V1 enabled" do
            before do
              AppConfigHelper.set_app_config(AppConfig::AUTO_ACCOUNT_CREATION_V1, "1")
            end

            it "calls UserFactoryService to create a new user" do
              expect(UserFactoryService).to receive(:call).with(a_collection_including(
                                                                  name: name_to_add,
                                                                  email: email_to_add,
                                                                  project_id: project.id,
                                                                  send_activation: true,
                                                                  signup_path: User::SIGNUP_PATH[:project]
                                                                ))

              subject
            end
          end

          it "sets @user instance variable" do
            subject

            new_user = assigns(:user)
            expect(new_user.id).to eq(User.last.id)
          end
        end

        context "when email is already tied to a user account" do
          let(:email_to_add) { create(:user).email }

          it "sets @user instance variable to existing user" do
            subject

            user_instance_var = assigns(:user)
            expect(user_instance_var.email).to eq(email_to_add)
          end

          context "when user is not in project" do
            it "creates account existing user user" do
              expect(UserMailer).to receive(:added_to_projects_email).and_return(email_message_double)
              expect(email_message_double).to receive(:deliver_now)
              subject
            end

            it "does not call UserFactoryService to create a new user" do
              expect(UserFactoryService).not_to receive(:call)

              subject
            end
          end

          context "when user is already added to project" do
            let(:email_to_add) { @joe.email }

            it "does not email existing user" do
              expect(UserMailer).not_to receive(:added_to_projects_email)

              subject
            end

            it "does not call UserFactoryService to create a new user" do
              expect(UserFactoryService).not_to receive(:call)

              subject
            end
          end
        end
      end

      describe "POST validate_sample_names" do
        before do
          @project = create(:project, :with_sample, users: [@joe])
          create(:sample, project: @project, name: "Test Three", status: Sample::STATUS_CHECKED)
          create(:sample, project: @project, name: "Test Four", status: Sample::STATUS_CHECKED)
        end

        it "adds a number to a sample name that conflicts with a pre-existing sample" do
          post :validate_sample_names, params: {
            format: "json",
            id: @project.id,
            sample_names: ["Test One", "Test Two", "Test Three"],
          }
          expect(response).to have_http_status(:success)

          json_response = JSON.parse(response.body)
          expect(json_response).to eq(["Test One", "Test Two", "Test Three_1"])
        end

        it "adds a number to a sample name that conflicts with a sample name in the list" do
          post :validate_sample_names, params: {
            format: "json",
            id: @project.id,
            sample_names: ["Test One", "Test One", "Test One_1"],
          }
          expect(response).to have_http_status(:success)

          json_response = JSON.parse(response.body)
          expect(json_response).to eq(["Test One", "Test One_1", "Test One_1_1"])
        end

        it "ignores case when resolving sample name conflicts" do
          post :validate_sample_names, params: {
            format: "json",
            id: @project.id,
            sample_names: ["Test four"],
          }
          expect(response).to have_http_status(:success)

          json_response = JSON.parse(response.body)
          expect(json_response).to eq(["Test four_1"])
        end

        it 'validate_sample_names resumable' do
          create(:sample, project: @project, name: "Created", status: Sample::STATUS_CREATED)
          post :validate_sample_names, params: {
            format: "json",
            id: @project.id,
            sample_names: ["Test One", "Test One", "Created", "Test Three"],
            ignore_unuploaded: true,
          }
          expect(response).to have_http_status(:success)

          json_response = JSON.parse(response.body)
          expect(json_response).to eq(["Test One", "Test One_1", "Created", "Test Three_1"])
        end
        it 'ensure default days_to_keep_sample_private is set to FAR_FUTURE_DAYS per sc-227848' do
          project = create(:project, :with_sample, name: "Project", users: [@user])
          expect(project.days_to_keep_sample_private).to eq(ProjectsController::FAR_FUTURE_DAYS)
        end
      end
    end
  end
end

RSpec.describe ProjectsController, type: :request do
  create_users

  before do
    @auth0_management_client_double = double("Auth0Client")
    allow(Auth0UserManagementHelper).to receive(:auth0_management_client).and_return(@auth0_management_client_double)

    @metadata_field_sample_type = create(:metadata_field, name: 'sample_type', display_name: 'sample_type')
    @metadata_field_nucleotide_type = create(:metadata_field, name: 'nucleotide_type', display_name: 'nucleotide_type')

    @project = create(:project)
    @metadata_validation_project = create(:project) # , metadata_fields: ['sample_type', 'nucleotide_type', 'collection_date', 'age', 'admission_date', 'blood_fed', 'reported_sex', 'sex'])
    @joe_project = create(:project, :with_sample, users: [@joe], days_to_keep_sample_private: 365) # , metadata_fields: ['sample_type', 'nucleotide_type', 'age', 'admission_date', 'blood_fed', 'reported_sex', 'sex'])
    @public_project = create(:public_project, :with_sample, days_to_keep_sample_private: 365) # , metadata_fields: [@metadata_field_sample_type, @metadata_field_nucleotide_type])
    @deletable_project = create(:project)
  end

  context 'Admin User' do
    before do
      sign_in_auth0 @admin
      create(:app_config, key: AppConfig::DEFAULT_ALIGNMENT_CONFIG_NAME, value: "2021-01-22")
    end

    it 'should get index' do
      get projects_url
      assert_response :success
    end

    it 'should get new' do
      get new_project_url
      assert_response :success
    end

    it 'should create project' do
      assert_difference('Project.count') do
        post projects_url, params: { project: { name: 'New Project', public_access: 0, description: "New Project" } }
      end

      assert_redirected_to project_url(Project.last)
    end

    it 'should show project' do
      get project_url(@project)
      assert_response :success
    end

    it 'should get edit' do
      get edit_project_url(@project)
      assert_response :success
    end

    it 'should update project' do
      patch project_url(@project), params: { project: { name: @project.name, public_access: 1, description: @project.description } }
      assert_redirected_to project_url(@project)
    end

    it 'should destroy project' do
      assert_difference('Project.count', -1) do
        delete project_url(@deletable_project)
      end

      assert_redirected_to projects_url
    end
  end

  context 'Non Admin User' do
    before do
      sign_in_auth0 @joe
    end

    it 'joe can query the metadata fields that belong to a public project' do
      get metadata_fields_projects_url, params: {
        projectIds: [@public_project.id],
      }
      assert_response :success

      assert_equal @public_project.metadata_fields.pluck('display_name'), @response.parsed_body.pluck("name")
    end

    it 'joe can query the metadata fields that belong to a private project he is a part of' do
      get metadata_fields_projects_url, params: {
        projectIds: [@joe_project.id],
      }
      assert_response :success

      assert_equal @joe_project.metadata_fields.pluck('display_name'), @response.parsed_body.pluck("name")
    end

    it 'joe cannot query the metadata fields that belong to another private project' do
      assert_raises(ActiveRecord::RecordNotFound) do
        get metadata_fields_projects_url, params: {
          projectIds: [@metadata_validation_project.id],
        }
      end
    end

    # If multiple samples, merge the fields.
    it 'joe can query the metadata fields that belong to multiple projects' do
      get metadata_fields_projects_url, params: {
        projectIds: [@public_project.id, @joe_project.id],
      }
      assert_response :success

      assert_equal @joe_project.metadata_fields.pluck('display_name') + @public_project.metadata_fields.pluck('display_name'), @response.parsed_body.pluck("name")
    end

    # If multiple samples but one is invalid, return fields for the valid ones.
    it 'joe can query the metadata fields that belong to multiple projects, and invalid projects will be omitted.' do
      get metadata_fields_projects_url, params: {
        projectIds: [@public_project.id, @metadata_validation_project.id],
      }
      assert_response :success

      assert_equal @public_project.metadata_fields.pluck('display_name'), @response.parsed_body.pluck("name")
    end
  end
end
