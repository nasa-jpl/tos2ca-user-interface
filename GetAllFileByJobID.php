<?php

require '/data/code/user-interface/aws.phar';

$jobID = (string)$_GET['jobID'];


if (count($_GET) > 1)
{
  header('X-Error-Message: The site is unavailable', true, 500);
  die;
}

if (!preg_match("/^[0-9]*$/",$jobID))
{
  header('X-Error-Message: The site is unavailable', true, 500);
  die;
}

$s3 = new Aws\S3\S3Client([
  'region' => 'us-west-2',
  'version' => 'latest'
]);
$bucket_name = 'tos2ca-dev1';

$arr = [];
try 
{
  $contents = $s3->listObjectsV2([
    'Bucket' => $bucket_name,
    'Prefix' => $jobID
  ]);
  foreach ($contents['Contents'] as $content) 
  {
    $b = isGoodFile($content['Key'], $jobID);
    if ($b)
    {
      $arr[] = $content['Key'];
    }
  }
} 
catch (Exception $exception) 
{

  $arr = [];
}

function isGoodFile($file, $jobID)
{
  $s = strpos($file, $jobID);
  $json = strpos($file, ".json");
  if ($s === 0 && $json !== false)
  {
    return true;
  }
  return false;
}

echo(implode(";", $arr));

?>

