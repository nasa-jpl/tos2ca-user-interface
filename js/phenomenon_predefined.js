
let storms = null;
let stormsByYear = { "data": [] };

let fires = null;
let firesByYear = { "data": [] };

let locations = null;

function doSelectPhenominonType(ptype)
{
  var type_name = ptype.options[ptype.selectedIndex].value;
  console.log(`doSelectPhenominonType():: type_name = ${type_name}`);

  clearYearMenu();
  dataTable.search("").draw();
  
  setDisplay("data_table_td", "none");
  setDisplay("year_menu_td", "none");

  switch (type_name)
  {
    case "hurricane":
      dataTable.columns([4,5]).visible(false);

      console.log('do hurricane search');
      setDisplay("data_table_td", "block");
      setDisplay("year_menu_td", "block");
      buildStormsYearMenu();
      doStormsPopulate();
      break;

    case "CaWildFire":
      dataTable.columns([4,5]).visible(true);

      console.log('do Ca Wild Fire');
      setDisplay("data_table_td", "block");
      setDisplay("year_menu_td", "block");
      buildFiresYearMenu();
      doWildFiresPopulate();
      break;

    default:
      console.log('default');
      break;
  }
}

function doStormsPopulate()
{
  console.log(`doStormsPopulate():: stormsByYear = ${stormsByYear}`);
  console.log(stormsByYear);
  var data = stormsByYear.data;

  dataTable.clear();
  dataTable.rows.add(data);
  dataTable.draw();
}

function doWildFiresPopulate()
{
  console.log(`doWildFiresPopulate():: firesByYear = ${firesByYear}`);
  console.log(firesByYear);
  var data = firesByYear.data;

  dataTable.clear();
  dataTable.rows.add(data);
  dataTable.draw();
}

function clearYearMenu()
{
  var select = document.getElementById("year_menu");
  while (select.length > 0)
  {
    select.remove(select.length - 1);
  }
  var opt = document.createElement("option");
  opt.value = "-1";
  opt.text = "All years";
  select.add(opt);
}

function addYearMenu(year)
{
  var select = document.getElementById("year_menu");
  if (select)
  {
    var opt = document.createElement("option");
    opt.value = year
    opt.text = year;
    select.add(opt);
  }
}

async function buildStormsYearMenu()
{
  var url = `${approot}/GetStormsYear.php`;

  var txt = await getText(url);
  console.log(txt);
  
  var years = txt.split(',');
  for (var i=0; i<years.length; i++)
  {
    var year = years[i];
    addYearMenu(year.trim());
  }
}

async function buildFiresYearMenu()
{
  var url = `${approot}/GetFiresYear.php`;

  var txt = await getText(url);
  console.log(txt);
  
  var years = txt.split(',');
  for (var i=0; i<years.length; i++)
  {
    var year = years[i];
    addYearMenu(year.trim());
  }
}

async function getStorms()
{
  setDisplay('pwait', 'block');

  var url = `${approot}/GetStorms.php`;
  console.log(`getStorms():: url = ${url}`);

  storms = await getJson(url);
  console.log(storms);

  stormsByYear.data = [];
  for (var i=0; i<storms.data.length; i++)
  {
    var download = storms.data[i].download;
    var arr = download.split(',');
    var s = '';
    for (var j=0; j<arr.length; j++)
    {
      var f = arr[j];
      if (f !== 'None')
      {
        var idx = f.lastIndexOf('/');
        if (idx !== -1)
        {
          var fname = f.substring(idx+1);
          f = `<a href=\"#\" onclick=\"doDownload('${f}')\" title=\"download file\">${fname}</a>`; 
        }
        else
        {
          f = `<a href=\"#\" onclick=\"doDownload('${f}')\" title=\"download file\">${f}</a>`; 
        }
      }
      if (j !== 0)
        s += '<br>';
      s += f;
    }
    storms.data[i].download = s;
    stormsByYear.data[i] = storms.data[i]; 
  }

  console.log(`getStorms():: stormsByYear = ${stormsByYear}`);
  console.log(stormsByYear);

  setDisplay('pwait', 'none');
}

