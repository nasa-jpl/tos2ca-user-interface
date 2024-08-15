<?php

  require_once('JdbcUtility.php');
  require_once('common.php');

  $jobID = $_GET['jobID'];

  argumentCountValidate($_GET, 1);
  jobIDValidate($jobID);

  $sql = "select j.dataset, j.variable, j.description, j.startDate, j.endDate, j.ineqOperator, j.ineqValue, j.phdefJobID, ST_AsText(j.coords) as coords, u.lastName, u.firstName, u.email from jobs j, users u where j.jobID=? and j.userID = u.userID";
  $param = array('i', &$jobID);
  $result = getSQLResultP($sql, $param);

  $s = "";
  if (count($result) > 0)
  {
    $s = "{";
    $row = $result[0];
    foreach ($row as $key => $value) {
      if ($s !== "{")
        $s .= ', '; 
      $s .= '"' . $key . '":"' . $value . '"'; 
    }
    $s .= '}'; 
  } 
  echo($s);
?>

