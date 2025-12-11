import re
import json
import uvicorn
import pymysql
import configparser
from fastapi import FastAPI
from fastapi.routing import APIRouter
from typing import Any, Dict, AnyStr, List, Union
from pydantic import BaseModel

app = FastAPI()
api_router = APIRouter(prefix="/api")
api_phdef_router = APIRouter(prefix="/phdef")
api_data_curation_router = APIRouter(prefix="/data-curation")

configfile = 'db.conf'
config = configparser.ConfigParser()
config.read(configfile)

default = config['DEFAULT']
username = default["DB_USERNAME"]
passwd = default["DB_PASSWD"]
dbname = default["DB_NAME"]

class PhDef(BaseModel):
  firstName: str
  lastName: str
  email: str
  dataset: str
  variable: str
  startDate: str
  endDate: str
  coords: str
  ineqOperator: str
  ineqValue: str
  description: str = None

class dataCuration(BaseModel):
  jobID: int
  firstName: str
  lastName: str
  email: str
  dataset: str
  variable: str
  description: str = None

@api_router.get("/")
async def hello():
  return {"Hello World!!"}


@api_router.post("/phdef/submit")
async def submit(item: PhDef):
  email = item.email
  lastName = item.lastName
  firstName = item.firstName
  dataset = item.dataset
  variable = item.variable
  startDate = item.startDate
  endDate = item.endDate
  coords = item.coords
  ineqOperator = item.ineqOperator
  ineqValue = item.ineqValue
  desc = item.description

  stage = 'phdef'
  status = 'pending'

  ## check region coord
  if not re.match('^[0-9? ,-.]+$', coords):
    status = 'FAILED'
    msg = "{} is invalid region. Please check".format(coords)
    return {"Status":status, "Message": msg}

  conn, cur = mysqlconnect()

  userID = getUserID(conn, cur, email, lastName, firstName)

  sql = "INSERT INTO jobs (userID, stage, dataset, variable, coords, startDate, endDate, ineqOperator, ineqValue, description, status) VALUES ({}, '{}', '{}', '{}', ST_PolygonFromText('{}'), '{}', '{}', '{}', '{}', '{}', '{}')".format(userID, stage, dataset, variable, polygon, startDate, endDate, ineqOperator, ineqValue, desc, status)

  try:
    cur.execute(sql)
    conn.commit()
  except:
    return {"Status":"[FAILED]", "Message": "Job submitted FAILED"}
  finally:
    conn.close()

  return {"Status":"[SUCCESS]", "Message": "Job was successfully submitted"}


@api_router.get("/phdef/status")
async def status(jobID: int):
  return getStatusByjobID(jobID, 'phdef') 


@api_router.get("/phdef/list")
async def list(q: str):
  #print(q)
  ## create json object from string q
  obj = json.loads(q)
  if "email" in obj:
    email = obj["email"]
    return getStatusByEmail(email, 'phdef') 


@api_router.post("/data-curation/submit")
async def submit(item: dataCuration):
  phdefJobID = item.jobID
  email = item.email
  lastName = item.lastName
  firstName = item.firstName
  dataset = item.dataset
  variable = item.variable
  desc = item.description
  stage = 'curation';
  status = 'pending';

  if not emailValidate(email):
    return {"Status":"[FAILED]", "Message": "Invalid email {}".format(email)}

  conn, cur = mysqlconnect()

  if not checkPhdefJobID(conn, cur, phdefJobID):
    return {"Status":"[FAILED]", "Message": "No phdef job for jobID {}".format(phdefJobID)}

  userID = getUserID(conn, cur, email, lastName, firstName)

  sql = "INSERT INTO jobs (userID, stage, phdefJobID, dataset, variable, description, status) VALUES ({}, '{}', {}, '{}', '{}', '{}', '{}')".format(userID, stage, phdefJobID, dataset, variable, desc, status)
  #print(sql)

  try:
    cur.execute(sql)
    conn.commit()
  except:
    return {"Status":"[FAILED]", "Message": "Job submitted FAILED"}
  finally:
    conn.close()

  return {"Status":"[SUCCESS]", "Message": "Job was successfully submitted"}


@api_router.get("/data-curation/status")
async def status(jobID: int):
  return getStatusByjobID(jobID, 'curation') 


@api_router.get("/data-curation/list")
async def list(q: str):
  #print(q)
  obj = json.loads(q)
  if "email" in obj:
    email = obj["email"]
    return getStatusByEmail(email, 'curation') 


@api_router.get("/location")
async def location(jobID: int):
  return getLocationByjobID(jobID) 


@api_router.get("/nc4")
async def nc4(jobID: int, typep: str):
  return getOutputLocation(jobID, typep) 


@api_router.get("/monthly")
async def monthly(month: str):
  return getMonthlyData(month) 


####################################################
def checkPhdefJobID(conn, cur, phdefJobID):
  sql = "SELECT * from jobs WHERE JobID={} and stage='phdef'".format(phdefJobID)
  #print(sql)

  result = -1
  try:
    cur.execute(sql)
    output = cur.fetchall()

    if (len(output) > 0):
      result = True 
    else:
      result = False
  except:
    result = False

  return result


def emailValidate(email):
  at = email.index('@')
  if (at == -1):
    return False;
  else:
    return True;


