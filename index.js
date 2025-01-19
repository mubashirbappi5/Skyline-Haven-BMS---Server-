const express = require('express')
const jwt = require('jsonwebtoken')
const app = express()
const cors = require('cors')

require('dotenv').config()
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
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
    const AnnouncementDatabace = client.db("SkylineDb").collection("notice");
    const CouponDatabace = client.db("SkylineDb").collection("coupon");
    const PaymentDatabace = client.db("SkylineDb").collection("payment");
    // Connect the client to the server	(optional starting in v4.7)


    // JWT Api


    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JwT_Token, { expiresIn: '2h' });
      res.send({ token });
    })


    const verifyToken = (req, res, next) => {
     
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'unauthorized access' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.JwT_Token, (err, decoded) => {
        if (err) {
          return res.status(401).send({ message: 'unauthorized access' })
        }
        req.decoded = decoded;
        next();
      })
    }   


    const verifyAdmin = async (req, res, next) => {
      const email = req.decoded.email;
      const query = { userEmail: email };
      const user = await UsersDatabace.findOne(query);
      const isAdmin = user?.role === 'admin';
      if (!isAdmin) {
        return res.status(403).send({ message: 'forbidden access' });
      }
      next();
    }

    const verifyMember = async(req,res, next)=>{
     const email = req.decoded.email;
     const query = {userEmail:email}
     const user = await UsersDatabace.findOne(query)
     const isMember = user?.role==='member'
     if(!isMember){
      return res.status(403).send({ message: 'forbidden access' });
     }
     next()
    }
// users api

app.post('/users',async(req,res)=>{
  const userData = req.body
  const query = {userEmail:userData?.userEmail}
  const existinguser = await UsersDatabace.findOne(query)
  
  if(existinguser){
    return res.send ({message:'User All ready exist'})
  }
  const result = await UsersDatabace.insertOne(userData)
  res.send(result)
})

app.patch('/users/:email',verifyToken ,verifyAdmin,async(req,res)=>{
    const email = req.params.email
    
    const query ={userEmail:email}
    const { role } = req.body;
    const updatedoc ={
      $set:{
         role: role 
      }
    }
    const result = await UsersDatabace.updateOne(query,updatedoc)
    res.send(result)

})

app.get('/users',verifyToken ,verifyAdmin,async(req,res)=>{
  const result = await UsersDatabace.find().toArray()
  res.send(result)
})
// member api

app.get('/users/member/:email',verifyToken,async(req,res)=>{
  const email = req.params.email
  
  if (email !== req.decoded.email) {
    return res.status(403).send({ message: 'forbidden access' })
  }
  const query = {userEmail: email}
  const user = await UsersDatabace.findOne(query)
  let member = false
  if(user){
    member = user?.role ==='member'
  }
  res.send({member})
})

// admin api 

app.get('/users/admin/:email',verifyToken ,async(req,res)=>{
  const email = req.params.email
  if (email !== req.decoded.email) {
    return res.status(403).send({ message: 'forbidden access' })
  }
  const query = {userEmail: email };
  const user = await UsersDatabace.findOne(query);
  let admin = false;
  if (user) {
    admin = user?.role === 'admin';
  }
  res.send({ admin });
 
})



// apartments api

    app.get('/apartments',async(req,res)=>{
       
         const result = await ApartmentsDatabace.find().toArray()
         res.send(result)
       })



// agreement request api 

app.post('/request',verifyToken ,async(req,res)=>{
  const request = req.body;
  const result = await AgreementReqDatabace.insertOne(request)
  res.send(result)
})

app.get('/request',verifyToken ,verifyAdmin,async(req,res)=>{
  const result = await AgreementReqDatabace.find().toArray()
  res.send(result)
})

app.delete('/request/:id',verifyToken,verifyAdmin,async(req,res)=>{
  const id = req.params.id
  const query = { _id: new ObjectId(id) }
  const result = await AgreementReqDatabace.deleteOne(query)
  res.send(result)
})

// accept request api

app.post('/accept',verifyToken ,verifyAdmin,async(req,res)=>{
  const acceptData = req.body
  const result = await AcceptedReqDatabace.insertOne(acceptData)
  res.send(result)
})

