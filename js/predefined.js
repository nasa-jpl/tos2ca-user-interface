function doPredefined()
{
  console.log('doPredefined()');

  setDisplay('phenomenon_description', 'none');
  setDisplay('phenomenon_input', 'none');

  setDisplay('predefined_description', 'block');
  setDisplay('predefined_input', 'block');
}

function setDisplay(id, display)
{
  console.log(`setDisplay() ${id} - ${display}`);

  var div = document.getElementById(id);
  
  if (div !== null)
  {
    div.style.display = display;
  }
}

