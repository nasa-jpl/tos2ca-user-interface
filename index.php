<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="">

  <title>TOS2CA | Phenomenon Definition</title>

  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/1.11.1/jquery.min.js"></script>

  <!-- tos2ca -->
  <link href="https://code.jquery.com/ui/1.12.1/themes/base/jquery-ui.css" rel="stylesheet">

  <script src="https://code.jquery.com/ui/1.12.1/jquery-ui.min.js" integrity="sha256-VazP97ZCwtekAsvgPBSUwPFKdrwD3unUfSGVYrahUqU=" crossorigin="anonymous"></script>
 
  <script src="https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.0.0/crypto-js.min.js"></script>

  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.css"/>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/0.4.2/leaflet.draw.css"/>

  <link rel="stylesheet" href="css/tos2ca.css"/>

  <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.js"></script>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet.draw/0.4.2/leaflet.draw.js"></script>

  <script src="js/index.js"  crossorigin=""></script>
  <script src="js/submit.js"  crossorigin=""></script>
  <script src="js/phenomenon.js" crossorigin=""></script>

<script>

  let max_date = 30; 
  let selectedDate = new Date();

  $(document).ready(function() {
           
    $(function() {
      $('#startdate').datepicker({
          dateFormat: 'yy-mm-dd',
          onSelect: function(date) {
              selectedDate = date;
              var edate = new Date(date.valueOf());
              edate.setDate(edate.getDate() + max_date);
              $('#enddate').datepicker('option', 'minDate', date);
              $('#enddate').datepicker('option', 'firstDay', date);
              $('#enddate').datepicker('option', 'maxDate', edate);
              $("#enddate").datepicker("refresh");
          }, //end of onSelect attribute

          onClose: function(date) {
            var edate = new Date(date.valueOf());
            var timeStep = document.getElementById('timeStep');
            if (timeStep)
            {
              if (timeStep.value === 'yearly' || timeStep.value === 'monthly')
              {
                if (timeStep.value === 'yearly')
                  edate.setFullYear(edate.getFullYear() + 1);
                else
                  edate.setMonth(edate.getMonth() + 1);

                edate.setDate(edate.getDate() - 1);

                var ed = document.getElementById('enddate');

                if (ed)
                {
                  var date = edate.toISOString().slice(0,10); //.replace(/T/g, ' ');
                  ed.value = date;
                }
              }
            }
          }, //end of onClose

      }).datepicker("setDate", "0"); //end of startdate datepicker
    }); //end of startdate function

    $(function() {
      $('#enddate').datepicker({
          dateFormat: 'yy-mm-dd',
          onSelect: function(date) {
          }, //end of onSelect attribute
      }).datepicker("setDate", "0");

      var edate = new Date(selectedDate.valueOf());
      edate.setDate(edate.getDate() + max_date);

      $('#enddate').datepicker('option', 'minDate', selectedDate);
      $('#enddate').datepicker('option', 'maxDate', edate);
    }) //end of enddate function

  }); //end of Ready function

  </script>

<script>

const dictionary_file = 'tos2ca-phdef-dictionary.json';

const MAX_AREA = 250;  //50x50 

let approot  = '';
let dictJSON = {};

