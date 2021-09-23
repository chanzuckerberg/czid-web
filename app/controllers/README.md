### Expected layout in a controller

Use this ordering, if you can, for everything at the top of the controller files and then the function definitions. This doesn't mean you should have everything below, just the ordering if you have them.

```ruby
class WidgetsController < ApplicationController
  # extend and include go first
  extend SomeModule
  include AnotherModule

  # inner classes
  CustomError = Class.new(StandardError)

  # constants are next
  COLORS = %w(red green blue)

  # next we have callbacks
  before_action :cook
  around_action :instrument_with_timer

  # other macros should be placed after the callbacks

  # public instance methods are next in line
  def some_method
  end

  # private methods are grouped at the bottom
  private

  def widget_params
    params.require(:widget).permit(:name, :category)
  end
end
```

Inspired by:

- https://rails.rubystyle.guide/#macro-style-methods
- https://www.rubydoc.info/gems/rubocop/RuboCop/Cop/Layout/ClassStructure

### Powers

Consider using `require_power_check` on new controllers to ensure that a power is always checked. For example, even unrestricted models could return `Model.all`.

```ruby
class NotesController < ActionController::Base
  include Consul::Controller
  require_power_check
end
```

You can map powers to different controller actions.

Examples:

```ruby
class NotesController < ApplicationController
  power :notes, :map => {
    [:edit, :update] => :updatable_notes,
    [:new, :create] => :creatable_notes,
    [:destroy] => :destroyable_notes
  }, :as => :note_scope
end

class SamplesController < ApplicationController
  EDIT_ACTIONS = [...]
  power :samples, map: { EDIT_ACTIONS => :updatable_samples }, as: :samples_scope
end
```

- More info: https://github.com/makandra/consul
