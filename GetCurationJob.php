<?php

  require_once('JdbcUtility.php');
  require_once('common.php');

  $jobID = $_POST['jobID'];
  
  argumentCountValidate($_POST, 1);
  jobIDValidate($jobID);

  $sql = "select jobID, phdefJobID, stage, dataset, variable, ineqOperator, ineqValue, startDate, endDate  from jobs where jobID=?";
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

