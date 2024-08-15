
function getStatus()
{
  let url = `${approot}/${GetStatus.php}`;
  var text = this.getTextAjaxSync(url, "application/text");
  if (text == "" || text == null)
    return null;
  cosole.log(text);
}

