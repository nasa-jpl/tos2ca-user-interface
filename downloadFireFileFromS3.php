<?php

  require '/data/code/user-interface/aws.phar';
  require 'common.php';

  $key = $_GET['key'];
  $key = myDecrypt($key);
  //echo("$key<br>");

  argumentCountValidate($_GET, 1);
  fireFilenameCheck($key);

  $s3 = new Aws\S3\S3Client([
    'region' => 'us-west-2',
    'version' => 'latest'
  ]);

  $object = $s3->getObject(array(
    'Bucket' => 'tos2ca-dev1',
    'Key' => $key,
  ));

  $i = strrpos($key, "/");
  $filename = substr($key, $i+1);
  //echo("$key<br>");

  $il1_filename = utf8_decode($filename);
  $to_underscore = "\"\\#*;:|<>/?";
  $safe_filename = strtr($il1_filename, $to_underscore, str_repeat("_", strlen($to_underscore)));
  $filename = $safe_filename . ( $safe_filename === $filename ? "" : "; filename*=UTF-8''".rawurlencode($filename) );

  header('Content-Description: File Transfer');
  header('Content-Type: ' . $object["ContentType"]);
  header('Content-Type: binary\/octet-stream');
  header('Content-Disposition: attachment; filename=' . $filename);
  header('Expires: 0');
  header('Cache-Control: must-revalidate');
  header('Pragma: public');
  ob_clean();
  echo($object["Body"]);
?>
