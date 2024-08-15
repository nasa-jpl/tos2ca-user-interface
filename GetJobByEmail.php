<?php

  require_once('JdbcUtility.php');
  require_once('common.php');

  $email = $_POST['email']; 
  
  argumentCountValidate($_POST, 1);
  emailValidate($email);

  $sql = "select j.jobID, j.stage, j.phdefJobID, j.dataset, j.variable, j.startDate, j.endDate, j.ineqOperator, j.ineqValue, TRIM(REPLACE(REPLACE(j.description, CHAR(13), ''), CHAR(10), '')) as description, j.status, j.submitTime, ST_AsText(coords) from jobs j where j.jobID IN (select j.jobID from users u, jobs j where (u.email = ?) and (j.userId = u.userID)) order by j.jobID DESC";
  $param = array('s', &$email);
  $result = getSQLResultP($sql, $param);

  $jstr = '[ ';
  if (count($result) > 0)
  {
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
  }
  $jstr .= ' ]'; 
  echo($jstr);

?>

