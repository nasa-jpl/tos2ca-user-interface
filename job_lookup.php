<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="">

  <title>TOS2CA | Job Lookup</title>

  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>

  <!-- tos2ca -->
  <link href="https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css" rel="stylesheet">
  <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.min.js" integrity="sha256-VazP97ZCwtekAsvgPBSUwPFKdrwD3unUfSGVYrahUqU=" crossorigin="anonymous"></script>
 
  <link rel="stylesheet" href="css/tos2ca.css"/>
  <script src="js/index.js"  crossorigin=""></script>
  <script src="js/job_lookup.js"  crossorigin=""></script>

  <!-- DataTable -->
  <style>
    .dataTables_wrapper {
      font-family: tahoma;
      font-size: 14px;
      #direction: rtl;
      position: relative;
      clear: both;
      *zoom: 1;
      zoom: 1;
    }
    table.dataTable thead tr {
      background-color: lightblue;
   }

   .jobClass
   {
     text-align: center;
     text-decoration: underline;
     width: 100px;
     cursor: pointer;
   }

  </style>

  <link href="https://cdn.datatables.net/1.10.19/css/jquery.dataTables.min.css" rel="stylesheet" />

  <script src="https://code.jquery.com/jquery-3.7.0.js"></script>
  <script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
  <script src="https://cdn.datatables.net/1.13.6/js/dataTables.bootstrap.min.js"></script>

<script>

let dataTable = null;

let dataSet = {
  "data": []
};


function init()
{
  approot = getURI();
 
  dataTable = new DataTable('#job_list', {
    //autoWidth: false,
    //paging: false,
    //fixedColumns: true,
    fixedHeader: true,
    fixedColumns: {
      left: 1,
      right: 1
    },
    columns: [
      { data: 'PhDefJobID', "className": "jobClass" },
      { data: 'PhDefDataSet' },
      { data: 'DataCurationID', "className": "jobClass" },
      { data: 'DataCurationDataSet' }
    ],
    columnDefs: [
     { className: "dt-head-center", targets: [ 0, 1, 2, 3 ] },
     { width: "200px", targets: [ 1 ] },
     //{ width: "100px", targets: [ 2 ] },
     //{ width: "150px", targets: [ 3 ] },
    ],
    data: dataSet.data
  });

  dataTable.on('click', '.jobClass', (e) => {
    var jID = e.target.innerHTML;
    getJobInfo(jID);
  });

  var input = document.getElementById("jobID");
  input.addEventListener("keypress", async function(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      document.getElementById("job_lookup_submit").click();
    }
  });

  var input = document.getElementById("email");
  input.addEventListener("keypress", async function(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      document.getElementById("job_lookup_submit").click();
    }
  });

  var input = document.getElementById("lastname");
  input.addEventListener("keypress", async function(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      document.getElementById("job_lookup_submit").click();
    }
  });

  setWait('pwait', 'none', 'init()')
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
      <a class="nav-item nav-link" href="./data_curation.php">Data Curation</a>
      <a class="nav-item nav-link active" href="./job_lookup.php">Job Lookup</a>
      <a class="nav-item nav-link" href="./visualization.php">Visualization Tool</a>
    </div>
  </div>
