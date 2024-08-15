
//var regex = new RegExp("^[A-Za-z0-9? ,-.]+$");
var regex = new RegExp("^[0-9? ,-.]+$");

async function doJobSubmit()
{
  console.log("doJobSubmit()");
  
  /*
  var first = document.getElementById("firstname").value;
  var last  = document.getElementById("lastname").value;
  var email = document.getElementById("email").value;
  */

  var first = getTextValue("firstname");
  var last  = getTextValue("lastname");
  var email = getTextValue("email");

  if (first === '' || last === '' || email === '')
  {
    alert('Please enter first name, last name, and email.');
    return;
  }

  var select = document.getElementById("dataset");
  var dataset = select.options[select.selectedIndex].value;

  var select = document.getElementById("job_variable");
  var job_variable = select.options[select.selectedIndex].value;

  var start = document.getElementById("startdate").value;
  var end   = document.getElementById("enddate").value;

  var spatial = document.getElementById("spatial").value;

  if (spatial === '')
  {
    alert('Please select an area.');
    return;
  }

  if (!regex.test(spatial))
  {
    alert('Invalid spatial area. Please use map to select an area.');
    return;
  }

  var select = document.getElementById("inequality_type");
  var type = select.value;

  var unit = document.getElementById("inequality_unit").value;

  if (unit === '')
  {
    alert('Please enter an inequality unit.');
    return;
  }

  var desc = document.getElementById("description").value;

  
  // GetUserID.php
  var url = `${approot}/GetUserID.php`;
  console.log(`doJobSubmit():: url = ${url}`);

  var params = `last=${last}&first=${first}&email=${email}`;
  console.log(`doJobSubmit():: params = ${params}`);

  let userId = loadAjaxSync(url, params);
  userId = myDecrypt(userId);
  console.log(`doJobSubmit():: userId = ${userId}`);

  // JobInsert.php 
  var arr = spatial.split(',');
  arr.push(arr[0]);
  var coords = arr.toString();
  var polygon = `POLYGON((${coords}))`;
  console.log(polygon);

  start = `${start} 00:00:00`;
  end = `${end} 23:59:59`;

  // for first stage now
  var stage = 'phdef';
  var qstatus = 'pending';


  var url = `${approot}/JobInsert.php`;
  console.log(`url = ${url}`);

  var params = `${userId};${stage};${dataset};${job_variable};${polygon};${start};${end};${type};${unit};${qstatus}`;


  // make desc separate to prevent desc has ';' which is the separater in JobInsert.php
  var data = new FormData();
  data.append( "params", params);
  data.append( "desc", desc);

  const response = await fetch(url, {
    method: 'POST',
    body: data
  });
  console.log(response.status);
  console.log(response.ok);

  //if (affected_rows == 1)
  if (response.status === 200 && response.ok === true)
  {
    alert(`SUCESSFUL: The job was submitted sucessfully`);
  }
  else
  {
    alert(`FAILED: The job submit was failed`);
  }
}


