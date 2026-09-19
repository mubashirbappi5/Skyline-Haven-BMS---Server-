global.SlowBuffer = global.Buffer;
const express = require('express');
require('express-async-errors');
const jwt = require('jsonwebtoken')
const cors = require('cors')
const bcrypt = require('bcryptjs')
const { OAuth2Client } = require('google-auth-library')

require('dotenv').config()
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const port = process.env.PORT || 7000

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

const app = express()
app.use(cors())
app.use(express.json())

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

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
  const user = await prisma.user.findUnique({ where: { email } });
  const isAdmin = user?.role === 'admin';
  if (!isAdmin) {
    return res.status(403).send({ message: 'forbidden access' });
  }
  next();
}

const verifyMember = async(req,res, next)=>{
 const email = req.decoded.email;
 const user = await prisma.user.findUnique({ where: { email } });
 const isMember = user?.role === 'member';
 if(!isMember){
  return res.status(403).send({ message: 'forbidden access' });
 }
 next()
}

// ----------------------------------------------------------------------
// NEW AUTHENTICATION ENDPOINTS
// ----------------------------------------------------------------------

app.post('/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password) return res.status(400).send({ message: 'Email and password required' });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).send({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role: 'member' }
    });

    const token = jwt.sign({ email: user.email }, process.env.JwT_Token, { expiresIn: '2h' });
    res.send({ user: { email: user.email, name: user.name }, token });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

