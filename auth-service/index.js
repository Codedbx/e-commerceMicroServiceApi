const express = require("express");

const app = express();

const PORT = process.env.PORT_ONE || 7070;
app.use(express.json());

const mongoose = require("mongoose");
const User = require("./User")
const jwt = require("jsonwebtoken");
 
mongoose.connect("mongodb://localhost/auth-service", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
},
()=>{
  console.log(`Auth-Service DB Connected.`);  
}
);

//register 
//login
app.post("/auth/login", async(req, res)=>{
    const {email, password} = req.body;

    const user = await User.findOne({email});

    if (!user){
        return res.json({message : "User does not exits"});
    }else {
        if (user.password !== password){
            res.json({message : "Password does not match. retry again."});
        }
        const payload = {
            email,
            name : user.name

        };
        jwt.sign(payload, "secret", (err, token) =>{
            if(err) console.log(err);
            else{
                return res.json({token : token});
            } 
        });

    }
})
app.post("/auth/register", async (req, res)=>{
    const {name, email, password}  = req.body;

    const userExits = await User.findOne({email});

    if (userExits){
        return res.json({message : "User already exits"});

    }else {
        const newUser = new User ({
            name,
            email,
            password,
        });
        newUser.save();
        return res.json(newUser);
    }
});




app.listen(PORT, () => {
    console.log(`Auth-Service at ${PORT}`);
});