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

  <script src="https://cdn.jsdelivr.net/npm/echarts@6.0.0/dist/echarts.min.js"></script>

  <script src="https://cdn.jsdelivr.net/npm/danfojs@1.1.2/lib/bundle.min.js"></script>

  <script src="https://momentjs.com/downloads/moment.min.js"></script>

  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css" />
  <script src="https://cdn.jsdelivr.net/npm/flatpickr"></script>

  <!-- TOS2CA -->
  <link rel="stylesheet" href="css/tos2ca.css" />
  <link href="css/visualization.css" rel="stylesheet">
  <script src="js/visualization.js" crossorigin=""></script>
  <style>
    * {
      box-sizing: border-box;
    }

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

    .dataTable {
      font-family: tahoma;
      font-size: 14px;
    }

    .dataTables_scrollHead {
      background-color: lightblue;
    }

    .dataTable tr.selected {
      line-height: 17px;
    }

    .page_info {
      position: relative;
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

      try {
        let parms = window.location.search.replace('?', '');
        if (!parms) {
          parms = window.location.hash.replace('#', '');
        }

        if (parms) {
          parms.split('&').forEach(parmStr => {
            const [k, v] = parmStr.split('=');
            if (k.toLocaleLowerCase() === 'job') {
              document.getElementById('job_id_input').value = v;
              fetchJob();
            }
          });
        }
      } catch (err) {
        console.warn("Failed to load URL parameters");
      }
    }

    function createChart() {
      if (_glob_chartUtil) {
        _glob_chartUtil.createCharts();
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

    function setTime() {
      if (_glob_mapUtil) {
        const timeStr = document.getElementById('map_time-select').value;
        _glob_mapUtil.setTimePolyByName(timeStr);
      }
    }

    function stepTime(forward) {
      if (_glob_mapUtil) {
        _glob_mapUtil.stepTimePoly(forward);
      }
    }

    function playPauseTimeStep() {
      if (_glob_mapUtil) {
        _glob_mapUtil.playPauseTimePoly();
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
  <!-- keep everything in a fixed width container -->
  <div id="vis_main-wrapper" class="container vis_main-wrapper" style="flex: 1 1;">
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
            <input id="fetch_job_btn" type="button" class="mbutton vis_btn vis_job-fetch-btn" tabindex="12" value="Fetch Job" onClick="fetchJob()" />
          </div>
          <div id="job_summary_wrapper" class="vis_job-summ-wrapper">Fetch a job to view summary data</div>
          <table id="vis_anom_summary_list" class="display table-responsive cell-border" style="flex: 1 1;">
            <thead>
              <tr>
                <th class="qth">Anomaly</th>
                <th class="qth">Start Time</th>
                <th class="qth">End Time</th>
              </tr>
            </thead>
          </table>
          <div style="flex-basis: 24px; height: 24px; text-align: right; margin-top: -24px; z-index: 2; position: relative;">
            <input type="button" class="vis_btn" value="None" onClick="console.log('none')" />
            <input type="button" class="vis_btn" value="All" onClick="console.log('all')" />
          </div>
        </div>
        <div class="vis_controls-section">
          <div class="vis_controls-row-max">
            <div id="vis_map" class="vis_map-container"></div>
            <div id="vis_map-controls" class="vis_map-controls">
              <div class="vis_map-time-controls">
                <div class="vis_map-time-select">
                  <div class="vis_labeled-select">
                    <label for="map_time-select" class="lbold12" style="width: auto;">Date Time</label>
                    <select class="normal10 vis_btn" id="map_time-select" name="map_time-select" onchange="setTime()"></select>
                  </div>
                </div>
                <div class="vis_map-time-steppers">
                  <div class="vis_map-time-step-control vis_map-time-step-backward" onClick="stepTime(false)">⇤</div>
                  <div id="vis_map-time-step-animate" class="vis_map-time-step-control vis_map-time-step-animate" onClick="playPauseTimeStep()">⏯</div>
                  <div class="vis_map-time-step-control vis_map-time-step-forward" onClick="stepTime(true)">⇥</div>
                </div>
              </div>
            </div>
          </div>
          <hr />
          <div id="vis_controls-chart_opts_hint" class="vis_controls-row-top">
            Fetch a job to see available chart options.
          </div>
          <div id="vis_controls-chart_opts_climatology" class="vis_controls-row-top" style="display: none;">
            Selected job will visualize all available parameters as a timeseries.
          </div>
          <div id="vis_controls-chart_opts" class="vis_controls-row-top" style="display: none;">
            <div class="vis_controls-column">
              <div class="vis_controls-row">
                <div class="vis_labeled-select">
                  <label for="chart_start_date_select" class="lbold12" style="width: auto;">Start Date</label>
                  <input id="chart_start_date_select" name="chart_start_date_select" placeholder="yyyy-mm-dd" class="normal10 vis_btn" />
                </div>
              </div>
              <div class="vis_controls-row">
                <div class="vis_labeled-select">
                  <label for="chart_end_date_select" class="lbold12" style="width: auto;">End Date</label>
                  <input id="chart_end_date_select" name="chart_end_date_select" placeholder="yyyy-mm-dd" class="normal10 vis_btn" />
                </div>
              </div>
            </div>
            <div class="vis_controls-column">
              <div class="vis_controls-row">
                <div class="vis_labeled-select">
                  <label for="chart_variable_select_1" class="lbold12" style="width: auto;">Variable 1</label>
                  <select class="normal10 vis_btn" id="chart_variable_select_1" name="chart_variable_select_1"></select>
                </div>
              </div>
              <div class="vis_controls-row">
                <div class="vis_labeled-select">
                  <label for="chart_variable_select_2" class="lbold12" style="width: auto;">Variable 2</label>
                  <select class="normal10 vis_btn" id="chart_variable_select_2" name="chart_variable_select_2"></select>
                </div>
              </div>
              <div class="vis_controls-row">
                <div class="vis_labeled-select">
                  <label for="chart_variable_select_3" class="lbold12" style="width: auto;">Variable 3</label>
                  <select class="normal10 vis_btn" id="chart_variable_select_3" name="chart_variable_select_3"></select>
                </div>
              </div>
              <div class="vis_controls-row">
                <div class="vis_labeled-select">
                  <label for="vis_is_climatology">Visualize as Timeseries</label>
                  <input type="checkbox" id="vis_is_climatology" name="vis_is_climatology" value="Climatology">
                </div>
              </div>
            </div>
          </div>
          <div class="vis_button-row">
            <input id="chart_create_btn" type="button" class="mbutton vis_btn" tabindex="12" value="Create Chart" disabled onClick="createChart()" />
          </div>
        </div>
      </div>

      <div class="vis_charts-list">
        <div id="charts_list"></div>
      </div>
    </div>

  </div>

</body>

</html>