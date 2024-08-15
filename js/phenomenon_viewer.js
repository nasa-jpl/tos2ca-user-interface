
let start_date_table = [];
let end_date_table = [];
let anomaly = [];

let myTimeout;
let myInterval;

const waitTime = 10;
const stepTime = 1000;

const hi_color = '#F2FF33';
const bg_color = '#D3D3D3';
const wt_color = '#FFFFFF';

let animation_p = false;
let imageOverlay = null;

var colors = [ 'MediumVioletRed', 'red', 'orange', 'blue', 'yellow', 'black', 'Crimson', 'DarkRed', 'Magenta', 'MidnightBlue' ];

let current_png_layer = null;

let myJson = {};

let displayList = [];

let selected_anomaly = 1;
let start_timestep = 0;
let end_timestep = 0;

let marker = null;
let xmarker = null;

let is_loading = false;

function getDate(d)
{

  if (typeof d === 'undefined') return null;

  if (d.match(/^[0-9]+$/) != null)
  {
    var year  = d.substring(0,4);
    var month = d.substring(4,6);
    var day   = d.substring(6,8);
    var hr    = d.substring(8,10);
    var min   = d.substring(10,12);

    return `${year}-${tpad(month, 2)}-${tpad(day, 2)} ${tpad(hr, 2)}:${min}:00`;

    return date;
  }

  return null;
}

function selectDate(o)
{
  if (current_png_layer !== null)
  {
    map.removeLayer(current_png_layer);
    current_png_layer = null;

    var date = o.options[o.selectedIndex].value;
    addPng(date);
    
    return;
  }

  for (var i=0; i<layers.length; i++)
    map.removeLayer(layers[i]);
  layers = [];

  var timestep = o.selectedIndex;
  showFeature(selected_anomaly, timestep, false);
}

async function getJob(jobID)
{
  var url = `${approot}/GetJob.php?jobID=${jobID}`;
  console.log(`getJob():: url = ${url}`);

  var json = await getJson(url);
  console.log(json);
  
  return(json);
}

function getLatlngBounds(coords)
{
  
  var latlng = { "latitude_bounds": [], "longitude_bounds": [] };
  var s = coords.substring(9, coords.length-2);
  var arr = s.split(',');
  var a0 = arr[0].split(' ');
  var a1 = arr[1].split(' ');
  var a2 = arr[2].split(' ');
  latlng.latitude_bounds = [a0[1], a1[1]];
  latlng.longitude_bounds = [a0[0], a2[0]];

  return latlng;
}

async function getJsonByKeyfromS3(key, cell)
{
  var url = `${approot}/GetJsonByKey.php?key=${key}`;
  var json = await fetchData(url, cell);
  console.log(`getJsonByKeyfromS3():: json: ${json}`);
  return json;
}

async function fetchData(url, cell)
{
  console.log(`fetchData(start):: url = ${url}`);
  try 
  {
    if (cell) cell.style.cursor = 'wait';
    setDisplay('pwait', 'block');
    const req = await fetch(url);
    const res = await req.json();
    console.log(`fetchData(end)\n`);
    if (cell) cell.style.cursor = 'pointer';
    setDisplay('pwait', 'none');
    return res;
  } 
  catch (error) 
  {
    console.log(error);
    return {};
  }
}

async function fetchTextData(url)
{
  console.log(`fetchTextData(start):: url = ${url}`);
  try 
  {
    const req = await fetch(url);
    return req.text();
  } 
  catch (error) 
  {
    console.log(error);
    return ''
  }
}

