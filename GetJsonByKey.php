<?php

require 'aws.phar';

$key = $_GET['key'];

if (count($_GET) > 1)
{
  header('X-Error-Message: The site is unavailable', true, 500);
  die;
}

if (!preg_match ("/.json/", $key))
{
  header('X-Error-Message: The site is unavailable', true, 500);
  die;
}

$s3 = new Aws\S3\S3Client([
  'region' => 'us-west-2',
  'version' => 'latest'
]);

$result = $s3->getObject([
  'Bucket' => 'your-bucket-name',
  'Key' => $key 
]);

echo $result['Body'];

?>

