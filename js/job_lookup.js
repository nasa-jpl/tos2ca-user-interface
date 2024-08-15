async function doJobLookup()
{
  var jobID = getTextValue('jobID'); 
  var email = getTextValue('email'); 
  var firstname = getTextValue('firstname'); 
  var lastname = getTextValue('lastname'); 

  console.log(`jobID = ${jobID}`);
  console.log(`email = ${email}`);  
  console.log(`firstname = ${firstname}`);
  console.log(`lastname = ${lastname}`);

  clearJobDisplay();

  dataTable.clear();
  dataTable.rows.add([]);
  dataTable.draw();

  setWait('pwait', 'block', 'doLookup()')
  if (jobID)
  {
    let job = await getCurationJob(jobID); //phdef or curation job
    if (job)
    {
      showJobInfo(job);
    }
    else
    {
      alert(`No job(s) for ${jobID} availble.  Please enter another JobID.`);
      return '';
    }
  }
  else
  {
    if (email)
    {
      await showJobByEmail(email).then(() => setWait('pwait', 'none', 'doLookup(email)'));
    }
    else if (firstname && lastname)
    {
      setWait('pwait', 'block', 'doLookup(name)')
      await showJobByName(firstname, lastname).then(() => setWait('pwait', 'none', 'doLookup(name)'));
    }
    else
    {
      alert(`Please enter either JobID, email, or firstname and lastname.`);
      return '';
    }
  }
  setWait('pwait', 'none', 'doLookup()')
}

async function showJobByEmail(email)
{
  var params = `email=${email}`;
  console.log(`getJob():: params = ${params}`);

  var url = `${approot}/GetJobByEmail.php`;
  console.log(`getJob():: url = ${url}`);

  let jstr = await loadAjaxSync(url, params);
  console.log(`getJob():: jstr = ${jstr}`);

  if (!isEmpty(jstr.trim()))
  {
    var jobs = JSON.parse(jstr);
    if (jobs.length > 0)
      await showJobs(jobs);
    else
      alert(`No job(s) for ${email} availble.  Please check email.`);
  }
  else
  {
    alert(`No job(s) for ${email} availble.  Please check email.`);
  }
}

async function showJobByName(firstname, lastname)
{
  var params = `firstname=${firstname}&lastname=${lastname}`;

  var url = `${approot}/GetJobByName.php`;

  let jstr = await loadAjaxSync(url, params);

  if (!isEmpty(jstr.trim()))
  {
    var jobs = JSON.parse(jstr);
    if (jobs.length > 0)
      await showJobs(jobs);
    else
      alert(`No job(s) for ${firstname} and ${lastname} availble.  Please check last name and first name.`);
  }
  else
  {
    alert(`No job(s) for ${firstname} and ${lastname} availble.  Please check last name and first name.`);
  }
}

async function showJobs(jobs)
{
  let data = [];
  for (var i=0; i<jobs.length; i++)
  {
    var phdefJob = jobs[i];
    let curationJobs = await geAlltCurationJobs(phdefJob.jobID); //get all curation jobs by phdefJobID

    if (curationJobs.length > 0)
    {
      for (var k=0; k<curationJobs.length; k++)
      {
        var j = curationJobs[k];
        var r = { "PhDefJobID": phdefJob.jobID, "PhDefDataSet": phdefJob.dataset, "DataCurationID": j.jobID, "DataCurationDataSet": j.dataset};
        data.push(r);
      }
    }
    else
    {
      var r = { "PhDefJobID": phdefJob.jobID, "PhDefDataSet": phdefJob.dataset, "DataCurationID": "", "DataCurationDataSet": ""};
      data.push(r);
    }
  }
  dataTable.clear();
  dataTable.rows.add(data);
  dataTable.draw();
}

async function getCurationJob(jobID)
{
  var params = `jobID=${jobID}`;
  console.log(`getJob():: params = ${params}`);

  var url = `${approot}/GetAJob.php`;
  console.log(`getJob():: url = ${url}`);

  let jstr = await loadAjaxSync(url, params);
  console.log(`getJob():: jstr = [${jstr}]`);

  if (!isEmpty(jstr.trim()))
  {
    return JSON.parse(jstr);
  }

  return null;
}

async function geAlltCurationJobs(jobID)
{
  var params = `jobID=${jobID}`;

  var url = `${approot}/GetJobByPhdefID.php`;

  let jstr = await loadAjaxSync(url, params);

  if (!isEmpty(jstr))
  {
    return JSON.parse(jstr);
  }

  return null;
}

