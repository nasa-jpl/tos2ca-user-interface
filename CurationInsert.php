<?php

  require_once('JdbcUtility.php');
  require_once('common.php');

  $phdefJobID = $_POST['phdefJobID'];
  $userID = $_POST['userID'];
  $stage = $_POST['stage'];
  $dataset = $_POST['dataset'];
  $stat = $_POST['stat'];
  $variable = $_POST['variable'];
  $desc = $_POST['desc'];


  argumentCountValidate($_POST, 7);
  jobIDValidate($phdefJobID);
  jobIDValidate($userID);
  stageCheck($stage);
  specialCharacterCheck($dataset);
  statusCheck($stat);
  specialCharacterCheck($variable);
  descriptionCheck($desc);

  $sql = "";
  $param = array();
  if ($desc == "")
  {
    $sql = "INSERT INTO jobs (userID, stage, phdefJobID, dataset, variable, status) VALUES (?, ?, ?, ?, ?, ?)";
    $param = array('isisss', &$userID, &$stage, &$phdefJobID, &$dataset, &$variable, &$stat);
  }
  else
  {
    $sql = "INSERT INTO jobs (userID, stage, phdefJobID, dataset, variable, status, description) VALUES (?, ?, ?, ?, ?, ?, ?)";
    $param = array('isissss', &$userID, &$stage, &$phdefJobID, &$dataset, &$variable, &$stat, &$desc);
  }

  $affected_rows = executeSQL($sql, $param);
  echo($affected_rows);

?>
