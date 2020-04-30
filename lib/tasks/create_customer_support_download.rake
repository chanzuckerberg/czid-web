task create_customer_support_download: :environment do
  ### This is a utility that serves as a kind of "customer support dropbox".
  ### The task will create a BulkDownload record that the user can use to download a file you wish to transfer to them.
  ### The task will print instructions on the S3 location where you should put the file you have created for the user.
  ### Usage: DESTINATION_USER_ID=<int> rake create_customer_support_download

  user_id = ENV['DESTINATION_USER_ID'].to_i

  user = User.find(user_id)
  is_user_correct = await_confirmation("Is #{user.name} (#{user.email}) the user you wish to send your file to?",
                                       "Please verify your DESTINATION_USER_ID and start over")
  exit 2 unless is_user_correct

  puts "Please enter a user-facing description of the file you wish to transfer:"
  description = ActionController::Base.helpers.strip_tags(STDIN.gets.strip)

  bulk_download = BulkDownload.create(download_type: "customer_support_request",
                                      status: BulkDownload::STATUS_WAITING,
                                      description: description,
                                      user_id: user.id)
  puts "BulkDownload record of type customer_support_request has been created."
  s3_uri = "s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{bulk_download.download_output_key}"
  puts "Please upload the file you wish to transfer to '#{s3_uri}' using a command like:"
  puts "\n  aws s3 cp <your file> '#{s3_uri}'"
  puts "\n(Note the quotes around the destination path to take care of spaces in the destination file name.)"
  is_file_uploaded = await_confirmation("Have you uploaded your file? Please confirm once you're ready",
                                        "Process aborted, deleting the draft BulkDownload")
  unless is_file_uploaded
    bulk_download.destroy
    exit 2
  end

  begin
    bulk_download.mark_success
    puts "Success! You can now notify the user that the file is available on their Downloads page."
  rescue
    bulk_download.destroy
    puts "There was an issue with finding your file and finalizing the BulkDownload."
    puts "Please make sure you correctly uploaded the file to S3 and start over."
    exit 2
  end
end

def await_confirmation(prompt, deny_message)
  puts prompt + " [y/N]"
  input = STDIN.gets.strip
  is_confirmed = (input == "y")
  puts deny_message unless is_confirmed
  is_confirmed
end
