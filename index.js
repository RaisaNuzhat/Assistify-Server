const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
require('dotenv').config()


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000

//  middlewares
const corsOptions =
{
    origin:["http://localhost:5173","https://th-assignment-376c0.web.app","https://th-assignment-376c0.firebaseapp.com"],
    credentials:true,
    optionsSuccessStatus:200,
}
app.use(cors(corsOptions))
app.use(express.json())
app.use(cookieParser())

const verifyToken =  (req,res,next)=>
  {
      console.log("asire bhai asi")

      const token = req.cookies?.token
      if(!token) res.status(401).send({message:"unauthorized access"})
            console.log(token)
            if(token)
              {
                jwt.verify(token,process.env.ACCESS_TOKEN_SECRET,(err,decoded)=>
                {
                      if(err)
                        {
                          console.log(err)
                          return res.status(401).send({message:"unauthorized access"})

                        }
                        console.log(decoded)
                        req.user = decoded
                        next()
                })
              }
      
  }

const uri =  `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.9odt6wv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
//console.log(uri)


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
    // Connect the client to the server	(optional starting in v4.7)
    //await client.connect();
    const volunteerCollection = client.db("assistify").collection("volunteers");
    const volunteerRequestCollection = client.db("assistify").collection("requests");
    //jwt generate
    app.post('/jwt',async(req,res)=>
    {
      const user = req.body
      const token = jwt.sign(user,process.env.ACCESS_TOKEN_SECRET,
        {
          expiresIn:'365d'
        }
       
      )
      res.cookie('token',token,
        {
          httpOnly:true,
          secure:process.env.NODE_ENV==='production',
          sameSite:process.env.NODE_ENV==='production'?'none':'strict'
        }
      ).send({success: true})
    })
     //clearing token
    //  app.get('/logout',(req,res)=>
    // {
    //   res.clearCookie('token',
    //   {
    //     httpOnly:true,
    //     secure:process.env.NODE_ENV==='production',
    //     sameSite:process.env.NODE_ENV==='production'?'none':'strict',
    //     maxAge:0,
    //   }
    // ).send({success: true})
    // })
      //clearing token
      // app.get('/logout',(req,res)=>
      //   {
      //     res.clearCookie('token',
      //     {
      //       httpOnly:true,
      //       secure:process.env.NODE_ENV==='production',
      //       sameSite:process.env.NODE_ENV==='production'?'none':'strict',
      //       maxAge:0,
      //     }
      //   ).send({success: true})
      //   })
      app.post('/logout', async (req, res) => {
        const user = req.body;
        console.log('logging out', user);
        res
            .clearCookie('token', { maxAge: 0, sameSite: 'none', secure: true })
            .send({ success: true })
      })
    //get all volunteers
      app.get('/volunteers',async(req,res) =>
        {
            const cursor = volunteerCollection.find()
            const result = await cursor.toArray()
            console.log(result)
            res.send(result)
        })
        //get by id
        app.get('/volunteers/:id',async(req,res) =>
            {
                const id = req.params.id
                const query = {_id: new ObjectId(id)}
                const result = await volunteerCollection.findOne(query)
                res.send(result)
            })
            app.get('/allposts', async (req, res) => {
              const sort = req.query.sort;
              const search = req.query.search;
              let query = {};
              if (search) {
                  query = { posttitle: { $regex: search, $options: 'i' } };
              }
              let sortOptions = {};
              if (sort) {
                  sortOptions = { deadline: sort === 'asce' ? 1 : -1 };
              }
              try {
                  const result = await volunteerCollection
                      .find(query) 
                      .sort(sortOptions)
                      .toArray();
                  res.send(result);
              } catch (error) {
                  console.error("Error fetching data:", error);
                  res.status(500).send("Internal Server Error");
              }
          });
          
        //update need volunteer post
        app.put('/volunteers/:id',async(req,res) =>
          {
              const id = req.params.id
              const filter = {_id: new ObjectId(id)}
              const options ={upsert : true}
              const updatedpost = req.body
              const updated = {
                $set:{
                    spotname:updatedpost.posttitle,
                    image:updatedpost.image,
                    location:updatedpost.location,
                    description:updatedpost.description,
                    noofvolunteers:updatedpost.noofvolunteers,
                    category:updatedpost.category,
                    deadline:updatedpost.deadline,
                  
                }
              }
              const result = await volunteerCollection.updateOne(filter,updated,options)
              res.send(result)
              })
      //delete post
      app.delete('/volunteers/:id',async(req,res) =>
        {
            const id = req.params.id
            const query = {_id: new ObjectId(id)}
            const result = await volunteerCollection.deleteOne(query)
            res.send(result) 
        })
        app.delete('/request/:id',async(req,res) =>
          {
              const id = req.params.id
              const query = {_id: new ObjectId(id)}
              const result = await volunteerRequestCollection.deleteOne(query)
              res.send(result) 
          })

          // email filtering
      app.get('/volunteer/:orgemail',verifyToken,async(req,res) =>
        {
            const tokenEmail = req.user.email
            //console.log(tokenData,'from token')
            console.log(req.params.orgemail)
            if(tokenEmail !== req.params.orgemail)
              {
                return res.status(403).send({message:"forbidden access"})
              }
            const result = await volunteerCollection.find({orgemail: req.params.orgemail}).toArray()
            console.log(result)
            res.send(result)
        })
        //request email filtering
        app.get('/request/:vemail',verifyToken,async(req,res) =>
          {
            const tokenEmail = req.user.email
              console.log(req.params.vemail)
              if(tokenEmail !== req.params.vemail)
                {
                  return res.status(403).send({message:"forbidden access"})
                }
              const result = await volunteerRequestCollection.find({vemail: req.params.vemail}).toArray()
              console.log(result)
              res.send(result)
          })
        //add volunteers
        app.post('/volunteers',async(req,res) =>
            {
                const volunteer = req.body
                console.log('new volunteer',volunteer)
                const result = await volunteerCollection.insertOne(volunteer);
                res.send(result)
            })
             //add volunteer requests
        app.post('/requests',async(req,res) =>
          {
              const requestVolunteer = req.body
              console.log('new request',requestVolunteer)
              const result = await volunteerRequestCollection.insertOne(requestVolunteer);
              res.send(result)
          })
   
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);

app.get('/',(req,res) =>
    {
        res.send('SIMPLE CRUD IS RUNNNING')
    })
    
    app.listen(port , ()=>
    {
        console.log(`simple crud is running on port:${port}`)
    })