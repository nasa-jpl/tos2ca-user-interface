<?php

  require_once('JdbcUtility.php');
  require_once('common.php');

  $jobID = $_POST['jobID'];
  
  argumentCountValidate($_POST, 1);
  jobIDValidate($jobID);


  $sql = "select j.jobID, j.stage, j.phdefJobID, j.dataset, j.variable, j.startDate, j.endDate, j.ineqOperator, j.ineqValue, j.description, j.status, j.submitTime, ST_AsText(coords) from jobs j where j.phdefJobID = ?";
  $param = array('i', &$jobID);
  $result = getSQLResultP($sql, $param);

  $jstr = '[ ';
  foreach ($result as $row) 
  {

    if ($jstr !== "[ ")
      $jstr .= ', ';

    $s = "{";
    foreach ($row as $key => $value) {
      if ($s !== "{")
        $s .= ', ';
      $s .= '"' . $key . '":"' . $value . '"';
    }
    $s .= '}';

    $jstr .= $s;
  }
  $jstr .= ' ]'; 
  echo($jstr);
?>

