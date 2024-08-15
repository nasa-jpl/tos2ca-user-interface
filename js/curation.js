
function buildCurationDatasetMenu(dictJSON)
{
  console.log(`buildCurationDatasetMenu()`);

  var dataset = document.getElementById('dataset');
  for (const name in dictJSON)
  {
    var opt = document.createElement("option");
    opt.text = name;
    opt.value = name;
    dataset.add(opt);
  }

  buildCurationJobVariableMenu(dataset);
}

function buildCurationJobVariableMenu(dataset)
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

async function doCurationSubmit()
{
  console.log('Data Curation Submit');

  var phdefJobID = getTextValue("jobID");
  var email = getTextValue("email");
  var first = getTextValue("firstname");
  var last = getTextValue("lastname");

  if (phdefJobID === '' || first === '' || last === '' || email === '')
  {
    alert('Please enter phdefJobID, first name, last name, and email.');
    return;
  }


  if (!checkPhdefJobID())
  {
    return;
  }

  if (!emailValidate(email))
  {
    alert('Please enter a valid email.');
    return;
  }

  var dataset = getSelectValue("dataset");
  var variable = getSelectValue("job_variable");

  var desc = getTextValue("description");

  console.log(`${phdefJobID}, ${email}, ${first}, ${last}, ${dataset}, ${variable}, ${desc}`);

  var url = `${approot}/GetUserID.php`;
  console.log(`doCurationSubmit():: url = ${url}`);

  var params = `last=${last}&first=${first}&email=${email}`;
  console.log(`doCurationSubmit():: params = ${params}`);

  let userID = await loadAjaxSync(url, params);
  userID = myDecrypt(userID);
  console.log(`doCurationSubmit():: userID = ${userID}`);

  // for first stage now
  var stage = 'curation';
  var stat = 'pending';

  var url = `${approot}/CurationInsert.php`;
  console.log(`doCurationSubmit():: url = ${url}`);

  var option = `?phdefJobID=${phdefJobID}&userID=${userID}&stage=${stage}&dataset=${dataset}&stat=${stat}&variable=${variable}&desc=${desc}`;
  console.log(`doCurationSubmit():: option = ${option}`);

  let formData = new FormData();
  formData.append('phdefJobID', phdefJobID);
  formData.append('userID', userID);
  formData.append('stage', stage);
  formData.append('dataset', dataset);
  formData.append('stat', stat);
  formData.append('variable', variable);
  formData.append('desc', desc);


  const response = await fetch(url, {
    method: 'POST',
    body: formData 
  });
  console.log(response);
  console.log(response.status);
  console.log(response.ok);

  if (response.status === 200 && response.ok === true)
  {
    alert(`SUCESSFUL: The curation job for Phenomena Definition Job ID ${phdefJobID} was submitted sucessfully.`);
  }
  else
  {
    alert(`FAILED: The curation job for Phenomena Definition Job ID ${phdefJobID} FAILED to submit.`);
  }
}

