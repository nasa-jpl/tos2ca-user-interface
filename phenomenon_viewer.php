<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="">

  <title>TOS2CA | Phenomenon Definition Viewer</title>

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
     //text-decoration: underline;
     cursor: pointer;
   }

  </style>
  
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>

  <!-- tos2ca -->
  <link href="https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css" rel="stylesheet">

  <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.min.js" integrity="sha256-VazP97ZCwtekAsvgPBSUwPFKdrwD3unUfSGVYrahUqU=" crossorigin="anonymous"></script>
 
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css" crossorigin=""/>

  <link rel="stylesheet" href="css/tos2ca.css"/>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"  crossorigin=""></script>

  <script src="js/index.js"  crossorigin=""></script>
  <script src="js/submit.js"  crossorigin=""></script>
  <script src="js/phenomenon_viewer.js"  crossorigin=""></script>

  <link href="https://cdn.datatables.net/1.10.19/css/jquery.dataTables.min.css" rel="stylesheet" />

  <script src="https://code.jquery.com/jquery-3.7.0.js"></script>
  <script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
  <script src="https://cdn.datatables.net/1.13.6/js/dataTables.bootstrap.min.js"></script>

<script>

const dictionary_file = '/data/code/data-dictionaries/tos2ca-phdef-dictionary.json';
const MAX_AREA = 250;  //50x50 

var layers = [];
var current_id = -1;
var current_layer = null;
var geoJaon;
let approot  = '';
let dictJSON = {};
let map;
let selected_row = -1;
let latLngBounds;

let fileArr = [];

let dataTable = null;

let dataSet = {
  "data": []
};

let modal = null;

function init()
{
  dataTable = new DataTable('#toc_list_table', {
    paging: false,
    searching: false,
    scrollCollapse: true,
    scrollY: '250px',
    fixedColumns: true,
    columns: [
      { data: 'sdate', "className": "text-center" },
      { data: 'edate', "className": "text-center" },
      { data: 'anomaly', "className": "jobClass" }
    ],
    columnDefs: [
      // Center align both header and body content of columns 1, 2 & 3
      { className: "dt-head-center", targets: [ 0, 1, 2 ] },
      { width: "40%", targets: [ 0, 1 ] }
    ],
    data: dataSet.data
  });

  dataTable.on('click', 'tbody tr', async (e) => {
    var target = e.currentTarget;
    let classList = target.classList;

    if (classList.contains('selected')) {
      classList.remove('selected');
    }
    else {
      dataTable.rows('.selected').nodes().each((row) => row.classList.remove('selected'));
      classList.add('selected');
    }
    var cell = target.cells[2];
    if (dataset.data[target._DT_RowIndex])
      await redraw(dataset.data[target._DT_RowIndex].anomaly, cell);
  });

  approot = getURI();

  map = L.map('map', {minZoom:2, maxZoom:11, scrollWheelZoom:false}).setView([0,0], 2);

  const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  	    maxZoom: 18,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  modal = document.querySelector('.modal');
  const closeButton = document.querySelector('.close-button');
  closeButton.addEventListener('click', async function(e) {
    var elm = document.getElementById('jobID_text');
    jobID = elm.value;
    if (jobID)
    {
      modal.close();
      await viewPhenomenon(jobID);
    }
    else
    {
      alert('Please enter a valid jobJD');
    }
  });

  var parameters = location.search.substring(1).split("&");
  var idx = parameters[0].indexOf('jobID');

  new Promise( function(resolve) {
    tiles.on("load", function () {
      resolve();
    });
  }).then( async function() {
    if (idx !== -1)
    {
      var parm = parameters[0].split("=");
      if (parm[0] === 'jobID')
      {
        var jobID = parm[1].trim();
        if (!isEmpty(jobID))
        {
          try
          {
            jobID = parm[1]-0;
            setDisplay('pwait', 'block');
            await viewPhenomenon(jobID);
          }
          catch (error)
          {
            alert('Invalid valid jobJD');
            console.log(error);
          }
        }
        else
        {
          alert('Invalid valid jobJD');
        }
      }
    }
    else
    {
      modal.showModal();
    }
  });

  var input = document.getElementById("jobID_text");
  input.addEventListener("keypress", async function(event) {
    if (event.key === "Enter") {
      event.preventDefault();
      document.querySelector('.close-button').click();
    }
  });

}

function unload()
{
}


</script>
</head>

<body onLoad="init()" onUnload="unload()">

 <!-- nav bar and title -->
<nav class="navbar navbar-expand-lg navbar-light bg-light">
  <a class="navbar-brand" href="#">TOS2CA</a>
  <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarNavAltMarkup" aria-controls="navbarNavAltMarkup" aria-expanded="false" aria-label="Toggle navigation">
    <span class="navbar-toggler-icon"></span>
  </button>
  <div class="collapse navbar-collapse" id="navbarNavAltMarkup">
    <div class="navbar-nav">
      <a class="nav-item nav-link" href="./index.php">Phenomenon Definition</a>
      <a class="nav-item nav-link active" href="./phenomenon_viewer.php">Phenomenon Definition Viewer</a>
      <a class="nav-item nav-link" href="./phenomenon_predefined.php">Pre-Defined Phenomenon</a>
      <a class="nav-item nav-link" href="./data_curation.php">Data Curation</a>
      <a class="nav-item nav-link" href="./job_lookup.php">Job Lookup</a>
      <a class="nav-item nav-link" href="./visualization.php">Visualization Tool</a>
    </div>
  </div>
</nav>
	
  <!-- keep everything in a fixed width container -->
  <div style="padding-left: 50px; padding-right: 50px;">
    <div>

