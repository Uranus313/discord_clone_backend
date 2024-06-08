const express = require("express");
const Joi = require("joi");
const DBClient = require("../../DBControl/dBconnection");

const crypto = require('crypto');

function generateRandomString(length) {
    const randomBytes = crypto.randomBytes(length/2);
    // console.log(randomBytes);
    return randomBytes.toString('hex');
}


const router = express.Router();
let dbclient = new DBClient();


router.post("/adduser/", async (req,res) => {
    const {error} = validateUsers(req.body);
    if(error){
        res.status(400).send(error.details[0].message);
        return;
    };
    let sameUserName = await dbclient.getUsers({username: req.body.username});
    if(sameUserName.length != 0){
        res.status(400).send("this username already exists");
        return;
    }

    let userID = generateRandomString(50);
    console.log(userID);
    console.log(userID.length)
    while(true){

        let users = await dbclient.getUsers({user_ID: userID});
        if(users.length == 0){
            break;
        }
        userID = generateRandomString(50);
    } 

    try {
        let answer = await dbclient.insertUser({user_ID : userID,username: req.body.username,password: req.body.password,settings:req.body.settings,status: req.body.status,nickName: req.body.nickName});
        res.send(answer);
    } catch (error) {
        console.log(error);
        res.status(500).send("something went wrong");   
    }
});
router.put("/changeUser/",async (req,res) =>{
    const {error} = validateUserChanges(req.body);
    if(error){
        res.status(400).send(error.details[0].message);
        return;
    }
    if(req.body.username){
        let sameUserName = await dbclient.getUsers({username: req.body.username});
        if(sameUserName.length != 0){
            res.status(400).send("this username already exists");
            return;
        }
    }
    try {
        let result = await dbclient.updateUser({user_ID: req.body.user_ID,status: req.body.status,username: req.body.username,nickName: req.body.nickName,settings: req.body.settings,password: req.body.password});
        res.send(result);
    } catch (error) {
        res.status(500).send("something went wrong");
    }

});
router.delete("/users/",async (req,res) =>{
    const {error} = validateDelete(req.body);
    if(error){
        res.status(400).send(error.details[0].message);
        return;
    };
    try {
        let user = await dbclient.getUsers({user_ID: req.body.user_ID});
        if(user.length == 0){
            res.status(400).send("no user with this user_ID exists");
            return;
        }
        if(user[0].password != req.body.password){
            res.status(400).send("wrong password");
            return;
        }
        let result = await dbclient.deleteUser({user_ID: req.body.user_ID});
        res.send(result);
        return;

    } catch (error) {
        console.log(error);
        res.status(500).send("something went wrong");
    }
})
router.get("/signIn/",async (req,res) =>{

    console.log(req.query);
    const {error} = validateSignin(req.query);
    if(error){
        res.status(400).send(error.details[0].message);
        return;
    };
    try {
        let user = await dbclient.getUsers({username: req.query.username,password: req.query.password});
        console.log(user)
        if(user.length == 0){
            res.status(404).send("no user found");
            return;
        }
        res.send(user);
    } catch (error) {
        res.status(500).send("something went wrong");
    }
    

});
router.post("/groupMembers/",async (req,res) =>{
    const {error} = validateGroupMember(req.body);
    if(error){
        res.status(400).send(error.details[0].message);
        return;
    };
    try {
        let result = await dbclient.addUserToGroup({user_ID: req.body.user_ID,group_ID: req.body.group_ID});
        res.send(result);
    } catch (error) {
        console.log(error.detail);
        res.status(400).send("something went wrong");
    }
});
router.post("/servers/",async (req,res) =>{
    const {error} = validateServers(req.body);
    if(error){
        res.status(400).send(error.details[0].message);
        return;
    };
    let server_ID = generateRandomString(50);

    while(true){

        let servers = await dbclient.getServers({server_ID: server_ID});
        if(servers.length == 0){
            break;
        }
        server_ID = generateRandomString(50);
    } 

    try {

        let result = await dbclient.insertServer({server_ID: server_ID,user_ID: req.body.owner_ID,settings: req.body.settings,name: req.body.name});
        res.send(result);
    } catch (error) {
        console.log(error.detail);
        res.status(400).send("something went wrong");
    }
});
router.post("/events/",async (req,res) =>{
    const {error} = validateEvents(req.body);
    if(error){
        res.status(400).send(error.details[0].message);
        return;
    };
    let server = await dbclient.getServers({server_ID: req.body.server_ID});
    if (server.length == 0){
        res.status(400).send("there's no server wih this ID");
        return;
    }



    let event_ID = generateRandomString(50);

    while(true){

        let events = await dbclient.getEvents({event_ID: event_ID});
        if(events.length == 0){
            break;
        }
        event_ID = generateRandomString(50);
    } 

    try {

        let result = await dbclient.insertEvent({event_ID: event_ID,description: req.body.description,startDate:req.body.startDate,endDate:req.body.endDate,settings: req.body.settings,name: req.body.name});
        let result2 = await  dbclient.addEventToServer({server_ID : req.body.server_ID,event_ID: event_ID});
        res.send(result+" \n"+result2);
    } catch (error) {
        console.log(error.detail);
        res.status(400).send("something went wrong");
    }
});
router.post("/friends/",async (req,res) => {
    const {error} = validateFriends(req.body);
    if(error){
        res.status(400).send(error.details[0].message);
        return;
    };
    let friends = await dbclient.getFriends({user1_ID: req.body.user1_ID,user2_ID: req.body.user2_ID});
    if (friends.length != 0){
        res.status(400).send("these users are already friends");
        return;
    }
    try {
        let result = await dbclient.insertFriend({user1_ID: req.body.user1_ID,user2_ID: req.body.user2_ID});
        res.send(result);
    } catch (error) {
        console.log(error.detail);
        res.status(400).send("something went wrong");
    }
})
function validateUsers(user){
    const schema = Joi.object({
        username: Joi.string().max(255).min(1).required(),
        password: Joi.string().max(255).min(8).required(),
        settings: Joi.object().required(),
        status: Joi.string().max(255).min(1).required(),
        nickName: Joi.string().max(255).min(1)
    });
    return schema.validate(user);
}
function validateUserChanges(user){
    const schema = Joi.object({
        user_ID: Joi.string().length(50).required(),
        username: Joi.string().max(255).min(1),
        password: Joi.string().max(255).min(8),
        settings: Joi.object(),
        status: Joi.string().max(255).min(1),
        nickName: Joi.string().max(255).min(1)
    }).min(2);
    return schema.validate(user);
}
function validateSignin(user){
    const schema = Joi.object({
        username: Joi.string().max(255).min(1).required(),
        password: Joi.string().max(255).min(8).required()
    });
    return schema.validate(user);
}
function validateDelete(user){
    const schema = Joi.object({
        user_ID: Joi.string().length(50).required(),
        password: Joi.string().max(255).min(8).required()
    });
    return schema.validate(user);
}
function validateGroupMember(user){
    const schema = Joi.object({
        user_ID: Joi.string().max(50).min(1).required(),
        group_ID: Joi.string().max(50).min(1).required(),

    });
    return schema.validate(user);
}
function validateServers(server){
    const schema = Joi.object({
        name : Joi.string().max(255).min(1).required(),
        settings : Joi.object().required(),
        owner_ID : Joi.string().max(50).min(1).required()
    });
    return schema.validate(server);
}
function validateEvents(event){
    const schema = Joi.object({
        server_ID : Joi.string().max(50).min(1).required(),
        name : Joi.string().max(255).min(1).required(),
        settings : Joi.object().required(),
        description : Joi.string().max(450).min(1),
        startDate : Joi.date().required(),
        endDate : Joi.date()
    });
    return schema.validate(event);
}
function validateFriends(friends){
    const schema = Joi.object({
        user1_ID : Joi.string().max(50).min(1).required(),
        user2_ID : Joi.string().max(50).min(1).required()
    });
    return schema.validate(friends);
}
module.exports = router;