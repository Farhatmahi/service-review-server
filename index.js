const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
var jwt = require('jsonwebtoken');

const services = require("./services.json");

const port = process.env.PORT || 5001;

//middleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("running");
});

//mongodb
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.6ulnnbw.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});


const verifyJwt = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({message : "unauthorized"})
  }
  const token = authHeader.split(' ')[1]
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if(err){
      return res.status(401).send({message : "unauthorized"})
    }
    req.decoded = decoded;
    next();
  })
}



const run = async () => {
  try {
    const serviceCollection = client.db("sarah-mcconor").collection("services");
    const blogsCollection = client.db("sarah-mcconor").collection("blogs");
    const reviewCollection = client.db("sarah-mcconor").collection("reviews");

    //review
    app.post('/reviews', async(req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review)
      res.send(result)
    })

    app.delete('/reviews/:id', async(req, res) => {
      const id = req.params.id
      // console.log(id)
      const query = { _id : ObjectId(id)}
      
      const result = await reviewCollection.deleteOne(query)
      res.send(result)
    })

    app.get('/reviews', async(req, res) => {
      // console.log(req.headers.authorization)
      const decoded = req.decoded;
      console.log(decoded)


      let query = {}
      if(req.query.service){
        query = {
          service : req.query.service
        }
      }
      if(req.query.email){
        query = {
          email : req.query.email
        }
      }
      const cursor = reviewCollection.find(query)
      const reviews = await cursor.toArray()
      res.send(reviews)
    })



    //jwt
    app.post('/jwt', (req, res) => {
      const user = req.body;
      // console.log(user)
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn : '1h'})
      // console.log({token})
      res.send({token})
    })

    //blog
    app.get("/blogs", async(req, res) => {
      const query = {}
      const cursor = blogsCollection.find(query)
      const blogs = await cursor.toArray()
      res.send(blogs)
    })

    //services
    app.get("/services", async (req, res) => {
      const query = {};
      const cursor = serviceCollection.find(query);
      const services = await cursor.limit(3).toArray();
      res.send(services);
    });

    app.post('/services', async(req, res) => {
      const service = req.body;
      // console.log(service)
      const result = await serviceCollection.insertOne(service)
      res.send(result)
    })

    app.get("/all-services", async (req, res) => {
        const query = {};
        const cursor = serviceCollection.find(query);
        const services = await cursor.toArray();
        res.send(services);
      });

    app.get('/services/:id', async(req, res) => {
        const id = req.params.id
        const query = { _id : ObjectId(id)}
        const service = await serviceCollection.findOne(query)
        res.send(service)
    })


  } catch (err) {
    console.log("Something happened inside run function");
  }
};

run().catch((err) => console.error(err));

app.listen(port, () => {
  console.log(`server running on ${port}`);
});