async function getFires()
{
  setDisplay('pwait', 'block');

  var url = `${approot}/GetFires.php`;
  console.log(`getFires():: url = ${url}`);

  fires = await getJson(url);
  console.log(fires);
  console.log(`getFires():: fires.data.length = ${fires.data.length}`);

  var url = `${approot}/GetLocations.php`;
  console.log(`getFires():: url = ${url}`);

  locations = await getJson(url);
  console.log(locations);
  console.log(`getFires():: locations.data.length = ${locations.data.length}`);

  firesByYear.data = [];
  for (var i=0; i<fires.data.length; i++)
  {
    var download = getLocation(locations.data, fires.data[i].sid);
    var arr = download.split(',');
 
    var dl = '';
    var mask = '';
    for (var j=0; j<arr.length; j++)
    {
      var f = arr[j];
      if (f !== 'None')
      {
        var midx = f.indexOf('Mask');
        var tidx = f.indexOf('TOC');
        if (midx !== -1 || tidx !== -1)
        {
          var idx = f.lastIndexOf('/');
          if (idx !== -1)
          {
            var fname = f.substring(idx+1);
            f = `<a href=\"#\" onclick=\"doDownload('${f}')\" title=\"download file\">${fname}</a>`; 
          }
          else
          {
            f = `<a href=\"#\" onclick=\"doDownloadFire('${f}')\" title=\"download file\">${f}</a>`; 
          }
          if (dl !== '')
            dl += '<br>';
          dl += f;
        }
        else
        {
          var jidx = f.indexOf('json');
          var pidx = f.indexOf('png');
          if (jidx !== -1 || pidx !== -1)
          {
            var idx = f.lastIndexOf('/');
            if (idx !== -1)
            {
              var fname = f.substring(idx+1);
              var jidx = f.indexOf('json');
              if (jidx !== -1)
              {
                f = `<a href=\"#\" onclick=\"doFireDownload('${f}')\" title=\"download file\">${fname}</a>`; 
              }
              else
              {
                var jidx = f.indexOf('png');
                if (jidx !== -1)
                {
                  f = `<a href=\"#\" onclick=\"showMask('${f}')\" title=\"show mask plot\">${fname}</a>`; 
                }
              }
              if (mask !== '')
                mask += '<br>';
              mask += f;
            }
          }
        }
      } // !== None
    }
    fires.data[i].download = dl;
    fires.data[i].mask = mask;
    fires.data[i].curation = 'na';
    firesByYear.data[i] = fires.data[i]; 
  }

  console.log(`getFires():: firesByYear = ${firesByYear}`);
  console.log(firesByYear);

  setDisableElem('phenomenon_type_menu', false);
  setDisableElem('year_menu', false);
  setDisplay('pwait', 'none');
}

function doSelectPhenominonYear(select)
{
  var year = select.options[select.selectedIndex].value;
  console.log(`doSelectPhenominonYear():: year = [${year}]`);

  var tmenu = document.getElementById("phenomenon_type_menu");
  var type = tmenu.options[tmenu.selectedIndex].value;
  console.log(`doSelectPhenominonYear():: type = [${type}]`);
  
  switch (type)
  {
    case "hurricane":
      stormsByYear.data = []; 
      for (var i=0; i<storms.data.length; i++)
      {
        var idx = storms.data[i].startDate.indexOf(year);
        if (idx !== -1)
          stormsByYear.data.push(storms.data[i]); 
      }
      doStormsPopulate();
      break;

    case "CaWildFire":
      firesByYear.data = []; 
      for (var i=0; i<fires.data.length; i++)
      {
        var idx = fires.data[i].startDate.indexOf(year);
        if (idx !== -1)
          firesByYear.data.push(fires.data[i]); 
      }
      doWildFiresPopulate();
      break;

    default:
      break;
  } 
}

async function doDownload(fname)
{
  console.log(`doDownload():: fname = ${fname}`);
 
  /*
  var idx = fname.indexOf('tos2ca-dev1');
  if (idx !== -1)
  {
    var file = fname.substring(idx+12);
    file = myCrypt(file);
    let url = `${approot}/downloadFileFromS3.php?key=${file}`;
    console.log(url);

    try
    {
      const res = await fetch(url, {
        method: 'GET',
      });
  
      const filename = await res.text();
      console.log(filename);
  
      //let href = `${approot}${filename}`;
      //console.log(href);
      //document.location.href = href;
    }
    catch (error)
    {
      console.log(error);
      alert(error);
    }
  }
  */
  
  var idx = fname.indexOf('tos2ca-dev1');
  if (idx !== -1)
  {
    var file = fname.substring(idx+12);
    file = myCrypt(file);
    var url = `${approot}/downloadFileFromS3.php?key=${file}`;
    console.log(`doDownload():: url = ${url}`);

    var a = document.createElement("a");
    a.id = "downloadnc";
    a.setAttribute('href', url);
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();

    a = document.getElementById('downloadnc');
    document.body.removeChild(a);
  }
}

async function doFireDownload(fname)
{
  console.log(`doFireDownload():: fname = ${fname}`);
 
  var idx = fname.indexOf('tos2ca-dev1');
  if (idx !== -1)
  {
    var file = fname.substring(idx+12);
    file = myCrypt(file);
    var url = `${approot}/downloadFireFileFromS3.php?key=${file}`;
    console.log(`doDownload():: url = ${url}`);

    var a = document.createElement("a");
    a.id = "downloadnc";
    a.setAttribute('href', url);
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();

    a = document.getElementById('downloadnc');
    document.body.removeChild(a);
  }
}

function getLocation(locations, sid)
{
  for (var i=0; i<locations.length; i++)
  {
    var json = locations[i];
    if ((json.sid-0) === (sid-0))
    {
      return json.location;
    }
  }
  return '';
}

function showMask(fname)
{
  console.log(`showMask():: fname = ${fname}`);
  var lastIndex = fname.lastIndexOf('/');
  var str = fname.substr(0,lastIndex-1);
  var secondLastIndex = str.lastIndexOf('/');
  var fname = fname.substr(secondLastIndex+1);

  var w = 550;
  var h = 700;

  var url = `https://tos2ca-dev1.jpl.nasa.gov/ShowMask.php?key=${fname}`;
  console.log('showMask():: url = ' + url);
  window.open(url, '_blank', 'scrollbars=yes,resizable=yes,width='+w+',height='+h);
}

