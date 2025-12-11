<?php

// Add keys
$key=""; // 32 bytes
$vector=""; // 16 bytes

// Add paths to the JSON files on your filesystem
$phdefDataDictionary="";
$curationDataDictionary="";

function displayNotFoundAndExit()
{
  // Add URL to your error page	
  header("Location: 404.html");
  die();
}

function argumentCountValidate($argv, $validNumber)
{
  if (count($argv) !== $validNumber)
  {
    displayNotFoundAndExit();
  }
}

function nullValidate($string)
{
  if ($string != 'NULL')
  {
    displayNotFoundAndExit();
  }
} 

function argumentCountRangeValidate($argv, $min, $max)
{
  if (count($argv) < $min || count($argv) > $max)
  {
    displayNotFoundAndExit();
  }
}

function jobIDValidate($jobID)
{
  return(userIDValidate($jobID));
}

function userIDValidate($userID)
{
  if (empty($userID))
  {
    displayNotFoundAndExit();
  }

  if (!preg_match("/^[0-9]*$/", $userID))
  {
    displayNotFoundAndExit();
  }
}

function nameCheck($string)
{
  if (empty($string))
  {
    displayNotFoundAndExit();
  }

  if (!preg_match('/[a-zA-Z\s]/', $string))
  {
    displayNotFoundAndExit();
  }
}

function emailCheck($email)
{
  if (empty($email))
  {
    displayNotFoundAndExit();
  }

  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) 
  {
    displayNotFoundAndExit();
  }
}

function ncFilenameCheck($fname)
{
  if (empty($fname))
  {
    displayNotFoundAndExit();
  }

  $info = pathinfo($fname);
  $valid = isValidateExtention($info["extension"]);
  if (!$valid)
  {
    displayNotFoundAndExit();
  }
}

function isValidateExtention($extension)
{
  if ($extension == "nc4" || $extension == "json")
    return true;

  return false;
}

function fireFilenameCheck($fname)
{
  if (empty($fname))
  {
    displayNotFoundAndExit();
  }

  $info = pathinfo($fname);
  $extension = $info["extension"];
  if ($extension != "png" && $extension != "json")
  {
    displayNotFoundAndExit();
  }
}

function myCrypt($value)
{
  return base64_encode($value);
}

function myDecrypt($value)
{
  $value = base64_decode($value);
  return $value;
}

function phenomenonCheck($str)
{
  if (empty($str))
  {
    displayNotFoundAndExit();
  }

  // Add other types of predefined phenomena, if needed
  if (strpos($str, "wildfire") === false && strpos($str, "hurricane") === false) 
  {
    displayNotFoundAndExit();
  }
}

function emailValidate($email)
{
  if (empty($email))
  {
    displayNotFoundAndExit();
  }

  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) 
  {
    displayNotFoundAndExit();
  }
}

function dictionaryCheck($name)
{
  if (empty($name))
  {
    displayNotFoundAndExit();
  }

  // Add filenames only to the PhDef and Curation dictionary JSON files
  $dictionaries = [ "tos2ca-phdef-dictionary.json", "tos2ca-data-collection-dictionary.json" ];

  if (!in_array($name, $dictionaries))
  {
    displayNotFoundAndExit();
  }
}

function specialCharacterCheck($string)
{
  if (empty($string))
  {
    displayNotFoundAndExit();
  }

  if (preg_match('/[\'^£$%&*()}{@#~?><>|=+¬]/', $string))
  {
    displayNotFoundAndExit();
  }
}

function clean($text)
{
  return trim(preg_replace("/(\s*[\r\n]+\s*|\s+)/", ' ', $text));
}

function timeTagValidate($timetag)
{
  if (empty($timetag))
  {
    displayNotFoundAndExit();
  }

  if (!preg_match("/^[0-9]{4}-[0-9]{2}-[0-9]{2} [0-9]{2}:[0-9]{2}:[0-9]{2}$/", $timetag))
  {
    displayNotFoundAndExit();
  }
}

function statusCheck($status)
{
  if (empty($status))
  {
    displayNotFoundAndExit();
  }

  $status_arr = [ "pending", "running", "complete", "error" ];

  if (!in_array($status, $status_arr))
  {
    displayNotFoundAndExit();
  }
}

function stageCheck($stage)
{
  if (empty($stage))
  {
    displayNotFoundAndExit();
  }

  $stages = [ "phdef", "curation" ];

  if (!in_array($stage, $stages))
  {
    displayNotFoundAndExit();
  }
}

function descriptionCheck($string)
{
  if (preg_match('/[\'^£$%&()}{@#~|¬]/', $string))
  {
    displayNotFoundAndExit();
  }
}

function coordinateCheck($string)
{
  if (empty($string))
  {
    displayNotFoundAndExit();
  }

  if (preg_match('/[\'^£$%&*}{@#~?><>|=+¬]/', $string))
  {
    echo("one or more of the 'special characters' found in $string");
  }
}

function ineqOperatorCheck($op)
{
  if (empty($op))
  {
    displayNotFoundAndExit();
  }

  // Add types of inequalities you wish to use in PhDef
  $ops = [ "lessThan", "lessThanOrEqualTo", "greaterThan", "greaterThanOrEqualTo", "equalTo", "anomalyEvent" ];

  if (!in_array($op, $ops))
  {
    displayNotFoundAndExit();
  }
}

?>
