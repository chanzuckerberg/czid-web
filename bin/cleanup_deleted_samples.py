#!/usr/bin/env python
import os
import boto3

ENV = 'staging'
DB_SAMPLES_FILENAME = '/tmp/{env}_db_sample_ids'.format(env=ENV)
S3_SAMPLES_FILENAME = '/tmp/{env}_s3_sample_paths'.format(env=ENV)

def fetch_sample_ids():
  print('Fetching ids from idseq_{env}.samples table'.format(env=ENV))
  os.system('bin/clam {env} \'echo "select id from samples;" > samples.sql; mysql -h $RDS_ADDRESS -u $DB_USERNAME --password=$DB_PASSWORD idseq_{env} < samples.sql; rm samples.sql\' > {outfile}'.format(outfile=DB_SAMPLES_FILENAME, env=ENV))

def fetch_s3_paths():
  print('Fetching sample paths under s3://idseq-samples-{env}'.format(env=ENV))
  os.system('for dir in `aws s3 ls s3://idseq-samples-{env}/samples/ | awk \'{{print $2}}\'`; do aws s3 ls s3://idseq-samples-{env}/samples/$dir | awk -v dir=$dir \'{{print dir $2}}\'; done > {outfile}'.format(outfile = S3_SAMPLES_FILENAME, env=ENV))
  
def db_sample_dict():
  return_dict = {}
  db_samples_file = open(DB_SAMPLES_FILENAME, 'r')
  line = db_samples_file.readline() # first line says 'id'
  while True:
    line = db_samples_file.readline().strip()
    if not line:
      break
    return_dict[line] = 1
  return return_dict

def delete_unknown_samples():
  s3 = boto3.resource('s3')
  pd = db_sample_dict()
  bucket='idseq-samples-{env}'.format(env=ENV)
  s3_samples_file = open(S3_SAMPLES_FILENAME, 'r')
  while True:
    line = s3_samples_file.readline()
    if not line:
      break
    sample_id = line.split('/')[1]
    if sample_id not in pd:
      subpath = line.strip()
      print('Deleting data under: {subpath}'.format(subpath=subpath))
      resp = s3.meta.client.list_object_versions(
          Bucket=bucket,
          Prefix='samples/{subpath}'.format(subpath=subpath))
      objects_to_delete = resp.get('Versions', [])
      if len(objects_to_delete) > 0:
        delete_keys = {'Objects' : []}
        for item in objects_to_delete:
          delete_keys['Objects'].append({'Key': item['Key'], 'VersionId': item['VersionId']})
        s3.meta.client.delete_objects(Bucket=bucket, Delete=delete_keys)
   
if __name__ == "__main__":
  msg = 'This utility will delete all s3 sample data without db entries in the {env} environment. Type "y" or "yes" to continue.\n'.format(env=ENV)
  resp = input(msg)
  if resp.lower() not in ["y", "yes"]:
    print("Exiting...")
    quit()
  fetch_sample_ids()
  fetch_s3_paths()
  delete_unknown_samples()
