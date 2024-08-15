<?php

require '/data/code/user-interface/aws.phar';
require 'common.php';

$key = $_GET['key'];

argumentCountValidate($_GET, 1);
fireFilenameCheck($key);

//S3 connection 
$s3 = new Aws\S3\S3Client([
  'region' => 'us-west-2',
  'version' => 'latest'
]);

$i = strrpos($key, "/");
$filename = substr($key, $i+1);

$il1_filename = utf8_decode($filename);
$to_underscore = "\"\\#*;:|<>/?";
$safe_filename = strtr($il1_filename, $to_underscore, str_repeat("_", strlen($to_underscore)));
$filename = $safe_filename . ( $safe_filename === $filename ? "" : "; filename*=UTF-8''".rawurlencode($filename) );

$command = $s3->getCommand('GetObject', array(
  'Bucket'      => 'tos2ca-dev1',
  'Key'         => $key,
  'ContentType' => 'image/png',
  'ResponseContentDisposition' => 'attachment; filename="' . clean($filename) . '"'
));

$signedUrl = $s3->createPresignedRequest($command, "+6 days"); 
$presignedUrl = (string)$signedUrl->getUri();

echo '<!DOCTYPE html>
<html>
<body>
<table>
<tr>
<td>
<img src="'.$presignedUrl.'" alt="mask plot" width="500" height="600">
</td>
</tr>
<tr>
<td>
<button style="position: absolute; left: 50%; transform: translateX(-50%);" onclick="self.close()">Close</button>
</td>
</tr>
</table>
</body>
</html>
';

?>
