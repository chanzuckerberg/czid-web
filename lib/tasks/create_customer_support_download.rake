task create_customer_support_download: :environment do
  ### This is a utility that serves as a kind of "customer support dropbox".
  ### The task will create a BulkDownload record that the user can use to download a file you wish to transfer to them.
  ### The task will print instructions on the S3 location where you should put the file you have created for the user offline.
  ### Usage: USER_ID=<int> DOWNLOAD_NAME='my_custom_download_name' rake create_customer_support_download

  user_id = ENV['USER_ID'].to_i
  download_name = ENV['DOWNLOAD_NAME']

  user = User.find(user_id)
  puts "Is this the user you wish to send your file to? #{user.name}, #{user.email}"
  puts "If not, please start over."

  bulk_download = BulkDownload.create(download_type: "customer_support_request",
                                      status: BulkDownload::STATUS_SUCCESS,
                                      user_id: user.id)
  puts "BulkDownload record of type customer_support_request has been created."
  puts "Please upload the file you wish to transfer to the following URI:"
  puts "#{ENV['SAMPLES_BUCKET_NAME']}/#{bulk_download.download_output_key}"
  puts "Once you have done that, you can notify the user that the file is available on the Dwnloads page."
Please

end
