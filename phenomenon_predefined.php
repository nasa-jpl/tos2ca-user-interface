<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="">

  <title>TOS2CA | Pre-Defined Phenomena</title>

  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>

  <!-- tos2ca -->
  <link href="https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css" rel="stylesheet">

  <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.min.js" integrity="sha256-VazP97ZCwtekAsvgPBSUwPFKdrwD3unUfSGVYrahUqU=" crossorigin="anonymous"></script>
 
  <link rel="stylesheet" href="css/tos2ca.css"/>

  <script src="js/index.js"  crossorigin=""></script>
  <script src="js/submit.js"  crossorigin=""></script>
  <script src="js/phenomenon_predefined.js"  crossorigin=""></script>

  <!-- DataTable -->
  <style>
    .dataTables_wrapper {
      font-family: tahoma;
      font-size: 15px;
      #direction: rtl;
      position: relative;
      clear: both;
      *zoom: 1;
      zoom: 1;
    }
  </style>

  <link href="https://cdn.datatables.net/1.10.19/css/jquery.dataTables.min.css" rel="stylesheet" />

  <script src="https://code.jquery.com/jquery-3.7.0.js"></script>
  <script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
  <script src="https://cdn.datatables.net/1.13.6/js/dataTables.bootstrap.min.js"></script>

<script>

let dataTable = null;

async function init()
{
  approot = getURI();

  setDisplay('pwait', 'block');

  await getStorms();
  await getFires();
 
  dataTable = new DataTable('#storm_list', {
    autoWidth: false,
    order: [[4, 'desc']],
    columns: [
      { data: 'name' },
      { data: 'startDate', "className": "text-center" },
      { data: 'endDate', "className": "text-center" },
      { data: 'download' },
      { data: 'mask' },
      { data: 'curation' }
    ],
    columnDefs: [
     { className: "dt-head-center", targets: [ 0, 1, 2, 3, 4, 5 ] },
     { target: 4, visible: false},
     { target: 5, visible: false}
    ]
  });
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
      <a class="nav-item nav-link active" href="./phenomenon_predefined.php">Pre-Defined Phenomenon</a>
      <a class="nav-item nav-link" href="./data_curation.php">Data Curation</a>
      <a class="nav-item nav-link" href="./job_lookup.php">Job Lookup</a>
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
        Please select a phenonenon type from the drop-down menu below.  Once you do, you will be able to access a table 
        of phenonena that you can sort and search to find the phenomena you are interested in.  You can download a netCDF-4
        mask file directly from this page.
        <br />
        <br />
        <br />
      </td>
    </tr>
    <tr>
      <td class="qleft" style="vertical-align: top;">
        <table style="width: 100%;" role=presentation>
          <tr>
            <td style="padding-top: 5px;">
              <label for="phenomenon_type_menu" class="qbold12">Phenomenon Type</label>
              <select class="normal12" id="phenomenon_type_menu" name="phenomenon_type_menu" tabindex="0" onChange="doSelectPhenominonType(this)" disabled>
                <option value="none">select phenomenon type</option>
                <option value="hurricane">Tropical Cyclones</option>
                <option value="CaWildFire">California Wild Fires</option>
              </select>
              <br />
              <br />
            </td>
            <td id="year_menu_td" style="display: none; padding-top: 5px;">
              <label for="year_menu" class="qbold12">Year</label>
              <select class="normal12" id="year_menu" name="year_menu" tabindex="0" onChange="doSelectPhenominonYear(this)" disabled>
                <option value="-1">All years</option>
              </select>
              <br />
            </td>
          </tr>
          <tr>
            <td colspan="2">
              <hr>
              <br />
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td id="data_table_td" style="display: none; vertical-align:top; text-align: center;">
        <table id="storm_list" class="display table-responsive cell-border" style="width: 100%;" role=presentation>
          <thead>
            <tr>
              <th>Storm Name</th>
              <th>Start Date</th>
              <th>End Date</th>
              <th>Download</th>
              <th style="width:165px!important;">Mask</th>
              <th>Curation</th>
            </tr>
          </thead>
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
