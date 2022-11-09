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

    app.get('/reviews', async(req, res) => {
      const query = {}
      const cursor = reviewCollection.find(query)
      const reviews = await cursor.toArray()
      res.send(reviews)
    })

    //jwt
    app.post('/jwt', (req, res) => {
      const user = req.body;
      console.log(user)
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn : '1h'})
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
