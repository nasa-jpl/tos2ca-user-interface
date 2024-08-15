<?php

  require_once('common.php');

  $mypath = '/data/code/data-dictionaries/';

  $key = $_GET['key']; 
  $key = myDecrypt($key);

  argumentCountValidate($_GET, 1);
  dictionaryCheck($key);

  $fname = basename($key);
  $location = $mypath . $fname;
  $txt = file_get_contents($location);
  echo($txt);

?>

