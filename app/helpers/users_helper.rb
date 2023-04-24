module UsersHelper
  def self.generate_random_password
    # "aA1!" and 'squeeze' for no repeats to always satisfy complexity policy.
    (SecureRandom.base64(15) + "aA1!").squeeze
  end

  def self.send_profile_form_to_airtable(user, params)
    # TODO: replace this with the actual table name
    table_name = "TEST - CZ ID User Profiles"
    data = {
      fields: {
        user_id: user.id,
        admin: user.admin?,
        email: params[:email] || user.email || "",
        date_created: user.created_at.strftime("%Y-%m-%d"),
        quarter_year: calculate_quarter_year,
        survey_version: params[:profile_form_version] || "",
        first_name: params[:first_name] || user.first_name || "",
        last_name: params[:last_name] || user.last_name || "",
        ror_institution: params[:ror_institution] || "",
        ror_id: params[:ror_id] || "",
        country: params[:country] || "",
        world_bank_income: params[:world_bank_income] || "",
        czid_usecase: params[:czid_usecase] || [],
        expertise_level: params[:expertise_level] || "",
        referral_source: params[:referral_source] || [],
      },
      typecast: true, # enables us to send new options for multiselect fields (e.g. "Other: <free text>" for Referral Source)
    }
    MetricUtil.post_to_airtable(table_name, data.to_json)
  end

  def self.calculate_quarter_year
    year = Time.zone.today.year
    quarter = (Time.zone.today.month / 3.0).ceil
    return "Q#{quarter} #{year}"
  end
end
