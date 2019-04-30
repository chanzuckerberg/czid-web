require 'test_helper'

class UserTest < ActiveSupport::TestCase
  test "user name validates" do
    user = new_user

    user.name = "foobar"
    assert user.valid?

    user.name = "foo bar"
    assert user.valid?

    user.name = "Foo Bar"
    assert user.valid?

    user.name = "foo-bar"
    assert user.valid?
  end

  test "user name special chars allowed" do
    user = new_user

    user.name = "fé bår"
    assert user.valid?

    user.name = "Yazín Hernández"
    assert user.valid?
  end

  test "user name numbers not allowed" do
    user = new_user

    user.name = "1234 abcd"
    assert !user.valid?
  end

  private

  def new_user
    User.new(email: "test@test.com", password: "password123")
  end
end
