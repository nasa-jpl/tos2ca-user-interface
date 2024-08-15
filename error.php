<!DOCTYPE html>
<html lang="en" >

<head>
  <title>Error 404 Page</title>

<?php

if (count($_GET) !== 0 && count($_GET) !== 3)
{
  header("HTTP/1.0 404 Not Found");
  die;
}

?>

</head>

<body translate="no" >
  <h1>404 Not Found</h1>
  <br />
  The page that you have requested could not be found
</body>

</html>

