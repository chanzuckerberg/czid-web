# # Fixes 'ArgumentError: unknown firstpos: NilClass' for development.

# See: https://stackoverflow.com/questions/44465118/rails-5-1-unknown-firstpos-nilclass-issue-reloading-application
# Fixed in a later version of Rails with: https://github.com/rails/rails/pull/33118

if Rails.env == 'development'
  module ActionDispatch
    module Journey
      class Routes
        def simulator
          @simulator ||= begin
            gtg = GTG::Builder.new(ast).transition_table if ast.present?
            GTG::Simulator.new(gtg)
          end
        end
      end
    end
  end
end
