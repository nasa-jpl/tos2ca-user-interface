<?php

  require_once('JdbcUtility.php');
  require_once('common.php');

  $params = $_POST['params'];
  $desc = $_POST['desc'];
 

  argumentCountValidate($_POST, 2);

  $arr = explode(";", $params);
  $userID = $arr[0];
  $stage = $arr[1];
  $dataset = $arr[2];
  $variable = $arr[3];
  $polygon = $arr[4];
  $startDate = $arr[5];
  $endDate = $arr[6];
  $ineqOperator = $arr[7];
  $ineqValue = $arr[8];
  $status = $arr[9];


  jobIDValidate($userID);
  stageCheck($stage);
  specialCharacterCheck($dataset);
  specialCharacterCheck($variable);
  coordinateCheck($polygon);
  timeTagValidate($startDate); //2024-07-18 00:00:00
  timeTagValidate($endDate); //2024-07-18 00:00:00
  ineqOperatorCheck($ineqOperator);
  jobIDValidate($ineqValue);  //number only
  statusCheck($status);
  descriptionCheck($desc);

  $sql = "";
  $param = array();
  if ($desc == "")
  {
    $sql = "INSERT INTO jobs (userID, stage, dataset, variable, coords, startDate, endDate, ineqOperator, ineqValue, status) VALUES (?, ?, ?, ?, ST_PolygonFromText(?), ?, ?, ?, ?, ?)";
    $param = array('isssssssss', &$userID, &$stage, &$dataset, &$variable, &$polygon, &$startDate, &$endDate, &$ineqOperator, &$ineqValue, &$status);
  }
  else
  {
    $sql = "INSERT INTO jobs (userID, stage, dataset, variable, coords, startDate, endDate, ineqOperator, ineqValue, status, description) VALUES (?, ?, ?, ?, ST_PolygonFromText(?), ?, ?, ?, ?, ?, ?)";
    $param = array('issssssssss', &$userID, &$stage, &$dataset, &$variable, &$polygon, &$startDate, &$endDate, &$ineqOperator, &$ineqValue, &$status, &$desc);
  }

  $affected_rows = executeSQL($sql, $param);
  echo($affected_rows);

?>
