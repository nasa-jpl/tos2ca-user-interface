<?php

  require_once('JdbcUtility.php');
  require_once('common.php');

  $jobID = $_POST['jobID'];

  argumentCountValidate($_POST, 1);
  jobIDValidate($jobID);


  $sql = "SELECT * from jobs WHERE JobID=? and stage='phdef'";
  $param = array('i', &$jobID);
  $result = getSQLResultP($sql, $param);
  $count = count($result)-0;

  if ($count === 0)
    echo("0");
  else
    echo("1");

?>

