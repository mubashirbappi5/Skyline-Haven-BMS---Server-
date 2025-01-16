const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 7000

app.use(cors())
app.use(express.json())





const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.S3_BUCKET}:${process.env.SECRET_KEY}@cluster0.ig6ro.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {


    const ApartmentsDatabace = client.db("SkylineDb").collection("apartment");
    const UsersDatabace = client.db("SkylineDb").collection("users");
    const AgreementReqDatabace = client.db("SkylineDb").collection("agreeReq");
    const AcceptedReqDatabace = client.db("SkylineDb").collection("AcceptReq");
    // Connect the client to the server	(optional starting in v4.7)
// users api

app.post('/users',async(req,res)=>{
  const userData = req.body
  const query = {userEmail:userData?.userEmail}
  const existinguser = await UsersDatabace.findOne(query)
  console.log(existinguser)
  if(existinguser){
    return res.send ({message:'User All ready exist'})
  }
  const result = await UsersDatabace.insertOne(userData)
  res.send(result)
})

app.patch('/users/:email',async(req,res)=>{
    const email = req.params.email
    
    const query ={userEmail:email}

    const updatedoc ={
      $set:{
        role:'member'
      }
    }
    const result = await UsersDatabace.updateOne(query,updatedoc)
    res.send(result)

})

app.get('/users',async(req,res)=>{
  const result = await UsersDatabace.find().toArray()
  res.send(result)
})
// admin api 

app.get('/users/admin/:email',async(req,res)=>{
  const email = req.params.email
  const query = {userEmail: email };
  const user = await UsersDatabace.findOne(query);
  let admin = false;
  if (user) {
    admin = user?.role === 'admin';
  }
  res.send({ admin });
 
})



// 

    app.get('/apartments',async(req,res)=>{
       
         const result = await ApartmentsDatabace.find().toArray()
         res.send(result)
       })



// agreement request api 

app.post('/request',async(req,res)=>{
  const request = req.body;
  const result = await AgreementReqDatabace.insertOne(request)
  res.send(result)
})

app.get('/request',async(req,res)=>{
  const result = await AgreementReqDatabace.find().toArray()
  res.send(result)
})

app.delete('/request/:id',async(req,res)=>{
  const id = req.params.id
  const query = { _id: new ObjectId(id) }
  const result = await AgreementReqDatabace.deleteOne(query)
  res.send(result)
})

// accept request api

app.post('/accept',async(req,res)=>{
  const acceptData = req.body
  const result = await AcceptedReqDatabace.insertOne(acceptData)
  res.send(result)
})


    // await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello skyline World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})