async function init()
{
  const map = L.map('map', {minZoom:2, maxZoom:11}).setView([0,0] ,2);

  const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  	    maxZoom: 18,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(map);

  var drawnItems = new L.FeatureGroup();
  map.addLayer(drawnItems);

  var drawControlFull = new L.Control.Draw({
    draw: {
      polygon: false,
      //rectangle: false,
      marker: false,
      circle: false,
      polyline: false
    },
    edit: {
      featureGroup: drawnItems,
      remove: true
    }
  });

  map.addControl(drawControlFull);

  var drawControlEditOnly = new L.Control.Draw({
    edit: {
      featureGroup: drawnItems
    },
    draw: false
  });

  map.on(L.Draw.Event.CREATED, function (event) {
    var layer = event.layer;
    drawnItems.addLayer(layer);
  });

  map.on('draw:created', function (e) {
    var type = e.layerType;

    if (type === 'rectangle')
    {
      var layer = e.layer;
      updateSpatial(layer);
    }

    drawnItems.addLayer(layer);
    drawControlFull.remove(map);
    drawControlEditOnly.addTo(map)
  });

  map.on(L.Draw.Event.DELETED, function(e) {
    if (drawnItems.getLayers().length === 0)
    {
      drawControlEditOnly.remove(map);
      drawControlFull.addTo(map);
    };
  });

  map.on('draw:edited', function (e) {
    var layers = e.layers;
    layers.eachLayer(function (layer) {
      updateSpatial(layer);
    });
  });

  approot = getURI();
  dictJSON = await getDictionary(dictionary_file);
  buildDatasetMenu(dictJSON);
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
      <a class="nav-item nav-link active" href="./index.php">Phenomenon Definition</a>
      <a class="nav-item nav-link" href="./phenomenon_viewer.php">Phenomenon Definition Viewer</a>
      <a class="nav-item nav-link" href="./phenomenon_predefined.php">Pre-Defined Phenomenon</a>
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

  <table style="min-width: 1100px; width:100%;">
    <tr>
      <td colspan="2">
        This page will allow you to define the phenomenon you are looking for.  Please enter your information in the form below, along with what dataset, variable, and 
        inequality you want to use to define your phenomenon.  Once your job is complete, you will receive an e-mail with information about how to access your job's output.  
        Note that depending on the size of the spatial region you select, you may be restricted in terms of how many days you can select in your start/end dates 
        (smaller regions allow for longer time periods, while larger regions allow shorter time periods).
        <br />
        <br />
        </td>
    </tr>
    <tr>
      <td class="left">
        <table>
          <tr>
            <td style="padding-top: 5px;">
              <label for="firstname" class="lbold12">First Name</label>
              <input class="normal12" size="25" type="text" id="firstname" name="firstname" placeholder="enter first name" value='' tabindex="1"/>
              <br />
            </td>
          </tr>
          <tr>
            <td style="padding-top: 5px;">
              <label for="lastname" class="lbold12">Last Name</label>
              <input class="normal12" size="25" type="text" id="lastname" name="lastname" placeholder="enter last name" value='' tabindex="2"/>
              <br />
            </td>
          </tr>
          <tr>
            <td style="padding-top: 5px;">
              <label for="email" class="lbold12">Email</label>
              <input class="normal12" size="25" type="text" id="email" name="email" placeholder="enter email" value='' tabindex="3"/>
              <br />
            </td>
          </tr>
          <tr>
            <td nowrap style="white-space:nowrap; padding-top: 5px; padding-right: 10px;">
              <label for="dataset" class="lbold12">Dataset</label>
	        <select style="width: 340px;" class="normal10" id="dataset" name="dataset" tabindex="4" onChange="buildJobVariableMenu(this)"></select>
              <br />
            </td>
          </tr>
          <tr>
            <td style="padding-top: 5px;">
              <label for="variable" class="lbold12">Job Variable</label>
	        <select style="width: 340px;" class="normal10" id="job_variable" name="job_variable" tabindex="5" onChange="setUnit(this)"></select>
              <br />
            </td>
          </tr>
          <tr>
            <td>
              <hr>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 5px;">
              <label for="timestep" class="lbold12">Timestep</label>
              <input class="normal12" size="8" type="text" id="timeStep" name="timeStep" value='' tabindex="3" readonly/>
              <br />
            </td>
          </tr>
          <tr>
            <td nowrap style="padding-top: 5px;">
              <label for="startdate" class="lbold12">Start Date</label>
              <label style="padding-left: 80px;" for="enddate" class="lbold12">End Date</label>
            </td>
          </tr>
          <tr>
            <td>
              <div style="float: left; width: 112px">
                <input class="normal12" size="10" type="text" id="startdate" name="startdate" placeholder="yyyy/mm/dd" value='' tabindex="6"/>
              </div>
              <div>
                <div style="float: left; width: 80px">&nbsp;</div>
                <div>
                  <input class="normal12" size="10" type="text" id="enddate" name="enddate" placeholder="yyyy/mm/dd" value='' tabindex="7"/>
                </div>
              </div>
            </td>
          </tr>

          <tr>
            <td class="normal10">
              <br />
              <label for="spatial" class="bold12">Spatial Region</label>&nbsp;(use map to select an area)
            </td>
          </tr>
          <tr>
            <td class="normal10" style="padding-top: 5px; padding-right: 10px;">
              <input class="normal10" size="60" type="text" id="spatial" name="spatial" placeholder="select an area" value='' tabindex="8"/>
              <br />
              <br />
            </td>
          </tr>
          <tr>
            <td class="bold12">
              Inequality / Statistics
              <br />
            </td>
          </tr>
          <tr>
            <td style="padding-top: 5px;">
              <table>
                <tr> 
                  <td nowrap width="60" class="normal10" style="text-align: right; vertical-align: top">
                    Type&nbsp;
                  </td>
                  <td width="350" class="normal10" nowrap>
	            <select class="normal10" id="inequality_type" name="inequality_type" tabindex="9"  onChange="doInequalityChange(this)">
	              <option value="lessThan">Less Than</option>
	              <option value="lessThanOrEqualTo">Less Than or Equal To</option>
                      <option value="greaterThan">Greater Than</option>
                      <option value="greaterThanOrEqualTo">Greater Than or Equal To</option>
                      <option value="equalTo">Equal To</option>
                      <option value="anomalyEvent">Standard Deviation</option>
                    </select>
                    <br />
                  </td>
                <tr> 
                <tr>
                  <td width="60" class="normal10" id="inequality_unit_title" style="text-align:right; vertical-align: top">
	            Units&nbsp;
                  </td>
                  <td class="normal10">
	            <input class="normal10" size="8" type="text" id="inequality_unit" name="inequality_unit" placeholder="" value='' tabindex="10" disabled />
                    <label id="inequality_unit_label" for="inequality_unit" class="normal10">&nbsp;()</label>
                    <br />
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td class="bold12">
              Description
            </td>
          </tr>
          <tr>
            <td class="bold12">
	      <textarea style="width: 350px;" class="normal10" id="description" name="description" tabindex="11" rows="4" cols="50" ></textarea>
            </td>
          </tr>
          <tr>
            <td style="text-align:center; padding-top: 5px;">
              <input type="button" class="mbutton" tabindex="12" style="cursor:pointer" value="SUBMIT" onClick="doJobSubmit()"/>
            </td>
          </tr>
        </table>
      </td>
      <td class="right" style="vertical-align:top;">
        <div id="map" style="height: 100%; z-index: 0;"></div>
      </td>
    </tr>
  </table>

</div>

    </div>
  </div>
</body>
</html>
