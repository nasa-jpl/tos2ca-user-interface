<?php

  require_once('JdbcUtility.php');
  require_once('common.php');

  argumentCountValidate($_GET, 0);

  $sql = "select sid, REPLACE(name,'\r\n',' ') as name, startDate, endDate from caWildfires where (TRIM(name) != '' AND name IS NOT NULL)";
  $result = getSQLResult($sql);

  $str = "{ \"data\": [";
  if (count($result) > 0)
  {
    for ($i=0; $i<count($result); $i++)
    {
      $row = $result[$i];
      $s = "{";
      foreach ($row as $key => $value) 
      {
        if ($s !== "{")
          $s .= ", ";
        $s .= '"' . $key . '":"' . $value . '"';
      }
      $s .= "}";
     
      if ($i !== 0)
        $str .= ",";
      $str .= $s;
    }
  }
  $str .= "] }";
  echo($str);

?>

