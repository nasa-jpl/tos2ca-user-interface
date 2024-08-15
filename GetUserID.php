<?php

  require_once('JdbcUtility.php');
  require_once('common.php');

  $last  = $_POST['last'];
  $first = $_POST['first'];
  $email = $_POST['email'];

  argumentCountValidate($_POST, 3);
  nameCheck($last);
  nameCheck($first);
  emailCheck($email);
  
  $userID = -1;
  
  $sql = "select userID, lastName, firstName, email from users where email=lower(?)";
  $param = array('s', &$email);
  $result = getSQLResultP($sql, $param);
  if (count($result) > 0)
  {
    $row = $result[0]; 
    $userID = $row["userID"];
  } 
  else
  {

    $sql = "insert into users (lastName, firstName, email) values (?, ?, ?)";
    $param = array('sss', &$last, &$first, &$email);
    $result = executeSQL($sql, $param);

    $sql = "select userID, lastName, firstName, email from users where email=lower(?)";
    $param = array('s', &$email);
    $result = getSQLResultP($sql, $param);
    if (count($result) > 0)
    {
      $row = $result[0]; 
      $userID = $row["userID"];
    } 
  }

  $encrypted = myCrypt($userID);
  echo $encrypted;

?>

