<!DOCTYPE html>
<html lang="en">
<head>
  <title>TOS2CA | S3 Fetch</title>

<script>

async function init()
{
  try
  {
    let url = 'https://tos2ca-dev1.s3.amazonaws.com/';
    const req = await fetch(url);
    const res = await req.json();
  }
  catch (error)
  {
    console.log(error);
  }
}

</script>

</head>

<body onLoad="init()">

Hello!

</body>
</html>
