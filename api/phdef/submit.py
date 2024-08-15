import re
import uvicorn
from fastapi import FastAPI
from fastapi.routing import APIRouter
from typing import Any, Dict, AnyStr, List, Union

@prefix_router.post("/submit")
async def test(arbitrary_json: JSONStructure = None):
  status = 'SUCCESS'
  msg = 'Job was successfully submitted'

  ## check all fields are not '' (except description)
  for key in arbitrary_json:
    value = str(arbitrary_json[key])
    if not value.strip():
      status = 'FAILED'
      msg = str(key.decode()) + " is empty.  Please check"
      return {"Status":status, "Message": msg}

    ## check region coord
    if (key.decode() == "region") and (not re.match('^[0-9? ,-.]+$', value)):
      status = 'FAILED'
      msg = "{} is invalid region. Please check".format(region)
      return {"Status":status, "Message": msg}

  return {"Status":status, "Message": msg}

