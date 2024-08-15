
let variable_array = [];

function getURI()
{
  var url = window.location.href;
  var ind = url.lastIndexOf("/");
  return url.substring(0, ind);
}

async function getText(url)
{
  return fetch(url)
    .then((response) => response.text())
    .then((text) => {
       console.log(`getText():: text = ${text}`);
       if (text === "" || text === null)
         return null;
       return text;
    });


}

function loadAjaxSync(url, params)
{

  var xmlhttp = new XMLHttpRequest();
  xmlhttp.open('POST', url, false);  //false: async; true: sync

  //Send the proper header information along with the request
  xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');

  xmlhttp.send(params);
  if (xmlhttp.status==200)
  {
    return xmlhttp.responseText;
  }
  else
  {
    alert('loadAjaxSync(): Can not load to = ' + url);
    console.log('loadAjaxSync(): Can not get load to = ' + url);
    return null;
  }
}

async function getDictionary(dictionary_file)
{
  dictionary_file = myCrypt(dictionary_file);
  var url = `${approot}/GetDictionay.php?key=${dictionary_file}`;
  var json = await getJson(url);
  return json;
}

function buildDatasetMenu(dictJSON)
{
  console.log(`buildDatasetMenu()`);

  var dataset = document.getElementById('dataset');

  for (const name in dictJSON)
  {
    var opt = document.createElement("option");
    opt.text = name;
    opt.value = name;
    dataset.add(opt);
  }

  buildJobVariableMenu(dataset);
}

function buildJobVariableMenu(dataset)
{
  var dataset_name = dataset.options[dataset.selectedIndex].value;
  console.log(`buildJobVariableMenu():: dataset_name = ${dataset_name}`);

  var variable_array = [];
  for (const name in dictJSON)
  {
    var obj = dictJSON[name];
    var variables = obj.variables;

    if (name === dataset_name)
    {
      var timeStep = obj.timeStep;
      if (!timeStep)
        timeStep = 'N/A';
      setTextValue('timeStep', timeStep);

      var variableNames = obj.variableNames;
      for (var i=0; i<variables.length; i++)
      {
        variable_array.push(variables[i]);
      }
    }
  }


  var job_variable = document.getElementById('job_variable');
  var i, L = job_variable.options.length-1;
  for(i=L; i>=0; i--) 
  {
    job_variable.remove(i);
  }

  for (var i=0; i<variable_array.length; i++)
  {
    var opt = document.createElement("option");
    opt.value = variable_array[i];
    opt.text = getVariableName(variableNames, variable_array[i]);
    job_variable.add(opt);
  }

  setUnit(job_variable);
  setDateRange();
}

function getVariableName(variableNames, variable)
{

  for (const [key, value] of Object.entries(variableNames)) {
    if (key.toUpperCase() === variable.toUpperCase())
    {
      return `${value} (${variable})`;
    }
  }
  return variable;
}

function setDateRange()
{
  var timeStep = document.getElementById('timeStep');
  if (timeStep)
  {
    var sd = document.getElementById('startdate');

    var ed = document.getElementById('enddate');

    if (sd && ed)
    {
      switch (timeStep.value)
      {
        case 'yearly':
          var qdate = new Date(sd.value);
          qdate.setFullyear(qdate.getFullyear() + 1); 
          qdate.setDate(qdate.getDate() - 1);
          var date = qdate.toISOString().slice(0,10); //.replace(/T/g, ' ');
          ed.value = date;
          sd.disabled = true;
          break;

        case 'monthly':
          var qdate = new Date(sd.value);
          qdate.setMonth(qdate.getMonth() + 1); 
          qdate.setDate(qdate.getDate() - 1);
          var date = qdate.toISOString().slice(0,10); //.replace(/T/g, ' ');
          ed.value = date;
          ed.disabled = true;
          break;

        case 'daily':
          ed.disabled = false;
          break;

        case 'partial day':
          ed.disabled = false;
          break;

        case 'hourly':
          ed.disabled = false;
          break;

        default:
          break;
      }
    }
  }
}

