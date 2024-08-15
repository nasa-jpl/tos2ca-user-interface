<?php

require '/data/code/user-interface/aws.phar';

$key = $_GET['key'];

if (count($_GET) > 1)
{
  header('X-Error-Message: The site is unavailable', true, 500);
  die;
}

if (!preg_match ("/.png/", $key))
{
  header('X-Error-Message: The site is unavailable', true, 500);
  die;
}

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

