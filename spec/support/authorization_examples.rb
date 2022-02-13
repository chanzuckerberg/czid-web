shared_examples "admin_required_endpoint" do
  context "when not signed in" do
    it "redirects to root_path" do
      expect(subject).to redirect_to(new_user_session_url)
    end
  end

  context "when signed in with a regular user" do
    before do
      sign_in @joe
    end

    it "redirects to root_path" do
      expect(subject).to redirect_to(root_path)
    end
  end

  context "when signed inwith an admin user" do
    before do
      sign_in @admin
    end

    it "does not redirect to root_path" do
      subject
      expect(subject).not_to redirect_to(root_path)
    end
  end
end

shared_examples "login_required_endpoint" do
  context "when not signed in" do
    it "redirects to root_path" do
      expect(subject).to redirect_to(new_user_session_url)
    end
  end

  context "when signed in with a user" do
    before do
      sign_in @joe
    end

    it "does not redirect to root_path" do
      subject
      expect(subject).not_to redirect_to(root_path)
    end
  end
end