app.post('/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).send({ message: 'Email and password required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).send({ message: 'User not found' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).send({ message: 'Invalid credentials' });

    const token = jwt.sign({ email: user.email }, process.env.JwT_Token, { expiresIn: '2h' });
    res.send({ user: { email: user.email, name: user.name }, token });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

app.post('/auth/google', async (req, res) => {
  try {
    const { credential } = req.body;
    const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name } = payload;

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
       user = await prisma.user.create({
         data: { email, name, password: '', role: 'member' }
       });
    }

    const token = jwt.sign({ email: user.email }, process.env.JwT_Token, { expiresIn: '2h' });
    res.send({ user: { email: user.email, name: user.name }, token });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

app.get('/auth/me', verifyToken, async (req, res) => {
  try {
    const email = req.decoded.email;
    const user = await prisma.user.findUnique({ where: { email }, select: { email: true, name: true, role: true }});
    if (!user) return res.status(404).send({ message: 'User not found' });
    res.send(user);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// ----------------------------------------------------------------------
// USERS API
// ----------------------------------------------------------------------

app.post('/users', async(req,res)=>{
  const userData = req.body;
  const emailToUse = userData.userEmail || userData.email;

  if (!emailToUse) {
    return res.status(400).send({ message: 'Email is required' });
  }

  const existinguser = await prisma.user.findUnique({ where: { email: emailToUse } });
  
  if(existinguser){
    return res.send ({message:'User All ready exist'})
  }
  const result = await prisma.user.create({
    data: {
      email: emailToUse,
      name: userData.name || '',
      password: '',
      role: 'member'
    }
  });
  res.send(result)
})

app.patch('/users/:email', verifyToken, verifyAdmin, async(req,res)=>{
    const email = req.params.email;
    const { role } = req.body;
    
    const result = await prisma.user.update({
      where: { email },
      data: { role }
    });
    res.send(result)
})

app.get('/users', verifyToken, verifyAdmin, async(req,res)=>{
  const result = await prisma.user.findMany();
  const mapped = result.map(u => ({ ...u, userEmail: u.email }));
  res.send(mapped)
})

app.get('/users/member/:email', verifyToken, async(req,res)=>{
  const email = req.params.email;
  if (email !== req.decoded.email) {
    return res.status(403).send({ message: 'forbidden access' })
  }
  const user = await prisma.user.findUnique({ where: { email } });
  let member = false
  if(user){
    member = user?.role === 'member'
  }
  res.send({member})
})

app.get('/users/admin/:email', verifyToken, async(req,res)=>{
  const email = req.params.email;
  if (email !== req.decoded.email) {
    return res.status(403).send({ message: 'forbidden access' })
  }
  const user = await prisma.user.findUnique({ where: { email } });
  let admin = false;
  if (user) {
    admin = user?.role === 'admin';
  }
  res.send({ admin });
})

// ----------------------------------------------------------------------
// APARTMENTS API
// ----------------------------------------------------------------------

app.get('/apartments', async(req,res)=>{
  const result = await prisma.apartment.findMany();
  const mapped = result.map(a => ({ ...a, _id: a.id }));
  res.send(mapped)
})

// ----------------------------------------------------------------------
// AGREEMENT REQUEST API
// ----------------------------------------------------------------------

app.post('/request', verifyToken, async(req,res)=>{
  const request = req.body;
  const result = await prisma.agreementRequest.create({
    data: {
      userName: request.userName || null,
      userEmail: request.userEmail,
      floorNo: request.floorNo || null,
      apartmentNo: request.apartmentNo || null,
      blockName: request.blockName || null,
      rent: request.rent || null,
      apartment_id: request.apartment_id || request.apartmentId || null,
      status: request.Status || request.status || 'pending'
    }
  });
  res.send(result)
})

app.get('/request', verifyToken, verifyAdmin, async(req,res)=>{
  const result = await prisma.agreementRequest.findMany();
  const mapped = result.map(a => ({ ...a, _id: a.id }));
  res.send(mapped)
})

app.delete('/request/:id', verifyToken, verifyAdmin, async(req,res)=>{
  const id = req.params.id;
  const result = await prisma.agreementRequest.delete({
    where: { id }
  }).catch(() => null);
  res.send(result ? { deletedCount: 1 } : { deletedCount: 0 })
})

// ----------------------------------------------------------------------
// ACCEPT REQUEST API
// ----------------------------------------------------------------------

app.post('/accept', verifyToken, verifyAdmin, async(req,res)=>{
  const acceptData = req.body;
  const result = await prisma.acceptedRequest.create({
    data: {
      userEmail: acceptData.userEmail,
      apartmentId: acceptData.apartment_id || acceptData.apartmentId || null,
      apartmentNo: acceptData.apartmentNo || null,
    }
  });
  res.send(result)
})

app.get('/accept', async(req,res)=>{
  const result = await prisma.acceptedRequest.findMany();
  const mapped = result.map(a => ({ ...a, _id: a.id }));
  res.send(mapped)
})

app.get('/accept/:email', verifyToken, verifyMember, async(req,res)=>{
  const email = req.params.email;
  const result = await prisma.acceptedRequest.findMany({
    where: { userEmail: email }
  });
  const mapped = result.map(a => ({ ...a, _id: a.id }));
  res.send(mapped)
})

// ----------------------------------------------------------------------
// ANNOUNCEMENT API
// ----------------------------------------------------------------------

app.post('/notice', verifyToken, verifyAdmin, async(req,res)=>{
  const notice = req.body;
  const result = await prisma.announcement.create({
    data: {
      title: notice.title || '',
      content: notice.content || ''
    }
  });
  res.send(result)
})

app.get('/notice', async(req,res)=>{
  const result = await prisma.announcement.findMany();
  const mapped = result.map(a => ({ ...a, _id: a.id }));
  res.send(mapped)
})

// ----------------------------------------------------------------------
// COUPON API
// ----------------------------------------------------------------------

app.post('/coupons', verifyToken, verifyAdmin, async(req,res)=>{
  const couponsData = req.body;
  const result = await prisma.coupon.create({
    data: {
      code: couponsData.code || '',
      discount: couponsData.discount || 0,
      status: couponsData.status || 'active'
    }
  });
  res.send(result)
})

app.patch('/coupons/:id', verifyToken, verifyAdmin, async(req,res)=>{
  const { status } = req.body;
  const id = req.params.id;
  const result = await prisma.coupon.update({
    where: { id },
    data: { status }
  });
  res.send(result)
})

app.get('/coupons', async(req,res)=>{
  const result = await prisma.coupon.findMany();
  const mapped = result.map(a => ({ ...a, _id: a.id }));
  res.send(mapped)
})

// ----------------------------------------------------------------------
// PAYMENT API
// ----------------------------------------------------------------------

app.post('/create-payment-intent', verifyToken, verifyMember, async(req,res)=>{
  try {
    const { price } = req.body;
    const amounts = parseInt(price * 100);
    const amount = Math.round(amounts);
    
    const paymentIntent = await stripe.paymentIntents.create({
       amount: amount,
       currency: "usd",
       payment_method_types: ["card"],
    });
    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
})

app.post('/payments', verifyToken, verifyMember, async (req, res) => {
  const payment = req.body;
  
  const paymentResult = await prisma.payment.create({
    data: {
      email: payment.email,
      amount: payment.amount || 0,
      confim_id: payment.confim_id || null,
      status: payment.status || 'completed'
    }
  });

  let deleteResult = null;
  if (payment.confim_id) {
    deleteResult = await prisma.acceptedRequest.delete({
      where: { id: payment.confim_id }
    }).catch(() => null);
  }

  res.send({ paymentResult, deleteResult });
})

app.get('/payments', async(req,res)=>{
  const result = await prisma.payment.findMany();
  const mapped = result.map(a => ({ ...a, _id: a.id }));
  res.send(mapped)
})

app.get('/payments/:email', async(req,res)=>{
  const email = req.params.email;
  const result = await prisma.payment.findMany({
    where: { email }
  });
  const mapped = result.map(a => ({ ...a, _id: a.id }));
  res.send(mapped)
})

// ----------------------------------------------------------------------
// ADMIN REPORT API
// ----------------------------------------------------------------------

app.get('/adminreport', async(req,res)=>{
  const totalApartments = await prisma.apartment.count();
  const totalUsers = await prisma.user.count();
  const totalMembers = await prisma.user.count({ where: { role: 'member' }});
  const totalPayments = await prisma.payment.count();

  res.status(200).send({
    totalApartments: totalApartments,
    totalAgreement: totalPayments,
    totalUsers: totalUsers,
    totalMembers: totalMembers,
  });
})

app.get('/', (req, res) => {
  res.send('Hello skyline World!')
})

// Global error handler for unhandled async errors
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send({ message: err.message || 'Internal Server Error' });
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

module.exports = app;