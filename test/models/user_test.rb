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

    user.name = "foo'bar"
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
    assert_not user.valid?
  end

  test "CZI user detected" do
    user = new_user "test@chanzuckerberg.com"
    assert user.czi_user?

    user = new_user "test@contractor.chanzuckerberg.com"
    assert user.czi_user?

    user = new_user "test@test.com"
    assert_not user.czi_user?

    user = new_user "test@fakechanzuckerberg.com"
    assert_not user.czi_user?
  end

  private

  def new_user(email = "test@test.com")
    User.new(email: email)
  end
end
