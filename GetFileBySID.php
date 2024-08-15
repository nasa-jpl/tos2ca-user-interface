<?php

  require_once('JdbcUtility.php');
  require_once('common.php');

  $sID = $_POST['sID'];

  $sID = 21441;

  jobIDValidate($sID);

  $sql = "SELECT * from predefinedOutput WHERE sid=?";
  $param = array('i', &$sID);
  $result = getSQLResultP($sql, $param);

  $json = json_encode($result);
  echo($json);

?>

