const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;
app.use(cors({
     origin: ['http://localhost:5173', 'http://localhost:5174','https://shop-easy-b1c31.web.app','https://shop-easy-b1c31.firebaseapp.com/'],
     credentials: true
}));
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@atlascluster.6gwdl3v.mongodb.net/?retryWrites=true&w=majority&appName=AtlasCluster`;

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
          // await client.connect();
          // Send a ping to confirm a successful connection
          const productsCollection = client.db('shop-easy').collection('products')
          app.get('/products', async (req, res) => {
               const result = await productsCollection.find().toArray();
               res.send(result)
          })
          app.get('/product', async (req, res) => {
               const { page = 1, limit = 15, category, minPrice = 0, maxPrice = Infinity, searchQuery, sortOrder } = req.query;

               const query = {
                    price: { $gte: parseFloat(minPrice), $lte: parseFloat(maxPrice) },
               };

               if (category) {
                    query.category = category;
               }

               if (searchQuery) {
                    query.$or = [
                         { name: { $regex: searchQuery, $options: 'i' } },
                         { description: { $regex: searchQuery, $options: 'i' } }
                    ];
               }
               const sortOptions = {};
               if (sortOrder === 'price-desc') {
                    sortOptions.price = -1;
               } else if (sortOrder === 'price-asc') {
                    sortOptions.price = 1;
               } else if (sortOrder === 'date-desc') {
                    sortOptions.created_at = -1;
               } else if (sortOrder === 'date-asc') {
                    sortOptions.created_at = 1;
               }

               const productsCollection = client.db('shop-easy').collection('products');
               const products = await productsCollection

                    .find(query)
                    .sort(sortOptions)
                    .skip((page - 1) * limit)
                    .limit(parseInt(limit))
                    .toArray();

               const totalProducts = await productsCollection.countDocuments(query);
               const totalPages = Math.ceil(totalProducts / limit);

               res.send({ products, totalPages });
          });
          app.get('/products/:id',async(req,res) =>{
               const id = req.params.id;
               const query = {_id : new ObjectId(id)}
               const result = await productsCollection.findOne(query)
               res.send(result)
          })
          // app.put('/products/:id',async(req,res)=>{
          //      const id = req.params.id
          //      const filter = {_id: new ObjectId(id)}
          //      const options = {upsert: true};
          //      const updatedProduct = req.body;
          //      console.log(updatedProduct);
          //      const updated = {
          //        $set: {
          //         image: updatedProduct.image
                  
          //        }
         
          //      }
          //      console.log(updated)
          //      const result = await productsCollection.updateOne(filter,updated,options) 
          //      res.send(result)   
          //    })

          await client.db("admin").command({ ping: 1 });
          console.log("Pinged your deployment. You successfully connected to MongoDB!");
     } finally {
          // Ensures that the client will close when you finish/error
          // await client.close();
     }
}
run().catch(console.dir);

app.get('/', (req, res) => {
     res.send('shop-easy server is running')

})
app.listen(port, (req, res) => {
     console.log(`shop-easy server is running on port ${port}`);
})
