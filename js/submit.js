
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

  var select = document.getElementById("algorithm");
  var algorithm = select.options[select.selectedIndex].value;

  if (algorithm === '') 
  {
    alert('Please select and algorithm.');
    return;
  }

  if (algorithm === 'fortracc')
  {
    var select = document.getElementById("dataset");
    var dataset = select.options[select.selectedIndex].value;

    var select = document.getElementById("job_variable");
    var job_variable = select.options[select.selectedIndex].value;
    
    var select = document.getElementById("inequality_fortracc_type");
    var type = select.value;

    var unit = document.getElementById("inequality_fortracc_unit").value;
    if (unit === '')
    {
      alert('Please enter an inequality value.');
      return;
    }

    var warmer_toggle = 'NULL';
    var warmer_threshold = 'NULL';

  } else if (algorithm === 'auxgeoir')
  {
    var dataset = getTextValue("dataset");
    var job_variable = getTextValue("job_variable");

    var type = getTextValue("inequality_auxgeoir_type");

    var unit = document.getElementById("inequality_auxgeoir_unit").value;
    if (unit === '')
    {
      alert('Please enter an inequality value.');
      return;
    }

    var select = document.getElementById("warmer_toggle");
    var warmer_toggle = select.value;
    if (warmer_toggle === '')
    {
      alert('Please select an option for "Warmer Toggle."');
      return;
    }


    var warmer_threshold = document.getElementById("warmer_threshold").value;    
    if (warmer_toggle === "on" && warmer_threshold === '')
    {
      alert('Please enter warmer threhold value.');
      return;
    }
    if (warmer_toggle === "off")
    {
      var warmer_threshold = 'NULL';
    }
    if (algorithm != 'auxgeoir')
    {
      var warmer_toggle = 'NULL';
      var warmer_threshold = 'NULL';
    }

  } else {
    alert('No valid algorithm selected.');
    return;
  }

  var startdate = document.getElementById("startdate").value;
  var enddate   = document.getElementById("enddate").value;

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


  var desc = document.getElementById("description").value;
  if (desc === '')
    desc = 'NULL';
  
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

  start = `${startdate} 00:00:00`;
  end = `${enddate} 23:59:59`;

  // for first stage now
  var stage = 'phdef';
  var qstatus = 'pending';

  var url = `${approot}/JobInsert.php?userID=${userId}&stage=${stage}&dataset=${dataset}&variable=${job_variable}&polygon=${polygon}&startDate=${start}&endDate=${end}&ineqOperator=${type}&ineqValue=${unit}&status=${qstatus}&desc=${desc}&algorithm=${algorithm}&warmerToggle=${warmer_toggle}&warmerThreshold=${warmer_threshold}`;
  console.log(`url = ${url}`);

  let affected_rows = await fetch(url)
    .then((response) => response.text())
    .then((text) => {
       return text;
    });
  console.log(`affected_rows = ${affected_rows}`);

  if ((affected_rows-0) == 1)
  {
    alert(`SUCESSFUL: The job was submitted sucessfully`);
  }
  else
  {
    alert(`FAILED: The job submit was failed`);
  }

  /*
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
  */
}