async function jobSetup(jobID, fileArr, cell)
{
  setInnerHTML('jobID', jobID);

  var job = await getJob(jobID);
  console.log(job);

  var start_date = job.startDate;
  var end_date = job.endDate;
  var dataset = job.dataset;
  var variable = job.variable;
  var inequality = job.ineqOperator;
  var inequality_value = job.ineqValue;
  var desc = job.description;
  if (job.coords === '')
  {
    setInnerHTML('date_range', 'Not available');
    setInnerHTML('dataset', dataset);
    setInnerHTML('variable', variable);
    setInnerHTML('inequality', 'Not available');
    setInnerHTML('inequality_value', 'Not available');
    setInnerHTML('desc_value', desc);

    return;
  }

  var coords = job.coords;
  var latlng_bounds = getLatlngBounds(coords);
  var latitude_bounds = latlng_bounds.latitude_bounds;
  var longitude_bounds = latlng_bounds.longitude_bounds;

  var southWest = L.latLng(latitude_bounds[0], longitude_bounds[0]);
  var northEast = L.latLng(latitude_bounds[1], longitude_bounds[1]);
  latLngBounds = L.latLngBounds(southWest, northEast);

  map.fitBounds(latLngBounds);

  marker = new L.marker([ latitude_bounds[1], longitude_bounds[0] ], { opacity: 0.01 }); //opacity may be set to zero
  marker.addTo(map);

  var iconOptions = {
     iconUrl: 'images/xmark.png',
     iconSize: [20, 20]
  }
  var customIcon = L.icon(iconOptions);

  var markerOptions = {
     title: "hide plot",
     clickable: true,
     icon: customIcon
  }
  xmarker = new L.marker([ latitude_bounds[1], longitude_bounds[0] ], markerOptions); 
  xmarker.addTo(map);
  xmarker.on('click', onClickMarker);
  xmarker._icon.style.display = 'none';

  var dstr = `${start_date} to ${end_date}`; 
  setInnerHTML('date_range', dstr);
  setInnerHTML('dataset', dataset);
  setInnerHTML('variable', variable);
  setInnerHTML('inequality', inequality);
  setInnerHTML('inequality_value', inequality_value);
  setInnerHTML('desc_value', desc);
  
  myJson.jobID = jobID;
  myJson.job = job;
  myJson.latLngBounds = latLngBounds;

  myJson.toc = [];
  for (var i=0; i<fileArr.length; i++)
  {
    var file = fileArr[i];
    
    // get ForTraCC file only to set up time array
    if (file.indexOf('ForTraCC') != -1)
    {

      var geoData = await getJsonByKeyfromS3(file, cell);

      for (var n=0; n<geoData.length; n++)
      {
        var rec = geoData[n];

        var r = { "anomaly": "", "startDate": "", "endDate": "", "timesteps": []};

        var name = rec.name;
        var arr = name.split(' ');
        var anomaly = arr[1];

        r.anomaly = anomaly;
        r.startDate = ''+rec.start_date;
        r.endDate = ''+rec.end_date;

        myJson.toc.push(r);
      }
      timeTableSetup(myJson);
    }
  }

  selected_anomaly = 1;
  await getTimeSteps(selected_anomaly, cell);

  var timestep = 0;
  showFeature(selected_anomaly, timestep, false);
  dateMenuSetup(selected_anomaly);

  setDisplay('pwait', 'none');
  setDisplay('jobID_div', 'none');
}

function showFeature(anomaly, timestep, zoomTo)
{

  var toc = myJson.toc[anomaly-1];

  var features = toc.timesteps[timestep].features;

  for (var i=0; i<features.length; i++)
  {
    var feature = features[i];
    var geoJson = L.geoJson(feature, {
      style: getStyle,
      onEachFeature: onEachFeature,
    }).addTo(map);

    if (zoomTo)
      map.fitBounds(geoJson.getBounds());
  }
}

function timeTableSetup(myJson)
{
  dataset = {"data": []};
  let data = dataset.data;

  var toc = myJson.toc;
  for (var i=0; i<toc.length; i++)
  {
    var rec = toc[i];

    var anomaly = rec.anomaly; 
    
    if (anomaly === null || anomaly === '') continue;
 
    var timesteps = rec.timesteps; 
    var st = rec.startDate;
    var et = rec.endDate;
    var d = getDate(st);
    var sdate = d.toLocaleString().slice(0,19).replace(/T/g, ' ');
    var d = getDate(et);
    var edate = d.toLocaleString().slice(0,19).replace(/T/g, ' ');

    var r = {"sdate": sdate, "edate": edate, "anomaly": anomaly};
    data.push(r);
  } 

  dataTable.clear();
  dataTable.rows.add(data);
  dataTable.draw();

  $("#toc_list_table tbody tr:first-child").trigger("click");
}