def getStatusByjobID(jobID, stage):
  sql = "SELECT userID, phdefJobID, stage, status, dataset, variable, ST_ASText(coords) as coords, startDate, endDate, ineqOperator, ineqValue, description from jobs where jobID={}".format(jobID)
  if (stage == 'curation'):
    sql = "SELECT userID, phdefJobID, stage, status, dataset, variable, ST_ASText(coords) as coords, startDate, endDate, ineqOperator, ineqValue, description from jobs where stage='{}' and jobID={}".format(stage, jobID)
  #print(sql)

  conn, cur = mysqlconnect()

  msg = []
  try:
    cur.execute(sql)
    output = cur.fetchall()
    #print(output)

    if (len(output) > 0):
      for item in output:
        status = item["status"]
        msg.append({"jobID": jobID, "status": status, "doc": item})
    else:
      msg.append({"jobID": jobID, "status": "Not Found", "doc": {}})
  except:
    msg.append({"jobID": jobID, "status": "Query Failed", "doc": {}})
  finally:
    conn.close()

  return msg


def getOutputLocation(jobID, typep):

  sql = "SELECT o.location FROM output o WHERE o.jobID={} AND o.type='{}'".format(jobID, typep)
  ##print(sql)

  conn, cur = mysqlconnect()

  msg = []
  try:
    cur.execute(sql)
    output = cur.fetchall()
    #print(output)

    if (len(output) > 0):
      for item in output:
        msg.append(item)
    else:
      msg.append({"jobID": jobID, "location": 'not foundd', "variable": 'not found'})
  except:
    msg.append({"jobID": jobID, "location": "Query Failed", "variable": 'Query Failed'})
  finally:
    conn.close()

  return msg

def getLocationByjobID(jobID):
  sql = "SELECT j.phdefJobID, j.jobID, o.location, j.variable, j.description FROM output o, jobs j WHERE o.jobID=j.jobID AND o.type='interpolated subset' AND j.phdefJobID={}".format(jobID)

  conn, cur = mysqlconnect()

  msg = []
  try:
    cur.execute(sql)
    output = cur.fetchall()
    filteredOutput = []
    for o in output:
        if o['location'].split('/')[-1].count('-') == 2:
            filteredOutput.append(o)
    output = filteredOutput

    if (len(output) > 0):
      for item in output:
        msg.append(item)
    else:
      msg.append({"jobID": jobID, "location": 'not found', "variable": 'not found'})
  except:
    msg.append({"jobID": jobID, "location": "Query Failed", "variable": 'Query Failed'})
  finally:
    conn.close()

  return msg


def getStatusByEmail(email, stage):
  conn, cur = mysqlconnect()

  userIDList = getUserIDList(conn, cur, email)
  idlist = ",".join(str(x) for x in userIDList)

  sql = "SELECT status, dataset, stage, variable, ST_ASText(coords) as coords, startDate, endDate, ineqOperator, ineqValue, description from jobs where stage='{}' and userID IN ({})".format(stage, idlist)
  #print(sql)

  msg = []
  try:
    cur.execute(sql)
    output = cur.fetchall()
    #print(output)
    #print(len(output))

    if (len(output) > 0):
      for item in output:
        status = item["status"]
        #print(status)
        msg.append({"email": email, "status": status, "doc": item})
    else:
      msg.append({"email": email, "status": "Not Found", "doc": {}})
  except:
    msg.append({"email": email, "status": "Query Failed", "doc": {}})
  finally:
    conn.close()

  return msg


def getUserID(conn, cur, email, lastName, firstName):
  sql = "select userID, lastName, firstName, email from users where LOWER(email)='{}'".format(email.lower())
  #print(sql)

  cur.execute(sql)
  output = cur.fetchall()

  if (len(output) > 0):
    return output[0]["userID"]
  else:
    sql = "insert into users (lastName, firstName, email) values ('{}', '{}', '{}')".format(lastName, firstName, email)
    cur.execute(sql)
    conn.commit()

    sql = "select userID, lastName, firstName, email from users where LOWER(email)='{}'".format(email.lower())

    cur.execute(sql)
    output = cur.fetchall()

    return output[0]["userID"]


def getUserIDList(conn, cur, email):
  sql = "select userID from users where LOWER(email)='{}'".format(email.lower())
  #print(sql)

  cur.execute(sql)
  output = cur.fetchall()
  ## print(output)

  userIDList = []
  if (len(output) > 0):
    for item in output:
      userIDList.append(item["userID"])

  return userIDList


def mysqlconnect():
  conn = pymysql.connect(host="your-database-server",
                       user=username,
                       passwd=passwd,
                       db=dbname)

  cur = conn.cursor(pymysql.cursors.DictCursor)
  return (conn, cur)


from pathlib import Path
download_dir = 'downloads'

def getMonthlyData(month): 
  fname = f'{download_dir}/{month}.txt'
  print(fname)
  txt = Path(fname).read_text()
  return txt


api_router.include_router(api_phdef_router)
api_router.include_router(api_data_curation_router)
app.include_router(api_router)

if __name__ == "__main__":
  uvicorn.run("main:app", 
              host="yourwebsite.com", 
              port=8080, 
              ssl_keyfile="/path/to/key/keyfile.key", 
              ssl_certfile="/path/to/certs/certfile.crt",
              reload=True)

