module GraphqlAuthHelpers
  def current_user_is_logged_in?(context)
    current_user = context.current_user
    !!current_user
  end

  def current_user_is_admin?(context)
    current_user = context.current_user
    !!current_user && current_user.admin?
  end
end
