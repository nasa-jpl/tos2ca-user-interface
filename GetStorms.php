<?php

  require_once('JdbcUtility.php');

  $sql = "select name, startDate, endDate, CONCAT(thirtyFourKnots, ',', fiftyKnots, ',', sixtyFourKnots) as download, 'na' as mask, 'na' as curation  from tropicalCyclones order by startDate";

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