function getAnomalyIndex(arr, anomaly)
{
  for (var i=0; i<arr.length; i++)
  {
    var toc = arr[i];
    if (toc.anomaly-0 === anomaly-0)
      return i;
  }
  return -1;
}

function getDateIndex(arr, dt)
{
  for (var i=0; i<arr.length; i++)
  {
    var d = arr[i];
    if (d.dateTime-0 === dt-0)
      return i;
  }
  return -1;
}

async function getImageLayer(png, opacity)
{
  console.log(`getImageLayer():: png = ${png}`);
  console.log(png);
  var imgUrl = `${approot}/GetPngByKey.php?key=${png}`;
  console.log(imgUrl);
  var errorOverlayUrl = 'https://cdn-icons-png.flaticon.com/512/110/110686.png';
  var altText = png;

  return await L.imageOverlay(imgUrl, latLngBounds, {
    opacity: opacity,
    errorOverlayUrl,
    alt: altText,
    interactive: true
  });
}

function getStyle(feature)
{
  return {
    weight: 2,
    opacity: 0.5,
    fillColor: '#00dd00',
    fillOpacity: 0.5
  }
}

function onEachFeature(feature, layer)
{

  const properties = feature.properties;
  var anomaly = properties.anomaly-0;
  var date = properties.dateTime;

  var d = getDate(''+date);

  layer.date = d;

  layer.on({
    mouseover: onMouseOver,
    mouseout: onMouseOut,
    click: onClick,
  });

  var color = anomaly-0;
  if (color > 9)
    color = color-9;
  layer.setStyle({
    weight: 2,
    opacity: 0.5,
    color: colors[color],
    fillOpacity: 0.5
  });

  layers.push(layer);
}

function onMouseOver(e)
{
  if (animation_p) return;

  var layer = e.target;

  var msg = 'Click to show plot';
  if (current_png_layer === null)
  {
    layer.bindTooltip(String(msg), {opacity: 0.7}).openTooltip();
  }
}

function onMouseOut(e)
{
  var layer = e.target;
  layer.unbindTooltip();
}

function onClick(e)
{
  if (animation_p) return;

  var layer = e.target;
  layer.unbindTooltip();

  var select = document.getElementById('dates');
  var date = select.options[select.selectedIndex].value;

  if (current_png_layer === null)
  {
    for (var i=0; i<layers.length; i++)
      map.removeLayer(layers[i]);

    layers = [];
    current_layer = null;
    addPng(date);
  }
}

function onMouseOverPng(e)
{
  var target = e.target;

  marker.bindTooltip(String(target.date), {opacity: 0.7}).openTooltip();
}

function onMouseOutPng(e)
{
  var target = e.target;

  marker.unbindTooltip();
}

function getTotalAnomaly(sdate, edate)
{
  val = 1;

  return val;
}

async function redraw(anomaly, cell)
{
  if (animation_p) 
  {
    var button = document.getElementById('animation_button');
    button.value = 'Stop';
    goAnimation(button);
  }
  animation_p = false;
  xmarker._icon.style.display = 'none';

  selected_anomaly = anomaly;
  console.log(`redraw():: selected_anomaly = ${selected_anomaly}`);

  if (current_png_layer !== null)
  {
    map.removeLayer(current_png_layer);
    current_png_layer = null;
  }

  await getTimeSteps(selected_anomaly, cell);

  var timestep = 0;
  await showFeature(selected_anomaly, timestep, false);
  await dateMenuSetup(selected_anomaly);

  var select = document.getElementById('dates');
  selectDate(select);
}

