<?php

  require_once('JdbcUtility.php');
  require_once('common.php');

  $userID = $_GET['userID'];
  $stage = $_GET['stage'];
  $dataset = $_GET['dataset'];
  $variable = $_GET['variable'];
  $polygon = $_GET['polygon'];
  $startDate = $_GET['startDate'];
  $endDate = $_GET['endDate'];
  $ineqOperator = $_GET['ineqOperator'];
  $ineqValue = $_GET['ineqValue'];
  $status = $_GET['status'];
  $desc = $_GET['desc'];
  $algorithm = $_GET['algorithm'];
  $warmerToggle = $_GET['warmerToggle'];
  $warmerThreshold = $_GET['warmerThreshold'];


  //validate url
  //checkURL(parse_url($_SERVER['REQUEST_URI']));

  //validate input
  argumentCountValidate($_GET, 14);

  jobIDValidate($userID);
  stageCheck($stage);
  specialCharacterCheck($dataset);
  specialCharacterCheck($variable);
  coordinateCheck($polygon);
  timeTagValidate($startDate); //2024-07-18 00:00:00
  timeTagValidate($endDate); //2024-07-18 00:00:00
  ineqOperatorCheck($ineqOperator);
  numberCheck($ineqValue);  //number only
  statusCheck($status);
  descriptionCheck($desc);
  specialCharacterCheck($algorithm);
  if ($algorithm == 'auxgeoir' && $warmerToggle == 'on') {
    numberCheck($warmerThreshold); //number only
    specialCharacterCheck($warmerToggle);
  } elseif ($algorithm == 'auxgeoir' && $warmerToggle == 'off') {
    nullValidate($warmerThreshold); //number only
    $warmerThreshold = NULL;
  } else {
    nullValidate($warmerThreshold);
    $warmerThreshold = NULL;
    nullValidate($warmerToggle);
    $warmerToggle = NULL;
  }

  $sql = "INSERT INTO jobs (userID, stage, dataset, variable, coords, startDate, endDate, ineqOperator, ineqValue, status, description, algorithm, warmerToggle, warmerValue) VALUES (?, ?, ?, ?, ST_PolygonFromText(?), ?, ?, ?, ?, ?, ?, ?, ?, ?)";
  $param = array('issssssssssssi', &$userID, &$stage, &$dataset, &$variable, &$polygon, &$startDate, &$endDate, &$ineqOperator, &$ineqValue, &$status, &$desc, &$algorithm, &$warmerToggle, &$warmerThreshold);
  $affected_rows = executeSQL($sql, $param);
  echo($affected_rows);

?>
