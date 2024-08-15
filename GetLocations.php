<?php

  require_once('JdbcUtility.php');
  require_once('common.php');

  argumentCountValidate($_GET, 0);

  $sql = "SELECT sid, GROUP_CONCAT(REPLACE(location,'\r\n',' ') SEPARATOR ', ') as location FROM predefinedOutput group by sid order by sid";
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

