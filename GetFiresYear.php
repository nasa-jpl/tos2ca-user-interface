<?php

  require_once('JdbcUtility.php');

  $sql = "select distinct SUBSTR(startDate, 1, 4) as year from caWildfires order by year DESC";

  $result = getSQLResult($sql);

  $str = "";
  if (count($result) > 0)
  {
    for ($i=0; $i<count($result); $i++)
    {
      $row = $result[$i];
      $s = $row["year"];
     
      if ($i !== 0)
        $str .= ",";
      $str .= $s;
    }
  }
  echo($str);

?>

