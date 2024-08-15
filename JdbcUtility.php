<?php

function getSQLResult($sql)
{
  include('../private/config.php');

  $product = [];

  //Connect to MySQL Server
  $conn = new mysqli($server, $webuser, $webpass, $dbname);
  if ($conn->connect_error)
  {
    echo "Connected failed <br>";
    echo("$mysqli->connect_errno: $mysqli->connect_error");
    return $product;
  }
  //echo "Connected successfully <br>";

  $result = $conn->query($sql);

  if ($result->num_rows > 0)
  {
    while($row = $result->fetch_assoc())
    {
      $product[] = $row;
    }
  }
  $conn->close();

  return $product;
}

function getSQLResultP($sql, $param)
{
  include('../private/config.php');

  //Connect to MySQL Server
  $mysqli = new mysqli($server, $webuser, $webpass, $dbname);
  if ($mysqli->connect_error)
  {
    echo "Connected failed <br>";
    echo("$mysqli->connect_errno: $mysqli->connect_error");
    return $product;
  }
  //echo "Connected successfully <br>";

  $product = [];

  $stmt = $mysqli->prepare($sql);
  call_user_func_array(array($stmt, 'bind_param'), $param);
  $stmt->execute();
  $result = $stmt->get_result();
  if ($result->num_rows > 0)
  {
    while($row = $result->fetch_assoc())
    {
      $product[] = $row;
    }
  }
  $stmt->close();
  $mysqli->close();

  return $product;
}

function executeSQL($sql, $param)
{
  include('../private/config.php');


  $affected_rows = 0;

  //Connect to MySQL Server
  $mysqli = new mysqli($server, $webuser, $webpass, $dbname);
  if ($mysqli->connect_error)
  {
    echo "Connected failed <br>";
    echo("$mysqli->connect_errno: $mysqli->connect_error");
    return $affected_rows;
  }
  //echo "Connected successfully <br>";

  $stmt = $mysqli->prepare($sql);
  call_user_func_array(array($stmt, 'bind_param'), $param);
  $stmt->execute();
  $affected_rows = $stmt->affected_rows;
  $stmt->close();
  $mysqli->close();

  return $affected_rows;
}

?>
