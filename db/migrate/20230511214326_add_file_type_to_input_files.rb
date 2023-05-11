class AddFileTypeToInputFiles < ActiveRecord::Migration[6.1]
  def change
    add_column :input_files, :file_type, :string, comment: "Type of input file (e.g. sample FASTQ, primer bed file, etc.)"
  end
end
