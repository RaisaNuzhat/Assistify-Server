const express = require('express')
const cors = require('cors')
require('dotenv').config()


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const port = process.env.PORT || 5000

//  middlewares
const corsOptions =
{
    origin:["http://localhost:5173"],
    credentials:true,
    optionsSuccessStatus:200,
}
app.use(cors(corsOptions))
app.use(express.json())

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
    //get all volunteers
      app.get('/volunteers',async(req,res) =>
        {
            const cursor = volunteerCollection.find()
            const result = await cursor.toArray()
            console.log(result)
            res.send(result)
        })
          // email filtering
      app.get('/volunteer/:orgemail',async(req,res) =>
        {
            console.log(req.params.orgemail)
            const result = await volunteerCollection.find({orgemail: req.params.orgemail}).toArray()
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