function setUnit(select)
{
  var variable = select.options[select.selectedIndex].value;
  console.log(`setUnit():: variable = ${variable}`);

  var select = document.getElementById('dataset');
  var dataset_name = select.options[select.selectedIndex].value;
  console.log(`setUnit():: dataset_name = ${dataset_name}`);

  for (const name in dictJSON)
  {
    if (name === dataset_name)
    {
      var obj = dictJSON[name];
      var units = obj.units;

      for (const item in units)
      {
        if (item === variable)
        {
          var unit = units[item];
          var inequality_unit_label = document.getElementById('inequality_unit_label');
          inequality_unit_label.innerHTML = `(${unit})`;
        }
      }
    }
  }

  var inequality_unit = document.getElementById('inequality_unit');
  inequality_unit.disabled = false;
}

function pad(str,length)
{
  let num = str-0;
  return num.toFixed(length);
}

function updateSpatial(layer)
{
  console.log('updateSpatial()');

  var coords = String(layer.getLatLngs());
  var coords = coords.replace(/LatLng\(/g, '');
  var coords = coords.substring(0, coords.length - 1);
  var coords = coords.split(")");
  var newCoords = '';
  for (i = 0; i < coords.length; i++) 
  {
    var thisCoord = coords[i].replace(/,/g, '');
    var individualCoords = thisCoord.split(' ');
    newCoords += pad(individualCoords[1], 2) + ' ' + pad(individualCoords[0], 2) + ',';
  }
  document.getElementById('spatial').value = newCoords.substring(0,newCoords.length - 1);

  selectedRegionCheck(newCoords.substring(0,newCoords.length - 1));
}

function selectedRegionCheck(str)
{
  var arr = str.split(',');
  var ll = arr[0];
  var ul = arr[1];
  var ur = arr[2];

  var ll_arr = ll.split(' ');
  var ul_arr = ul.split(' ');
  var ur_arr = ur.split(' ');

  var ll_lng = ll_arr[0];
  var ll_lat = ll_arr[1];
  var ul_lng = ul_arr[0];
  var ul_lat = ul_arr[1];
  var ur_lng = ur_arr[0];
  var ur_lat = ur_arr[1];

  var width = ur_lng - ul_lng;
  var height = ul_lat - ll_lat;
  
  if ((width*height) > MAX_AREA)
  {
    max_date = 7;
  }
  else
  {
    max_date = 31;
  }

  var edate = new Date(selectedDate.valueOf());
  edate.setDate(edate.getDate() + max_date);

  $('#enddate').datepicker('option', 'maxDate', edate);
}

function doInequalityChange(select)
{
  var inequality = select.options[select.selectedIndex].value;
  console.log(`setUnit():: inequality = ${inequality}`);

  var unit_title = document.getElementById('inequality_unit_title');

  if (inequality === 'anomalyEvent')
  {
    if (unit_title) unit_title.innerHTML = 'Value&nbsp;';

    var unit_label = document.getElementById('inequality_unit_label');
    if (unit_label) unit_label.innerHTML = '';
  }
  else
  {
    if (unit_title) unit_title.innerHTML = 'Units&nbsp;';

    var job_variable = document.getElementById('job_variable');
    setUnit(job_variable);
  }
}

function setInnerHTML(td, value)
{
  var o = document.getElementById(td);
  if (o)
  {
    o.textContent = value;
  }
}

function setTextValue(elem, value)
{
  var o = document.getElementById(elem);
  if (o)
  {
    o.value = value;
  }
}

function getTextValue(elem)
{
  var o = document.getElementById(elem);
  if (o)
  {
    var value = o.value;
    return(value.trim());
  }

  alert(`No ${elem} found.`); 
  return '';
}

function getSelectValue(elem)
{
  var o = document.getElementById(elem);
  if (o)
  {
    var value = o.options[o.selectedIndex].value;
    return(value.trim());
  }

  return '';
}

function setDisplay(td, disp)
{
  console.log(`setDisplay():: td = ${td}; disp = ${disp}`);
  var o = document.getElementById(td);
  if (o)
  {
    o.style.display = disp;
  }
}

function setVisibility(td, vis)
{
  var o = document.getElementById(td);
  if (o)
  {
    o.style.visibility = vis;
  }
}

function setDisabled(td, disabled)
{
  console.log(`setDisabled():: td = ${td}; disabled = ${disabled}`);
  var o = document.getElementById(td);
  if (o)
  {
    o.disabled = disabled;
    if (disabled)
      o.style.cursor = 'default';
    else
      o.style.cursor = 'pointer';
  }
}

function setDisableElem(elem, disabled)
{
  console.log(`setDisableElem():: elem = ${elem}; disabled = ${disabled}`);
  var o = document.getElementById(elem);
  if (o)
  {
    o.disabled = disabled;
  }
}

async function getJson(url)
{
  return fetch(url)
    .then((response) => response.json())
    .then((json) => {
       console.log(`getJson():: json = ${json}`);
       return json;
    });
}

function checkPhdefJobID()
{
  const x = document.getElementById('jobID');
  if (x)
  {
    var jobID = x.value.trim();;
    console.log(`checkJobID():: jobID = ${jobID}`);

    if (jobID !== '')
    {
      var url = `${approot}/CheckPhdefJobID.php`;
      console.log(`checkPhdefJobID():: url = ${url}`);

      var params = `jobID=${jobID}`;
      console.log(`dcheckPhdefJobIDoGetJobIDSubmit():: params = ${params}`);

      let jstr = loadAjaxSync(url, params);
      console.log(`dcheckPhdefJobIDoGetJobIDSubmit():: jstr = [${jstr}]`);

      if (jstr.trim() === '0')
      {
        alert(`No Job ID ${jobID} for 'phdef' found. Please enter another Job ID`);
        x.focus();

        return false;
      }

      return true;
    }

    return false;
  }

  return false;
}

function emailValidate(email)
{
  var at = email.indexOf('\@');
  if (at === -1)
  {
    return false;
  }
  else
  {
    return true;
  }
}

async function getJobID()
{

  setWait('none', 'getJobID');
  await setDisplay('jobID_div', 'block');
}

function isEmpty(str) 
{
  return (!str || str.trim().length === 0 );
}


// Create Base64 Object
var Base64={_keyStr:"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",encode:function(e){var t="";var n,r,i,s,o,u,a;var f=0;e=Base64._utf8_encode(e);while(f<e.length){n=e.charCodeAt(f++);r=e.charCodeAt(f++);i=e.charCodeAt(f++);s=n>>2;o=(n&3)<<4|r>>4;u=(r&15)<<2|i>>6;a=i&63;if(isNaN(r)){u=a=64}else if(isNaN(i)){a=64}t=t+this._keyStr.charAt(s)+this._keyStr.charAt(o)+this._keyStr.charAt(u)+this._keyStr.charAt(a)}return t},decode:function(e){var t="";var n,r,i;var s,o,u,a;var f=0;e=e.replace(/[^A-Za-z0-9\+\/\=]/g,"");while(f<e.length){s=this._keyStr.indexOf(e.charAt(f++));o=this._keyStr.indexOf(e.charAt(f++));u=this._keyStr.indexOf(e.charAt(f++));a=this._keyStr.indexOf(e.charAt(f++));n=s<<2|o>>4;r=(o&15)<<4|u>>2;i=(u&3)<<6|a;t=t+String.fromCharCode(n);if(u!=64){t=t+String.fromCharCode(r)}if(a!=64){t=t+String.fromCharCode(i)}}t=Base64._utf8_decode(t);return t},_utf8_encode:function(e){e=e.replace(/\r\n/g,"\n");var t="";for(var n=0;n<e.length;n++){var r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r)}else if(r>127&&r<2048){t+=String.fromCharCode(r>>6|192);t+=String.fromCharCode(r&63|128)}else{t+=String.fromCharCode(r>>12|224);t+=String.fromCharCode(r>>6&63|128);t+=String.fromCharCode(r&63|128)}}return t},_utf8_decode:function(e){var t="";var n=0;var r=c1=c2=0;while(n<e.length){r=e.charCodeAt(n);if(r<128){t+=String.fromCharCode(r);n++}else if(r>191&&r<224){c2=e.charCodeAt(n+1);t+=String.fromCharCode((r&31)<<6|c2&63);n+=2}else{c2=e.charCodeAt(n+1);c3=e.charCodeAt(n+2);t+=String.fromCharCode((r&15)<<12|(c2&63)<<6|c3&63);n+=3}}return t}}

function myDecrypt(str)
{
  console.log(`myDecrypt():: str = ${str}`);
  return(Base64.decode(str));
}

function myCrypt(str)
{
  console.log(`myDecrypt():: str = ${str}`);
  return(Base64.encode(str));
}

const SAFE_URL_PATTERN = /^(?:(?:https?|mailto):|[^&:/?#]*(?:[/?#]|$))/gi;

function sanitizeUrl(url)
{
  if (url.match(SAFE_URL_PATTERN)) return url;

  return `unsafe`;
}

function isNumeric(str)
{
  return !/\D/.test(str);
}