</nav>
	
  <!-- main content -->
  <div style="padding-left: 50px; padding-right: 50px;">
    <div>
      <div style="overflow: auto;">
        <table style="min-width: 1100px; width:100%;" role=presentation>
          <tr>
            <td colspan="2">
              On this page, you can lookup information about jobs you have submitted.  Enter either
              a Job ID, e-mail address, or first + last name to find your job(s).  You can look up
              any of your Phenomenon Definition or Data Curation jobs.
              <br />
              <br />
              <br />
              <br />
            </td>
          </tr>
          <tr>
            <td class="qleft" style="width: 40%; vertical-align: top;">
              <table style="width: 100%;" role=presentation>
                <tr>
                  <td style="padding-top: 5px;">
                    <label for="jobID" class="lbold12" style="width:150px; text-align: right;">Job ID</label>
                    <input class="normal12" size="25" type="text" id="jobID" name="jobID" value='' tabindex="1"/>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 5px;">
                    <label for="email" class="lbold12" style="width:150px; text-align: right;">Email</label>
                    <input class="normal12" size="25" type="text" id="email" name="email" placeholder="enter email" value='' tabindex="2"/>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 5px;">
                    <label for="firstname" class="lbold12" style="width:150px; text-align: right;">First Name</label>
                    <input class="normal12" size="25" type="text" id="firstname" name="firstname" placeholder="enter first name" tabindex="3"/>
                  </td>
                </tr>
                <tr>
                  <td style="padding-top: 5px;">
                    <label for="lastname" class="lbold12" style="width:150px; text-align: right;">Last Name</label>
                    <input class="normal12" size="25" type="text" id="lastname" name="lastname" placeholder="enter last name" tabindex="4"/>
                    <br />
                  </td>
                </tr>
                <tr>
                  <td class="normal8" style="padding-top: 5px; text-align: center">
                    (Enter either Job ID, E-Mail, or First Name + Last Name)
                  </td>
                </tr>
                <tr>
                  <td style="text-align:left; padding-top: 20px; padding-left: 150px;">
                    <input id="job_lookup_submit" type="button" class="mbutton" tabindex="8" value="Submit" onClick="doJobLookup()" />
                  </td>
                </tr>
              </table>
            </td>
      
            <td id="data_table_td" style="vertical-align:top; text-align: center;">
              <table style="width: 100%;" role=presentation>
                <tr>
                  <td>
                    <table style="width: 100%; border: 1px solid black;" role=presentation>
                      <tr>
                        <td class="bold12" style="width:200px; text-align: right; padding-top: 10px;">Job ID:</td>
                        <td id="phJobID" class="normal12" style="text-align: left; padding-left: 5px; padding-top: 10px;"></td>
                      </tr>
                      <tr>
                        <td class="bold12" style="width:200px; text-align: right; padding-top: 10px;">Stage:</td>
                        <td id="phStage" class="normal12" style="text-align: left; padding-left: 5px; padding-top: 10px;"></td>
                      </tr>
                      <tr>
                        <td class="bold12" style="width:150px; text-align: right; padding-top: 5px;">Date Range:</td>
                        <td id="phDateRange" class="normal12" style="text-align: left; padding-left: 5px; padding-top: 5px;"></td>
                      </tr>
                      <tr>
                        <td class="bold12" style="width:150px; text-align: right; padding-top: 5px;">Data Set:</td>
                        <td id="phDataSet" class="normal12" style="text-align: left; padding-left: 5px;  padding-top: 5px;"></td>
                      </tr>
                      <tr>
                        <td class="bold12" style="width:150px; text-align: right; padding-top: 5px;">Variable:</td>
                        <td id="phVariable" class="normal12" style="text-align: left; padding-left: 5px;  padding-top: 5px;"></td>
                      </tr>
                      <tr>
                        <td class="bold12" style="width:150px; text-align: right; padding-top: 5px;">Inequality:</td>
                        <td id="phInequality" class="normal12" style="text-align: left; padding-left: 5px;  padding-top: 5px;"></td>
                      </tr>
                      <tr>
                        <td class="bold12" style="width:150px; text-align: right; padding-top: 5px;">Inequality Value:</td>
                        <td id="phInequalityValue" class="normal12" style="text-align: left; padding-left: 5px;  padding-top: 5px;"></td>
                      </tr>
                      <tr>
                        <td class="bold12" style="width:150px; text-align: right; padding-top: 5px;">Description:</td>
                        <td id="phDescription" class="normal12" style="text-align: left; padding-left: 5px;  padding-top: 5px;"></td>
                      </tr>
                      <tr>
                        <td class="bold12" style="width:150px; text-align: right; padding-top: 5px; padding-bottom: 10px;">Data Curation Jobs:</td>
                        <td id="phCurationJobs" class="normal12" style="text-align: left; padding-left: 5px; padding-bottom: 5px;"></td>
                      </tr>
                    </table>
                    <br />
                  </td>
                </tr>
                <tr>
                  <td>
                    <table id="job_list" class="display table-responsive cell-border" style="width: 100%;" role=presentation>
                      <thead>
                        <tr>
                          <th>PhDef Job ID</th>
                          <th>PhDef Data Set</th>
                          <th>Data Curation ID</th>
                          <th>Data Curation Data Set</th>
                        </tr>
                      </thead>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </div>
    </div>
  </div>

  <div id="pwait" name="pwait" style="text-align: center; background-color: #FFFFFF; position: absolute; top: 500px; left: 850px; display: block; z-Index:9999; border: 1px solid black; width: 150px; height: 70px;">
    <table style="width: 100%">
      <tr>
        <td style="padding-top: 10px;">
          <img class="myimg" src="images/loading.gif" style="width:16px; height:16px;" />
        </td>
      </tr>
      <tr>
        <td id="totalfiles" name="totalfiles" class="tdwait">
          Please wait ....
        </td>
        </td>
      </tr>
      <tr>
        <td id="loadingfile" name="loadingfile" class="tdwait">
          (Can be up to 45 sec)
        </td>
      </tr>
    </table>
  </div>

</body>
</html>
