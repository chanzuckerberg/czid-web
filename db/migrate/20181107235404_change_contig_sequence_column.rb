class ChangeContigSequenceColumn < ActiveRecord::Migration[5.1]
  def change
    change_column :contigs, :sequence, :text, limit: 4_294_967_295
  end
end
