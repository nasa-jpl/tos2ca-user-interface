
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

//let png_layers = [];
//let selected_png_layer = null;
//let anomaly_check_save = true;
//let selected_row_save = -1; 
let current_png_layer = null;

let myJson = {};

let displayList = [];

let selected_anomaly = 1;
let start_timestep = 0;
let end_timestep = 0;

let marker = null;
let xmarker = null;

function getDate(d)
{

  if (typeof d === 'undefined') return null;

  if (d.match(/^[0-9]+$/) != null)
  {
    var year  = d.substring(0,4);
    var month = d.substring(4,6);
    var day   = d.substring(6,8);
    var hr    = d.substring(8,10);

    return `${year}-${tpad(month, 2)}-${tpad(day, 2)} ${tpad(hr, 2)}:00:00`;
    //var date = new Date(year, month-1, day, hr);
    //date.setHours(hr-0);

    return date;
  }

  return null;
}

function selectDate(o)
{
  for (var i=0; i<layers.length; i++)
    map.removeLayer(layers[i]);
  layers = [];

  var timestep = o.selectedIndex;
  showFeature(selected_anomaly, timestep, false);

  if (current_png_layer !== null)
  {
    var date = o.options[o.selectedIndex].value;
    addPng(date);
  }
}

function getJob(jobID)
{
  var params = `jobID=${jobID}`;

  var url = `${approot}/GetJob.php`;

  let jstr = loadAjaxSync(url, params);

  if (jstr !== "")
  {
    return JSON.parse(jstr);
  }
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

async function getFileByJobIDfromS3(jobID)
{

  var url = `${approot}/GetAllFileByJobID.php?jobID=${jobID}`;

  let jstr = await getTextAjaxSync(url);

  return jstr;
}

async function getJsonByKeyfromS3(key)
{
  
  var url = `${approot}/GetJsonByKey.php?key=${key}`;
  console.log(`getJsonByKeyfromS3():: url = ${url}`);

  let jstr = await getTextAjaxSync(url);

  if (jstr !== "")
  {
    return JSON.parse(jstr);
  }

  return {};
}

async function jobSetup(jobID, fileArr)
{
  setInnerHTML('jobID', jobID);

  var job = getJob(jobID);

  var start_date = job.startDate;
  var end_date = job.endDate;
  var dataset = job.dataset;
  var variable = job.variable;
  var inequality = job.ineqOperator;
  var inequality_value = job.ineqValue;
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

  //marker.bindTooltip("2023-01-03 01:00:00", {permanent: true, className: "my-label", offset: [0, 0] });
  //marker.bindTooltip("2023-01-03 01:00:00", {className: "my-label", offset: [0, 0] });
  //marker.setTooltipContent("XXXXXXXX-01-03 01:00:00");
  //marker.unbindTooltip();

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
      var geoData = await getJsonByKeyfromS3(file);

      for (var n=0; n<geoData.length; n++)
      {
        var rec = geoData[n];

        var name = rec.name;
        var arr = name.split(' ');
        var anomaly = arr[1];
        var r = { "anomaly": ''+anomaly, "timesteps": []};
        var t = { "dateTime": ''+rec.start_date, "features": [] };
        r.timesteps.push(t);
        var t = { "dateTime": ''+rec.end_date, "features": [] };
        r.timesteps.push(t);
        myJson.toc.push(r);
      }
      timeTableSetup(myJson);
    }
  }

  for (var i=0; i<fileArr.length; i++)
  {
    var file = fileArr[i];
    
    if (file.indexOf('ForTraCC') === -1)
    {
      var geoData = await getJsonByKeyfromS3(file);

      var features = geoData.features;

      for (var j=0; j<features.length; j++)
      {
        var feature = features[j];
  
        var property = feature.properties;
        var anomaly = property.anomaly;
        var toc = null;
        var n = getAnomalyIndex(myJson.toc, anomaly);
        if (n === -1)
        {
          var r = { "anomaly": ''+anomaly, "timesteps": [] };
          myJson.toc.push(r);
          toc = myJson.toc[myJson.toc.length-1];
        }
        else
        {
          //should never be here
          toc = myJson.toc[n];
        }
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
        //if (feature.length > 0)
        //{
          timestep.features.push(feature); 
        //}
      }
    } // === -1
  } // i loop

  //myJson.toc.sort( function(a,b) {return a.anomaly > b.anomaly ? 1 : -1;} );
  
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

  //timeTableSetup(myJson);

  selected_anomaly = 1;
  var timestep = 0;
  showFeature(selected_anomaly, timestep, false);

  dateMenuSetup(selected_anomaly);

  setWait('none');
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
      onEachFeature: onEachFeature
    }).addTo(map);

    if (zoomTo)
      map.fitBounds(geoJson.getBounds());
  }
}

function timeTableSetup(myJson)
{
  var toc = myJson.toc;
  for (var i=0; i<toc.length; i++)
  {
    var rec = toc[i];

    var anomaly = rec.anomaly; 
    
    if (anomaly === null || anomaly === '') continue;
 
    var timesteps = rec.timesteps; 
    var st = timesteps[0].dateTime;
    var et = timesteps[timesteps.length-1].dateTime;
    var d = getDate(st);
    var sdate = d.toLocaleString().slice(0,19).replace(/T/g, ' ');
    var d = getDate(et);
    var edate = d.toLocaleString().slice(0,19).replace(/T/g, ' ');

    if ((i %2) == 0)
    {
      addRow('toc_table', sdate, edate, anomaly, 'evenTD', 'evenAnomalyDiv', i); 
    }
    else
    {
      addRow('toc_table', sdate, edate, anomaly, 'oddTD', 'oddAnomalyDiv', i); 
    }
  } 
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
  var imgUrl = `${approot}/GetPngByKey.php?key=${png}`;
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
  ////d = d.toISOString().slice(0,19).replace(/T/g, ' ');
  //d = d.toLocaleString().slice(0,19).replace(/T/g, ' ');
  //var str = "Date time: " + d;

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
  //current_layer = layer;
}

