<?php

header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");

require '/data/code/user-interface/aws.phar';

$key = $_GET['key'];


$s3 = new Aws\S3\S3Client([
  'region' => 'us-west-2',
  'version' => 'latest'
]);

$result = $s3->getObject([
  'Bucket' => 'tos2ca-dev1',
  'Key' => $key 
]);

echo $result['Body'];

?>