async function getTimeSteps(selected_anomaly, cell)
{
  var toc = null;
  var n = getAnomalyIndex(myJson.toc, selected_anomaly);

  if (n === -1)
  {
    var r = { "anomaly": ''+selected_anomaly, "timesteps": [] };
    myJson.toc.push(r);
    toc = myJson.toc[myJson.toc.length-1];
  }
  else
  {
    //should always be here
    toc = myJson.toc[n];
  }

  if (toc.timesteps.length > 0) 
  {
    console.log(`getTimeSteps():: toc.timesteps.length > 0; return`);
    return;
  }

  for (var i=0; i<fileArr.length; i++)
  {
    var file = fileArr[i];
    
    if (file.indexOf('ForTraCC') === -1)
    {

      var s = file.indexOf('-');
      var e = file.lastIndexOf('.json');
      var key = file.substring(s+1, e);

      if (key < toc.startDate || key > toc.endDate)
        continue;

      var geoData = await getJsonByKeyfromS3(file, cell);

      var features = geoData.features;

      for (var j=0; j<features.length; j++)
      {
        var feature = features[j];
  
        var property = feature.properties;
        var anomaly = property.anomaly;
        
        if ((anomaly-0) !== (selected_anomaly-0))
          continue;

        var timestep = null;
        var n = getDateIndex(toc.timesteps, property.dateTime)
        if (n === -1)
        {
          var r = { "dateTime": ''+property.dateTime, "features": [] };
          toc.timesteps.push(r);
          timestep = toc.timesteps[toc.timesteps.length-1];
        }
        else
        {
          timestep = toc.timesteps[n];
        }
        timestep.features.push(feature); 
      }
    } // === -1
  } // i loop

  for (var i=0; i<myJson.toc.length; i++)
  {
    var timesteps = myJson.toc[i].timesteps;
    var j = 0;
    while (j<timesteps.length)
    {
      if (timesteps[j].features.length === 0)
      {
        timesteps.splice(j, 1);
      }
      j++;
    } 

    timesteps.sort( function(a,b) {return (a.dateTime-0) > (b.dateTime-0) ? 1 : -1;} );
  }


  var timestep = 0;
  showFeature(selected_anomaly, timestep, false);
  dateMenuSetup(selected_anomaly);
}

function startDateChange(e) 
{
  var id = e.target.id;
  id = id.replace('startDate', 'startDateDropdown');
  var div = document.getElementById(id);
  if (div)
    div.style.display = 'block';
  id = id.replace('endDateDropdown', 'startDateDropdown');
  displayList.push(id);
}

function endDateChange(e) 
{
  var id = e.target.id;
  id = id.replace('endDate', 'endDateDropdown');
  var div = document.getElementById(id);
  if (div)
    div.style.display = 'block';
  id = id.replace('endDateDropdown', 'endDateDropdown');
  displayList.push(id);
}

function doShowAnomaly(e)
{
  var id = e.target.id;
  var row = id.substring(2)-0;
  
  if (selected_row !== -1)
    background(selected_row);

  current_layer.closePopup();
  current_layer.setStyle({
    weight: 2,
    opacity: 0.5,
    fillOpacity: 0.5
  });

  var anomaly_all = document.getElementById('anomaly_all');
  if (anomaly_all !== null && !anomaly_all.checked)
  {
    current_layer.closePopup();
    current_layer.setStyle({
      weight: 0,
      opacity: 0.0,
      color: '#007700',
      fillOpacity: 0.0
    });
  }

  if (row === selected_row)
  {
    //remove current png
    selected_row = -1;
    return;
  }

  setBackground('row'+row, hi_color);

  selected_row = row;

  current_layer = layers[row];
  current_layer.setStyle({
    weight: 5,
    opacity: 0.9,
    //color: colors[anomaly],
    fillOpacity: 0.9
  });
  current_layer.bringToFront();
}

function doShowImage(e)
{
  var id = e.target.id;
  var row = id.substring(2)-0;
  
  if (selected_row !== -1)
  {
    if ((selected_row % 2) === 0)
    {
      setBackground('sd'+selected_row, bg_color);
      setBackground('an'+selected_row, bg_color);
    }
    else
    {
      setBackground('sd'+selected_row, wt_color);
      setBackground('an'+selected_row, wt_color);
    }
  }

  if (imageOverlay !== null)
  {
    map.removeLayer(imageOverlay);
    imageOverlay = null;
  }

  if (row === selected_row)
  {
    //remove current png
    selected_row = -1;

    current_layer.closePopup();
    current_layer.setStyle({
      weight: 3,
      opacity: 0.5,
      color: '#007700',
      fillOpacity: 0.7
    });

    return;
  }

  setBackground('sd'+row, hi_color);
  setBackground('an'+row, hi_color);

  selected_row = row;

  var errorOverlayUrl = 'https://cdn-icons-png.flaticon.com/512/110/110686.png';
  var altText = '17-202207011700.png';
  imageOverlay = L.imageOverlay(imageUrl, latLngBounds, {
           opacity: 1.0,
           errorOverlayUrl,
           alt: altText,
           interactive: true
        }).addTo(map);
  //L.rectangle(latLngBounds).addTo(map);
  map.fitBounds(latLngBounds);

  current_layer.closePopup();
  current_layer.setStyle({
    weight: 0,
    opacity: 0.0,
    color: '#007700',
    fillOpacity: 0.0
  });
}