<div style="width: 100%; height: 100%">

  <table style="min-width: 1100px; width:100%; height: 100%">
    <tr>
      <td colspan="2">
        On this page you can view the results of your Phenomenon Definition job.  The job details are listed, along with a table of contents of any anomalies that were 
        identified based on those parameters.  Clicking on an anomaly will bring up footprints of the anomaly on the map.  You can use the controls below the map to 
        step through the evolution of the anomaly for the life of that anomaly.  Additionally, you can click on the footprint on the map to view a plot of the data and anomaly.
        If you would like to retrieve data that is subsetted for these anomaly footprints, please visit the Data Curation page by clicking the button below, and launch a new job.
        <br />
        <br />
        </td>
    </tr>
    <tr>
      <td class="left" style="vertical-align: top;">
        <table>
          <tr>
            <td style="padding-right: 5px;">
              <div style="border: 2px solid; width: 500px; padding: 10px;">
              <table>
                <tr>
                  <td class="job_label"> Job ID: </td>
                  <td class="normal12" id="jobID" style="padding-left: 5px;"> jobID </td>
                </tr>
                <tr>
                  <td class="job_label"> Date Range: </td>
                  <td class="normal12" id="date_range" style="padding-left: 5px;"> date_range </td>
                </tr>
                <tr>
                  <td class="job_label"> Data Set: </td>
                  <td class="normal12" id="dataset" style="padding-left: 5px;"> dataset </td>
                </tr>
                <tr>
                  <td class="job_label"> Variable: </td>
                  <td class="normal12" id="variable" style="padding-left: 5px;"> variable </td>
                </tr>
                <tr>
                  <td class="job_label"> Inequality: </td>
                  <td class="normal12" id="inequality" style="padding-left: 5px;"> inequality </td>
                </tr>
                <tr>
                  <td class="job_label"> Inequality Value: </td>
                  <td class="normal12" id="inequality_value" style="padding-left: 5px;"> inequality_value </td>
                </tr>
                <tr>
                  <td class="job_label"> Description: </td>
                  <td class="normal12" id="desc_value" style="padding-left: 5px;"> description </td>
                </tr>
              </table>
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 10px; width: 500px;">
              <table>
                <tr>
                  <td colspan="3" style="width: 470px; vertical-align:top; text-align: center;">
                    <table id="toc_list_table" class="display table-responsive cell-border" role=presentation>
                      <thead>
                        <tr>
                          <th class="qth">Star Time</th>
                          <th class="qth">End Time</th>
                          <th class="qth">Anomaly</th>
                        </tr>
                      </thead>
                    </table>
                  </td>
                </tr>

              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 10px; text-align: center">
              <input type="button" class="mbutton" tabindex="12" value="View Another Job" onClick="viewAnotherJob()"/>
              &nbsp; &nbsp;
              <input type="button" class="mbutton" tabindex="12" value="Go to Data Curation" onClick="goToDataCuration()"/>
            </td>
          </tr>
        </table>
      </td>
      <td class="right" style="vertical-align:top; text-align: center;">
        <div id="map" style="height: 100%; z-index: 0;"></div>
        <div style="text-align: center;">
        <table style="width: 100%; text-align: center;">
          <tr>
            <td style="text-align: center; padding: 15px; vertical-align: center; width: 100%;">
              <table>
                <tr>
                  <td class="job_label" style="padding: 10px;">
                    &nbsp;&nbsp;&nbsp;&nbsp;Date Time:&nbsp;
                    <select class="normal12" id="dates" name="dates" tabindex="5" onChange="selectDate(this)">
                      <option value="-1">Select Date Time</option>
                    </select>
                  </td>
                  <td style="padding-left: 30px;">
                    <table>
                      <tr>
                        <td style="padding: 2px;">
                          <div class="arrow-left" id="left_button" onclick="goPrevious()"></div>
                        </td>
                        <td>
                          <input type="button" id="animation_button" class="btn" tabindex="12" value="Start" onClick="goAnimation(this)" />
                        </td>
                        <td style="padding: 2px;">
                          <div class="arrow-right" id="right_button" onclick="goNext()"></div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        <div>
      </td>
    </tr>
  </table>

</div>

    </div>
  </div>

  <div id="pwait" name="pwait" style="text-align: center; background-color: #FFFFFF; position: absolute; top: 500px; left: 850px; display: none; z-Index:9999; border: 1px solid black; width: 150px; height: 70px;">
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

  <div id="jobID_div" name="jobID_div" style="text-align: center; background-color: #FFFFFF; position: absolute; top: 400px; left: 800px; display: block; z-Index:9999; border: 0px solid black;">
  <dialog class="modal" style="position: absolute; width: 300px; height: 220px; display: flex;">
    <table style="width: 200px">
      <tr>
        <td style="padding-top: 0px; padding-left: 10px;">
          <label for="jobID_text" class="bold12">Please enter a job ID to view:</label>
          <br />
          <input class="normal12" size="25" type="text" id="jobID_text" name="jobID_text" placeholder="enter job id" value='' tabindex="1"/>
        </td>
      </tr>
      <tr>
        <td style="text-align:center; padding-top: 0px; padding-bottom: 0px;">
          <img class="myimg" src="images/loading.gif" style="visibility:hidden; width:20px; height:20px;" />
          <input type="button" id="jobID_submit" class="close-button" tabindex="12" value=" Submit " />
          <input type="button" id="jobID_cancel" class="ibutton" tabindex="13" value=" Cancel " onClick="doGetJobIDCancel()"/>
          </div>
        </td>
      </tr>
    </table>
  </dialog>
  </div>
</body>
</html>
