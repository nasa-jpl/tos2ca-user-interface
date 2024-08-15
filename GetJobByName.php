<?php

  require_once('JdbcUtility.php');
  require_once('common.php');

  $firstname = strtoupper($_POST['firstname']);
  $lastname = strtoupper($_POST['lastname']);
  
  argumentCountValidate($_POST, 2);
  nameCheck($firstname);
  nameCheck($lastname);

  $sql = "select j.jobID, j.stage, j.phdefJobID, j.dataset, j.variable, j.startDate, j.endDate, j.ineqOperator, j.ineqValue, TRIM(REPLACE(REPLACE(j.description, CHAR(13), ''), CHAR(10), '')) as description, j.status, j.submitTime, ST_AsText(coords) from jobs j where j.jobID IN (select j.jobID from users u, jobs j where (UPPER(u.firstname) = ? and UPPER(u.lastname) = ?) and (j.userId = u.userID)) order by j.jobID";
  $param = array('ss', &$firstname, &$lastname);
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