function setBackground(id, bg_color)
{
  var o = document.getElementById(id);
  if (id)
  {
    o.style.background = bg_color;
  }
}

function updateStartDate(id, dt, anomaly, timestep)
{
  setInnerHTML("startDate_"+id, dt);
  setDisplay("startDateDropdown_"+id, 'none');

  start_timestep = timestep;
  selected_anomaly = anomaly;
}

function updateEndDate(id, dt, anomaly, timestep)
{
  setInnerHTML("endDate_"+id, dt);
  setDisplay("endDateDropdown_"+id, 'none');

  end_timestep = timestep;
  selected_anomaly = anomaly;
}

function goNext(o)
{
  if (animation_p) return;

  var select = document.getElementById('dates');
  var selectedIndex = select.selectedIndex;

  console.log(`goNext(1): ${select.selectedIndex} - ${select.options.length}`);

  if (selectedIndex < select.options.length-1) 
    select.selectedIndex++;
  else
    select.selectedIndex = 0;

  console.log(`goNext(2): ${select.selectedIndex} - ${select.options.length}`);

  selectDate(select);
}

function goPrevious(o)
{
  if (animation_p) return;

  var select = document.getElementById('dates');
  var selectedIndex = select.selectedIndex;

  if (selectedIndex === 0) 
    select.selectedIndex = select.options.length-1;
  else
    select.selectedIndex--;

  selectDate(select);
}

function goAnimation(o)
{
  console.log('doAnimation():: ' + o.value);

  var select = document.getElementById('dates');

  if (o.value === 'Start')
  { 
    setDisabled('dates', true);
    animation_p = true;
    o.value = 'Stop';

    myTimeOut = setTimeout(() => {
      myInterval = setInterval(() => {

        var select = document.getElementById('dates');
        var selectedIndex = select.selectedIndex;

        if (selectedIndex < select.options.length-1) 
          select.selectedIndex++;
        else
          select.selectedIndex = 1;
      
        selectDate(select);

      }, stepTime)
    }, waitTime)
  }
  else
  {
    setDisabled('dates', false);
    animation_p = false;
    o.value = 'Start';
    clearInterval(myInterval);
    clearTimeout(myTimeout);
  }
}

function goToDataCuration()
{
  var url = `${approot}/data_curation.php`;
  var cleanUrl = sanitizeUrl(url);
  if (cleanUrl === 'unsafe')
  {
    alert(`Unsafe ${url}`);
  }
  else
  {
    window.open(cleanUrl, '_blank').focus();
  }
}

function anomalyChange(o)
{
  anomaly_check_save = o.checked;

  if (selected_row !== -1)
  {
    if ((selected_row % 2) === 0)
    {
      setBackground('row'+selected_row, bg_color);
    }
    else
    {
      setBackground('row'+selected_row, wt_color);
    }
  }
  
  if (o.checked)
  {
    for (var i=0; i<layers.length; i++)
    {
      layers[i].setStyle({
        weight: 2,
        opacity: 0.5,
        fillOpacity: 0.5
      });
    }
  }
  else
  {
    for (var i=0; i<layers.length; i++)
    {
      layers[i].setStyle({
        weight: 0,
        opacity: 0.0,
        fillOpacity: 0.0
      });
    }
  }

  selected_row = -1;
}

function tpad(number,length)
{
  var str = '' + number;
  while (str.length < length)
    str = '0' +  str;
  return str;
}

