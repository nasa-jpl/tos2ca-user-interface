import uvicorn
from fastapi import FastAPI

app = FastAPI()

@app.get("/hello")
async def hello(name:str,age:int):
  return {"name": name, "age":age}

if __name__ == "__main__":
   uvicorn.run("main:app", 
               host="100.104.96.40", 
               port=8080, 
               reload=True)
