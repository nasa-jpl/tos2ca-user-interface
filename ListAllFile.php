<?php

require '/data/code/user-interface/aws.phar';

$s3 = new Aws\S3\S3Client([
  'region' => 'us-west-2',
  'version' => 'latest'
]);

$bucket_name = 'tos2ca-dev1';

try 
{
  $contents = $s3->listObjectsV2([
    'Bucket' => $bucket_name
  ]);
  foreach ($contents['Contents'] as $content)
  {
    echo($content['Key'] . "<br>");
  }
} 
catch (Exception $exception) 
{
  echo($exception);
}

?>

