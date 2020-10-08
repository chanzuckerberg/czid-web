# Provides Async Callbacks for Elasticsearch Syncing
module ElasticsearchCallbacksHelper
  # WARNING: using this with a model means you must ensure activerecord
  #  callbacks are called on all updates. This module updates elasticsearch
  #  using these callbacks. If you must circumvent them somehow (eg. using raw
  #  SQL or bulk_import) you must explicitly update elasticsearch appropriately.

  def self.included(base)
    return unless base.ancestors.include?(::ActiveRecord::Base)

    base.class_eval do
      after_commit -> { async_elasticsearch_index }, on: :create
      after_commit -> { async_elasticsearch_index }, on: :update
      after_commit -> { async_elasticsearch_delete }, on: :destroy
    end
  end

  def async_elasticsearch_index
    Resque.enqueue(
      ElasticsearchIndex,
      :index,
      __elasticsearch__.index_name,
      __elasticsearch__.document_type,
      id,
      __elasticsearch__.as_indexed_json
    )
  end

  def async_elasticsearch_delete
    Resque.enqueue(
      ElasticsearchIndex,
      :delete,
      __elasticsearch__.index_name,
      __elasticsearch__.document_type,
      id,
      __elasticsearch__.as_indexed_json
    )
  end
end
