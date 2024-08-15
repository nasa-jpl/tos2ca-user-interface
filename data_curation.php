<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="">

  <title>TOS2CA | Data Curation</title>

  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>


  <!-- tos2ca -->
  <link href="https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css" rel="stylesheet">

  <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.min.js" integrity="sha256-VazP97ZCwtekAsvgPBSUwPFKdrwD3unUfSGVYrahUqU=" crossorigin="anonymous"></script>
 
  <link rel="stylesheet" href="css/tos2ca.css"/>

  <script src="js/index.js"  crossorigin=""></script>
  <script src="js/submit.js"  crossorigin=""></script>
  <script src="js/curation.js"  crossorigin=""></script>

<?php

  if (count($_GET) > 1)
  {
    header("Location: https://tos2ca-dev1.jpl.nasa.gov/error.php");
    die();
  }
  else
  {
    $jobID = $_GET['jobID'];
    if (!preg_match("/^[0-9]*$/", $jobID))
    {
      header("Location: https://tos2ca-dev1.jpl.nasa.gov/error.php");
      die();
    }
  }

?>

<script>

const dictionary_file = 'tos2ca-data-collection-dictionary.json';

let approot  = '';
let dictJSON = {};

let jobID = '';

async function init()
{
  var parameters = location.search.substring(1).split("&");
  if (parameters.length > 0)
  {
    var parm = parameters[0].split("=");
    if (parm[0] === 'jobID')
      jobID = parm[1]-0;
  }

  approot = getURI();
  dictJSON = await getDictionary(dictionary_file);
  buildCurationDatasetMenu(dictJSON);
}

</script>

</head>

<body onLoad="init()">

    <!-- nav bar and title -->
<nav class="navbar navbar-expand-lg navbar-light bg-light">
  <a class="navbar-brand" href="#">TOS2CA</a>
  <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
    <span class="navbar-toggler-icon"></span>
  </button>
  <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
    <div class="navbar-nav">
      <a class="nav-item nav-link" href="./index.php">Phenomenon Definition</a>
      <a class="nav-item nav-link" href="./phenomenon_viewer.php">Phenomenon Definition Viewer</a>
      <a class="nav-item nav-link" href="./phenomenon_predefined.php">Pre-Defined Phenomenon</a>
      <a class="nav-item nav-link active" href="./data_curation.php">Data Curation</a>
      <a class="nav-item nav-link" href="./job_lookup.php">Job Lookup</a>
      <a class="nav-item nav-link" href="./visualization.php">Visualization Tool</a>
    </div>
  </div>
</nav>
	
  <!-- main content -->
  <div style="padding-left: 50px; padding-right: 50px;">
    <div>

<div style="overflow: auto;">

  <table style="min-width: 1100px; width:100%;">
    <tr>
      <td colspan="2">
        This page will allow you to use your phenomena masks and generate subsets of data.  Enter your Phenomena Definition Job ID
        number.  Then fill out the rest of the form, entering your contact information and select the data set and variable you would
        like to receive subsetted data for.  Data will be subsetted to the bounds of each anomaly mask from the output of your phenonena
        definition job.  You will be notified by e-mail when your curated data subsets are ready for you to retrieve. 
        <br />
        <br />
      </td>
    </tr>
    <tr>
      <td colspan="2" style="padding: 20px; width:100%">
        <table style="width: 100%">
          <tr>
            <td style="padding-top: 5px; width: 50%;">
              <label for="jobID" class="lbold12" style="width:150px;">Phenomena Definition Job ID</label>
              <input class="normal12" size="25" type="text" id="jobID" name="jobID" value='' tabindex="1" onKeyUp="setDisabled('curation_submit', false);" onChange="setDisabled('curation_submit', false);" />
            </td>
            <td style="padding-top: 5px;">
              <label for="email" class="lbold12">Email</label>
              <input class="normal12" size="25" type="text" id="email" name="email" placeholder="enter email" value='' tabindex="2" onChange="setDisabled('curation_submit', false);" />
              <br />
            </td>
          </tr>
          <tr>
            <td style="padding-top: 5px;">
              <label for="firstname" class="lbold12" style="width:150px;">First Name</label>
              <input class="normal12" size="25" type="text" id="firstname" name="firstname" placeholder="enter first name" value='' tabindex="3" onChange="setDisabled('curation_submit', false);" />
              <br />
            </td>
            <td style="padding-top: 5px;">
              <label for="lastname" class="lbold12">Last Name</label>
              <input class="normal12" size="25" type="text" id="lastname" name="lastname" placeholder="enter last name" value='' tabindex="4" onChange="setDisabled('curation_submit', false);" />
              <br />
            </td>
          </tr>
          <tr>
            <td style="padding-top: 5px;">
              <label for="dataset" class="lbold12" style="width:150px;">Dataset</label>
                <select style="width: 100%; max-width: 400px;" class="normal12" id="dataset" name="dataset" tabindex="5" onChange="buildCurationJobVariableMenu(this)"></select>
              <br />
            </td>
            <td style="padding-top: 5px;">
              <label for="variable" class="lbold12">Job Variable</label>
                <select class="normal12" id="job_variable" name="job_variable" tabindex="6" onChange="setDisabled('curation_submit', false);" ></select>
              <br />
            </td>
          </tr>
          <tr>
            <td class="bold12" colspan="2" style="padding-top: 15px;">
              Description
            </td>
          </tr>
          <tr>
            <td class="bold12" style="width: 100%; padding-top: 5px;" colspan="2">
              <textarea  style="width: 100%" class="normal10" id="description" name="description" tabindex="7" rows="4" cols="50" ></textarea>
            </td>
          </tr>
          <tr>
            <td style="text-align:center; padding-top: 5px;" colspan="2">
              <input id="curation_submit" type="button" class="submit_button" tabindex="8" value="SUBMIT" disabled onClick="doCurationSubmit()"/>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

</div>

    </div>
  </div>

</body>
</html>
