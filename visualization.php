<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="">

  <title>TOS2CA | Analysis Tools</title>

  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>

  <!-- libs -->
  <script src="https://code.jquery.com/jquery-3.7.0.js"></script>
  <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.min.js" integrity="sha256-VazP97ZCwtekAsvgPBSUwPFKdrwD3unUfSGVYrahUqU=" crossorigin="anonymous"></script>
  <script src="https://cdn.datatables.net/1.13.6/js/jquery.dataTables.min.js"></script>
  <script src="https://cdn.datatables.net/1.13.6/js/dataTables.bootstrap.min.js"></script>
  <link href="https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css" rel="stylesheet">
  <link href="https://cdn.datatables.net/1.10.19/css/jquery.dataTables.min.css" rel="stylesheet" />

  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css" />
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/0.4.2/leaflet.draw.css" />
  <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/0.4.2/leaflet.draw.js"></script>

  <script src="https://cdn.jsdelivr.net/npm/echarts@5.5.0/dist/echarts.min.js"></script>

  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css" />
  <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>

  <!-- TOS2CA -->
  <link rel="stylesheet" href="css/tos2ca.css" />
  <link href="css/visualization.css" rel="stylesheet">
  <script src="js/visualization.js" crossorigin=""></script>
  <style>
    /* address overrides */
    .flatpickr-calendar.open {
      display: block !important;
    }

    .section-links a {
      display: table-cell;
      text-align: center;
    }

    .section-links a:first-child {
      padding-left: 18px;
    }
  </style>

  <script>
    let _glob_jobUtil;
    let _glob_chartUtil;
    let _glob_mapUtil;

    function init() {
      _glob_jobUtil = new JobUtil();
      _glob_chartUtil = new ChartUtil();
      _glob_mapUtil = new MapUtil('vis_map');
    }

    function createChart() {
      if (_glob_chartUtil) {
        _glob_chartUtil.initChart();
      }
    }

    function fetchJob() {
      if (_glob_jobUtil) {
        const jobId = document.getElementById('job_id_input').value;
        if (jobId) {
          _glob_jobUtil.fetchJob(jobId);
        }
      }
    }
  </script>

</head>

<body onLoad="init()" style="display: flex; flex-flow: column nowrap; height: 100vh;">

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
  <div class="container vis_main-wrapper" style="flex: 1 1;">
    <div class="vis_subheader-text">
      This page will allow you plot phenomena values against other variables that have been automatically interpolated.
    </div>

    <div class="vis_charting-content">

      <div class="vis_header-form">
        <div class="vis_controls-section vis_controls-section-mini">
          <div id="job_search_wrapper" class="vis_controls-row">
            <div class="vis_labeled-input">
              <label for="job_id_input" class="lbold12" style="width: auto;">Mask Job ID</label>
              <input id="job_id_input" name="job_id_input" class="normal10" placeholder="1234" />
            </div>
            <div class="vis_button-row">
              <input type="button" class="mbutton" tabindex="12" value="Fetch Job" onClick="fetchJob()" />
            </div>
          </div>
          <div id="job_summary_wrapper" class="vis_controls-row"></div>
        </div>
        <div class="vis_controls-section">
          <table id="vis_anom_summary_list" class="display table-responsive cell-border" style="flex: 1 1;">
            <thead>
              <tr>
                <th class="qth">Anomaly</th>
                <th class="qth">Start Time</th>
                <th class="qth">End Time</th>
              </tr>
            </thead>
          </table>
          <div style="flex-basis: 24px; height: 24px; text-align: right; margin-top: -24px; z-index: 2;">
            <input type="button" value="None" onClick="console.log('none')" />
            <input type="button" value="All" onClick="console.log('all')" />
          </div>
        </div>
        <div class="vis_controls-section">
          <div class="vis_controls-row vis_controls-row-max">
            <div id="vis_map" class="vis_map_container"></div>
          </div>
          <div class="vis_controls-row">
            <div class="vis_labeled-select">
              <label for="chart_variable_select_1" class="lbold12" style="width: auto;">Variable 1</label>
              <select class="normal10" id="chart_variable_select_1" name="chart_variable_select_1"></select>
            </div>
            <div class="vis_labeled-select">
              <label for="chart_variable_select_2" class="lbold12" style="width: auto;">Variable 2</label>
              <select class="normal10" id="chart_variable_select_2" name="chart_variable_select_2"></select>
            </div>
            <div class="vis_labeled-select">
              <label for="chart_variable_select_3" class="lbold12" style="width: auto;">Variable 3</label>
              <select class="normal10" id="chart_variable_select_3" name="chart_variable_select_3"></select>
            </div>
          </div>
          <div class="vis_button-row">
            <input type="button" class="mbutton" tabindex="12" value="Create Chart" onClick="createChart()" />
          </div>
        </div>
      </div>

      <div class="vis_charts-list" style="padding: 12px 0px;">
        <div id="charts_list"></div>
      </div>
    </div>

  </div>

</body>

</html>