function onMouseOver(e)
{
  if (animation_p) return;

  var layer = e.target;

  var msg = 'Click to show plot';
  if (current_png_layer === null)
  {
    //var msg = 'Click to hide plot';
    layer.bindTooltip(String(msg), {opacity: 0.7}).openTooltip();
  }
  //layer.bindTooltip(String(msg), {opacity: 0.7}).openTooltip();
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

  var select = document.getElementById('dates');
  var date = select.options[select.selectedIndex].value;

  addPng(date);

  layer.unbindTooltip();
}

function onMouseOverPng(e)
{
  var target = e.target;

  marker.bindTooltip(String(target.date), {opacity: 0.7}).openTooltip();
  //target.bindTooltip(String(target.date), {opacity: 0.5, offset: [10, -100] }).openTooltip();
  //xmarker.bindPopup('X').openPopup();
}

function onMouseOutPng(e)
{
  var target = e.target;

  marker.unbindTooltip();
  //target.unbindTooltip();
}

function getTotalAnomaly(sdate, edate)
{
  val = 1;

  return val;
}

function addRow(tableID, sdate, edate, anomaly, style, anomalyStyle, id) 
{
  var table = document.getElementById(tableID);

  var row = table.insertRow();
  row.setAttribute('class', style);        
  row.setAttribute('className', style);    
  row.setAttribute('id', 'row_'+id);        

  var cell = row.insertCell();
  cell.style.width = "40%";        
  createCell(cell, sdate, style, 'startDate', id, false, anomaly);

  var cell = row.insertCell();
  cell.style.width = "40%";        
  createCell(cell, edate, style, 'endDate', id, false, anomaly);

  var cell = row.insertCell();
  createCell(cell, anomaly, anomalyStyle, 'anomaly', id, true, anomaly);
}

function createCell(cell, text, style, idname, id, clickable, anomaly) 
{
  var div = document.createElement('div'); 
  div.setAttribute('class', style);        
  div.setAttribute('className', style);    
  div.setAttribute('id', `${idname}_${id}`);        
  div.style.textAlign = 'center';        

  var txt = document.createTextNode('\u00A0\u00A0\u00A0\u00A0' + text);    
  
  if (clickable)
  {
    div.onclick = doSelectAnomaly;
    //txt.setAttribute('id', `${text}_${id}`);        
    if (id === 0)
      txt = document.createTextNode('\u2713\u00A0' + text);    
  }
  div.appendChild(txt);                   


  cell.appendChild(div);
}

function doSelectAnomaly(e)
{
  if (animation_p) return;

  var target = e.target;

  var txt = '\u00A0\u00A0\u00A0\u00A0' + selected_anomaly;    
  //setInnerHTML('text_'+selected_anomaly, txt);
  setInnerHTML('anomaly_'+(selected_anomaly-1), txt);

  //txt = target.innerHTML;  //XSS
  txt = target.textContent;
  selected_anomaly;
  var idx = txt.lastIndexOf(';');
  selected_anomaly = txt.substring(idx+1);

  //target.innerHTML = '\u2713\u00A0' + selected_anomaly;   //XSS 
  target.textContent = '\u2713\u00A0' + selected_anomaly;    

  var timestep = 0;
  showFeature(selected_anomaly, timestep, false);

  dateMenuSetup(selected_anomaly);

  var select = document.getElementById('dates');

  selectDate(select);
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
    //color: colors[anomaly],
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
  //current_layer.bringToBack();
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

  //var show_image = document.getElementById('show_image');
  //if (show_image && !show_image.checked) return;

  var select = document.getElementById('dates');
  var selectedIndex = select.selectedIndex;

  if (selectedIndex < select.options.length-1) 
    select.selectedIndex++;
  else
    select.selectedIndex = 0;

  selectDate(select);
}

function goPrevious(o)
{
  if (animation_p) return;

  //var show_image = document.getElementById('show_image');
  //if (show_image && !show_image.checked) return;

  var select = document.getElementById('dates');
  var selectedIndex = select.selectedIndex;

  if (selectedIndex === 0) 
    select.selectedIndex = select.options.length-2;
  else
    select.selectedIndex--;

  selectDate(select);
}

function goAnimation(o)
{
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
  var png = `${jobID}/${jobID}-${date}.png`;

  if (current_png_layer !== null)
    map.removeLayer(current_png_layer);

  var d = getDate(''+date);
  d = d.toLocaleString().slice(0,19).replace(/T/g, ' ');

  var opacity = 1.0;
  var imageOverlay = await getImageLayer(png, opacity);
  imageOverlay.addTo(map);
  imageOverlay.date = d;

  imageOverlay.on({
    mouseover: onMouseOverPng,
    mouseout: onMouseOutPng,
  });

  current_png_layer = imageOverlay;
  xmarker._icon.style.display = 'block';
}

function setWait(disp)
{
  setDisplay('pwait', disp);
}

function onClickMarker(e)
{
  xmarker._icon.style.display = 'none';
  if (current_png_layer !== null)
  {
    map.removeLayer(current_png_layer);
    current_png_layer = null;
  }
}