async function showJobInfo(job)
{
  console.log(`job = ${job}`);
  console.log(job);

  setInnerHTML('phJobID', job.jobID); 
  setInnerHTML('phStage', job.stage); 
  setInnerHTML('phDataSet', job.dataset); 
  setInnerHTML('phVariable', job.variable); 
  setInnerHTML('phDescription', job.description); 

  let curationJobs = [];

  let data = [];
  let jobs = []; 
  if (job.stage === 'phdef')
  {
    if (job.ineqOperator)
    {
      setInnerHTML('phInequality', job.ineqOperator); 
      setInnerHTML('phInequalityValue', job.ineqValue); 
    }
    else
    {
      setInnerHTML('phInequality', job.ineqOperator); 
      setInnerHTML('phInequalityValue', job.ineqValue); 
    }

    if (job.startDate && job.endDate)
      dateStr = `${job.startDate} to ${job.endDate}`;

    setInnerHTML('phDateRange', dateStr); 
    setInnerHTML('phCurationJobs', ''); 

    curationJobs = await geAlltCurationJobs(job.jobID); //get all curation jobs by phdefJobID
    console.log(curationJobs);

    if (curationJobs.length > 0)
    {
      for (var k=0; k<curationJobs.length; k++)
      {
        var j = curationJobs[k];
        jobs.push(j.jobID);
        var r = { "PhDefJobID": job.jobID, "PhDefDataSet": job.dataset, "DataCurationID": j.jobID, "DataCurationDataSet": j.dataset};
        data.push(r);
      }
    }
    setInnerHTML('phCurationJobs', jobs.toString()); 

    dataTable.clear();
    dataTable.rows.add(data);
    dataTable.draw();
  }
  else // curation
  {
    let phdefJobID = job.phdefJobID;
    let phdefJob = await getCurationJob(phdefJobID); //get parent job

    if (!isEmpty(phdefJobID) && !isEmpty(phdefJob))
    { 
      if (job.ineqOperator && job.ineqValue)
      {
        setInnerHTML('phInequality', job.ineqOperator); 
        setInnerHTML('phInequalityValue', job.ineqValue); 
      }
      else
      {
        setInnerHTML('phInequality', phdefJob.ineqOperator); 
        setInnerHTML('phInequalityValue', phdefJob.ineqValue); 
      }

      let dateStr = '';
      if (job.startDate && job.endDate)
      {
        dateStr = `${job.startDate} to ${job.endDate}`;
      }
      else
      {
        dateStr = `${phdefJobID.startDate} to ${phdefJobID.endDate}`;
      }
      setInnerHTML('phDateRange', dateStr); 
      setInnerHTML('phCurationJobs', ''); 
    }
  } 
}

async function getJobInfo(jobID)
{
  console.log(`getJobInfo()::jobID = ${jobID}`);
  clearJobDisplay();
  var job = await getCurationJob(jobID);
  console.log(job);
  if (job.stage === 'curation')
    showCurationJobInfo(job);
  else
    showPhDefJobInfo(job);
}

async function showCurationJobInfo(job)
{
  console.log(`showCurationJobInfo()::job = ${job}`);
  console.log(job);

  setInnerHTML('phJobID', job.jobID); 
  setInnerHTML('phStage', job.stage); 
  setInnerHTML('phDataSet', job.dataset); 
  setInnerHTML('phVariable', job.variable); 

  let phdefJobID = job.phdefJobID;
  console.log(`phdefJobID = ${phdefJobID}`);
  let phdefJob = await getCurationJob(phdefJobID); //get parent job
  console.log(phdefJob);
  
  if (!isEmpty(phdefJobID) && !isEmpty(phdefJob))
  { 
    if (job.ineqOperator && job.ineqValue)
    {
      setInnerHTML('phInequality', job.ineqOperator); 
      setInnerHTML('phInequalityValue', job.ineqValue); 
    }
    else
    {
      setInnerHTML('phInequality', phdefJob.ineqOperator); 
      setInnerHTML('phInequalityValue', phdefJob.ineqValue); 
    }

    let dateStr = '';
    if (job.startDate && job.endDate)
    {
      dateStr = `${job.startDate} to ${job.endDate}`;
    }
    else
    {
      dateStr = `${phdefJob.startDate} to ${phdefJob.endDate}`;
    }
    setInnerHTML('phDateRange', dateStr); 
    setInnerHTML('phCurationJobs', ''); 
  }
}

async function showPhDefJobInfo(job)
{
  console.log(`showPhJobInfo()::job = ${job}`);
  console.log(job);

  setInnerHTML('phJobID', job.jobID); 
  setInnerHTML('phStage', job.stage); 
  setInnerHTML('phDataSet', job.dataset); 
  setInnerHTML('phVariable', job.variable); 
  setInnerHTML('phInequality', job.ineqOperator); 
  setInnerHTML('phInequalityValue', job.ineqValue); 
  setInnerHTML('phDescription', job.description); 

  let dateStr = `${job.startDate} to ${job.endDate}`;
  setInnerHTML('phDateRange', dateStr); 

  let curationJobs = await geAlltCurationJobs(job.jobID); //get all curation jobs by phdefJobID
  console.log(curationJobs);

  let jobs = [];
  for (var i=0; i<curationJobs.length; i++)
  {
    let j = curationJobs[i];
    jobs.push(j.jobID);
  }
  setInnerHTML('phCurationJobs', jobs.toString()); 
}

function setWait(divname, disp, where)
{
  var o = document.getElementById(divname);
  console.log(`setWait():: ${where} - disp = ${disp}`);
  if (o)
  {
    o.style.display = disp;
  }
}

function clearJobDisplay()
{
  setInnerHTML('phJobID', ''); 
  setInnerHTML('phStage', ''); 
  setInnerHTML('phDataSet', ''); 
  setInnerHTML('phVariable', ''); 
  setInnerHTML('phInequality', ''); 
  setInnerHTML('phInequalityValue', ''); 
  setInnerHTML('phDescription', ''); 
  setInnerHTML('phDateRange', ''); 
  setInnerHTML('phCurationJobs', ''); 
}
