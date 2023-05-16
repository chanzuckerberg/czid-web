class AddSaltToUsers < ActiveRecord::Migration[6.1]
  def up
    add_column :users, :salt, :string, limit: 24, unique: true
    
    User.all.each do |user|
        user.salt = SecureRandom.base58(24)
        user.save!
    end

    remove_column :users, :authentication_token_encrypted
  end

  def down
    add_column :users, :authentication_token_encrypted, :binary, limit: 48, unique: true
    # Note 2023-05-15: Commented out the code referencing methods of User 
    # that are no longer present, throwing an exception in CI testing.
    
    # def encrypt_token(data)
    #   cipher = OpenSSL::Cipher::AES256.new(:CBC).encrypt
    #   cipher.key = Base64.decode64(ENV["AUTH_TOKEN_SECRET"])
    #   iv = cipher.random_iv
    #   cipher.update(data) + cipher.final + iv
    # end

    # User.all.each do |user|
    #   user.authentication_token_encrypted = encrypt_token(SecureRandom.base58(24))
    # end

    remove_column :users, :salt
  end
end