function show_hide_image(o)
{
  var obj = document.getElementById('anomaly_all');

  enableImage(!o.checked);

  if (o.checked)
  {
    selected_png_layer.setOpacity(1.0);
    //selected_png_layer.bringToFront();
    
    if (obj && obj.checked) 
    {
      selected_row_save = selected_row; 
      obj.checked = false;
      anomalyChange(obj);
      anomaly_check_save = true;
    }
    else
    {
      if (selected_row !== -1)
        background(selected_row);

      current_layer.setStyle({
        weight: 0,
        opacity: 0.0,
        fillOpacity: 0.0
      });
    }
  }
  else
  {
    selected_png_layer.setOpacity(0.0);

    if (anomaly_check_save) 
    {
      obj.checked = true;
      anomalyChange(obj);
    }
    //else
    //{
      if (selected_row_save !== -1)
      {
        selected_row = selected_row_save;
        setBackground('row'+selected_row, hi_color);

        current_layer.setStyle({
          weight: 5,
          opacity: 0.9,
          fillOpacity: 0.9
        });
        current_layer.bringToFront();
      }
    //}
  }
}

function background(row)
{
  if (row !== -1)
  {
    if ((row % 2) === 0)
    {
      setBackground('row'+row, bg_color);
    }
    else
    {
      setBackground('row'+row, wt_color);
    }
  }
}

function enableImage(b)
{
  setEnable('dates', b);
  setEnable('animation_button', b);
}

function setEnable(id, b)
{
  var obj = document.getElementById(id);
  if (obj)
    obj.disabled = b;
}

function dateMenuSetup(anomaly)
{
  var toc = myJson.toc[anomaly-1];

  var timesteps = toc.timesteps;

  var dates = document.getElementById('dates');
  removeOptions(dates);

  for (var i=0; i<timesteps.length; i++)
  {
    var r = timesteps[i];
    var date = r.dateTime;
    var d = getDate(''+date);
    d = d.toLocaleString().slice(0,19).replace(/T/g, ' ');

    var opt = document.createElement("option");
    opt.text = d;
    opt.title = d;
    opt.value = date;
    if (i === 0) opt.selected = true;
    dates.add(opt);
  }
}

function removeOptions(selectElement) 
{
  var i, L = selectElement.options.length - 1;
  for(i = L; i >= 0; i--) 
  {
    selectElement.remove(i);
  }
}

async function addPng(date)
{
  var png = `${myJson.jobID}/${myJson.jobID}-${date}.png`;
  console.log(`addPng():: png = ${png}`);

  var d = getDate(''+date);
  d = d.toLocaleString().slice(0,19).replace(/T/g, ' ');

  var opacity = 1.0;
  var imageOverlay = await getImageLayer(png, opacity);
  imageOverlay.addTo(map);
  imageOverlay.date = d;

  imageOverlay.on({
    mouseover: onMouseOverPng,
    mouseout: onMouseOutPng,
    //click: onClickPng,
  });

  current_png_layer = imageOverlay;
  //xmarker.addTo(map);
  //map.addLayer(xmarker);
  
  xmarker._icon.style.display = 'block';
}

function onClickMarker(e)
{
  if (animation_p)
  {
    var o = document.getElementById('animation_button');
    o.value = 'Stop';
    goAnimation(o);
  }
  animation_p = false;
  xmarker._icon.style.display = 'none';

  if (current_png_layer !== null)
  {
    map.removeLayer(current_png_layer);
  }
  current_png_layer = null;

  var select = document.getElementById('dates');
  selectDate(select);
}

function doGetJobIDCancel()
{
  console.log('doGetJobIDCancel()');
  modal = document.querySelector('.modal');
  modal.close();
  setDisplay('jobID_div', 'none');
}

async function viewPhenomenon(jobID)
{
  var url = `${approot}/GetAllFileByJobID.php?jobID=${jobID}`;
  
  let filelist = await fetchTextData(url);
  console.log(`filelist = [${filelist}]`);
  console.log(filelist);
  if (!isEmpty(filelist))
  {
    fileArr = filelist.split(';');
    fileArr.sort();
    jobSetup(jobID, fileArr);
  }
  else
  {
    setDisplay('pwait', 'none');
    alert(`There is no data for jobID ${jobID}\nPlease enter another jobID`);
    modal.showModal();
  }
}

function viewAnotherJob()
{
  console.log('viewAnotherJob()');
  window.location.href = 'https://tos2ca-dev1.jpl.nasa.gov/phenomenon_viewer.php';
}


