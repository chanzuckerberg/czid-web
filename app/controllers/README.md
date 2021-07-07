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