app.get('/accept',async(req,res)=>{
  const result = await AcceptedReqDatabace.find().toArray()
  res.send(result)
})


app.get('/accept/:email',verifyToken,verifyMember,async(req,res)=>{
  const email = req.params.email
  const query = {userEmail: email };
  const result = await AcceptedReqDatabace.find(query).toArray()
  res.send(result)
  
})




// Make announcement

app.post('/notice',verifyToken,verifyAdmin,async(req,res)=>{
  const notice = req.body
  const result = await AnnouncementDatabace.insertOne(notice)
  res.send(result)

})

app.get('/notice',async(req,res)=>{
  const result = await AnnouncementDatabace.find().toArray()
  res.send(result)
})

// coupon api 

app.post('/coupons',verifyToken,verifyAdmin,async(req,res)=>{
  const couponsData = req.body
  const result = await CouponDatabace.insertOne(couponsData)
  res.send(result)
})
app.patch('/coupons/:id',verifyToken,verifyAdmin,async(req,res)=>{
  const {status}=req.body
  const id = req.params.id
  const query = { _id: new ObjectId(id) }
  const updatedoc ={
    $set:{
      status: status 
    }
  }
  const result =await CouponDatabace.updateOne(query,updatedoc)
  res.send(result)

})


app.get('/coupons',async(req,res)=>{
  const result = await CouponDatabace.find().toArray()
  res.send(result)
})

// payment api 

app.post('/create-payment-intent',verifyToken,verifyMember,async(req,res)=>{
  const {price}=req.body
  const amounts = parseInt(price*100)
  const amount =Math.round(amounts)
  
  const paymentIntent = await stripe.paymentIntents.create({
     amount:amount,
     currency: "usd",
     payment_method_types: [
  "card",
  
],
  })
  res.send({
    clientSecret: paymentIntent.client_secret,
  });

  })
  app.post('/payments',verifyToken,verifyMember, async (req, res) => {
    const payment = req.body;
    const paymentResult = await PaymentDatabace.insertOne(payment);

    const id = payment.confim_id
    
    const query = {_id:new ObjectId(id)}
      
    const deleteResult = await AcceptedReqDatabace.deleteOne(query);

    res.send({ paymentResult, deleteResult });
  })


  app.get('/payments',async(req,res)=>{
    const result = await PaymentDatabace.find().toArray()
    res.send(result)
  })
  app.get('/payments/:email',async(req,res)=>{
    const email = req.params.email
  const query = {email: email };
    const result = await PaymentDatabace.find(query).toArray()
    res.send(result)
  })

// addmin report api
  app.get('/adminreport',async(req,res)=>{
    const apartmentsPipeline = [
      {
        $facet: {
          totalApartments: [{ $count: "count" }] 
        }
      },
      {
        $project: {
          totalApartments: { $arrayElemAt: ["$totalApartments.count", 0] }
        }
      }
    ];
    const usersPipeline = [
      {
        $facet: {
          totalUsers: [{ $count: "count" }],
          totalMembers: [
            { $match: { role: "member" } },
            { $count: "count" }
          ]
        }
      },
      {
        $project: {
          totalUsers: { $arrayElemAt: ["$totalUsers.count", 0] },
          totalMembers: { $arrayElemAt: ["$totalMembers.count", 0] }
        }
      }
    ];

    const paymentsPipeline = [
      {
        $facet: {
          totalPayments: [{ $count: "count" }]
        }
      },
      {
        $project: {
          totalPayments: { $arrayElemAt: ["$totalPayments.count", 0] }
        }
      }
    ];
    

    const [paymentsData] = await PaymentDatabace.aggregate(paymentsPipeline).toArray();

    
    const [apartmentsData] = await ApartmentsDatabace.aggregate(apartmentsPipeline).toArray();
    const [usersData] = await UsersDatabace.aggregate(usersPipeline).toArray();

    
    res.status(200).send({
      totalApartments: apartmentsData.totalApartments || 0,
      totalAgreement: paymentsData.totalPayments || 0,
      totalUsers: usersData.totalUsers || 0,
      totalMembers: usersData.totalMembers || 0,
    });
  })

    // await client.connect();
    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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