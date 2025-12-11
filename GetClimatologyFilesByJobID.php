<?php

  require_once('JdbcUtility.php');
  require_once('common.php');

  $jobID = $_GET['jobID'];
  
  argumentCountValidate($_GET, 1);
  jobIDValidate($jobID);

  $sql = "select location, year(startDateTime) as year from output where JobID=? and type='JSON climatology' order by startDateTime";
  $param = array('i', &$jobID);
  $result = getSQLResultP($sql, $param);

  $sql = "select distinct variable from jobs where phdefJobID=? and climatology=1";
  $vparam = array('i', &$jobID);
  $vresult = getSQLResultP($sql, $vparam);

  $sql = "select startDate, endDate from jobs where jobID=?";
  $yparam = array('i', &$jobID);
  $yresult = getSQLResultP($sql, $yparam);

  $sql = "select distinct dataset, variable from jobs where phdefJobID=? and climatology=1";
  $uparam = array('i', &$jobID);
  $uresult = getSQLResultP($sql, $uparam);
  $string = file_get_contents($curationDataDictionary);
  $dataDict = json_decode($string, true);

  $info = array();
  if (count($result) > 0)
  {
    $row = $result;
    $info['files'] = array();
    foreach ($row as $key => $value) 
    {
	    $info['files'][$key] = $value;
    }

    $row = $vresult;
    $info['variables'] = array();
    foreach ($row as $item)
    {
      $info['variables'][] = $item['variable'];
    }

    $row = $yresult[0];
    $info['date_range'] = array();
    $info['date_range']['start_date'] = $row['startDate'];
    $info['date_range']['end_date'] = $row['endDate'];

    $row = $uresult;
    $units = array();
    foreach($row as $item)
    {
      //print_r($dataDict[$item['dataset']]['units'][$item['variable']]);
      $info['units'][$item['variable']] = $dataDict[$item['dataset']]['units'][$item['variable']];
    }
  }
  $json = json_encode($info);
  echo $json;
?>

