const express = require("express");

const app = express();

const PORT = process.env.PORT_ONE || 8080;
const mongoose = require("mongoose");
mongoose.set('strictQuery', true);
const jwt = require("jsonwebtoken");
const amqp = require("amqplib");

const isAuthenticated = require("../isAuthenticated");
const Product = require("./Product");
app.use(express.json());
 
var order;
var channel, connection;
mongoose.connect("mongodb://localhost/product-service", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
},
()=>{
  console.log(`Product-Service DB Connected.`);  
}
);


async function connect(){
    const amqpServer = "amqp://localhost:5672";

    connection = await amqp.connect(amqpServer);
    channel = await connection.createChannel();
    await channel.assertQueue("PRODUCT");

}


connect();

//create a new product 
app.post("/product/create", isAuthenticated ,async (req, res) => {
    const {name, description, price } = req.body;
    
    const newProduct = new Product({
        name,
        description,
        price
    });
    
    newProduct.save();
    
    return res.json(newProduct);
    
    
});

//Buy a product
//user sends a list of product's IDs to buy
//creating an order with those products and a total value of sum of products prices


app.post("/product/buy", isAuthenticated, async(req, res) =>{
    const {ids}  = req.body;

    const products = await Product.find({_id : {$in: ids}});

    channel.sendToQueue("ORDER", 
        Buffer.from(
            JSON.stringify({
                products,
                userEmail: req.user.email,
             })
        )
    );

    channel.consume("PRODUCT", (data) =>{
        console.log("Consuming PRODUCT queue");
        order = JSON.parse(data.content);
        //acknowledge data to remove from queue
        channel.ack(data);
    });
    return res.json(order);

});



app.listen(PORT, () => {
    console.log(`Product-Service at ${PORT}`);
});