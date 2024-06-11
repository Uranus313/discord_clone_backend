const express = require("express");
const Joi = require("joi");
const JoiBase = require("@hapi/joi");
const JoiDate = require("@hapi/joi-date");
const DBClient = require("../../DBControl/dBconnection");
const jwt = require("jsonwebtoken");
const crypto = require('crypto');
const auth = require("../middleware/auth");

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
        if(answer == "inserted"){
            let user = await dbclient.getUsers({user_ID: userID});
            user = user[0];
            let token = jwt.sign(user,"my Secret");
            res.header("x-auth-token",token).send(answer);

            return;
        }
        res.send(answer);
    } catch (error) {
        console.log(error);
        res.status(500).send(error.detail);   
    }
});
router.put("/changeUser/",auth,async (req,res) =>{
    const {error} = validateUserChanges(req.body);

    if(error){
        res.status(400).send(error.details[0].message);
        return;
    }
    if(req.user.user_ID != req.body.user_ID){
        res.status(400).send("you cant change another user");
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
        if(result == "the row updated"){
            let user = await dbclient.getUsers({user_ID: req.body.user_ID});
            user = user[0];
            let token = jwt.sign(user,"my Secret");
            res.header("x-auth-token",token).send(result);
            return;
        }
        res.send(result);
    } catch (error) {
        res.status(500).send(error.detail);
    }

});
router.delete("/users/",auth,async (req,res) =>{
    const {error} = validateDelete(req.body);
    if(error){
        res.status(400).send(error.details[0].message);
        return;
    };
    if(req.user.user_ID != req.body.user_ID){
        res.status(400).send("you cant delete another user");
        return;
    }
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
        res.status(500).send(error.detail);
    }
})
router.delete("/massUsers/",auth,async (req,res) =>{
    const {error} = validateUserList(req.body);
    if(error){
        res.status(400).send(error.details[0].message);
        return;
    };
    try {
        for (const user_ID of req.body.userList) {
            const user = await dbclient.getUsers({ user_ID });

            if (user.length === 0) {
                res.status(400).send(`No user with this userID exists.\n userID: ${user_ID}`);
                return;
            }
        }

        for (const user_ID of req.body.userList) {
            let result = await dbclient.deleteUser({user_ID: user_ID});


            if (result != "user deleted successfully"){
                res.status(500).send(`coulnd't delete the user with userID : ${user_ID} \n stopped deleting after it.`)
                return;
            }
        }
        
        res.send("all selected users deleted");
        return;

    } catch (error) {
        console.log(error);
        res.status(500).send(error.detail);
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
            res.status(404).send("useename or password is wrong");
            return;
        }


        user = user[0];
        let token = jwt.sign(user,"my Secret");
        res.header("x-auth-token",token).send(user);
    } catch (error) {
        res.status(500).send(error.detail);
    }
    

});
router.post("/groupMembers/",auth,async (req,res) =>{
    const {error} = validateGroupMember(req.body);
    if(error){
        res.status(400).send(error.details[0].message);
        return;
    };
    if(req.user.user_ID != req.body.user_ID){
        res.status(400).send("you cant add another user to a group");
        return;
    }
    try {
        let result = await dbclient.addUserToGroup({user_ID: req.body.user_ID,group_ID: req.body.group_ID});
        res.send(result);
    } catch (error) {
        console.log(error.detail);
        res.status(500).send(error.detail);

    }
});
router.post("/servers/",auth,async (req,res) =>{
    const {error} = validateServers(req.body);
    if(error){
        res.status(400).send(error.details[0].message);
        return;
    };
    if(req.user.user_ID != req.body.owner_ID){
        res.status(400).send("you cant make a server with another user as owner");
        return;
    }
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
               res.status(500).send(error.detail);

    }
});
router.post("/events/",auth,async (req,res) =>{
    const {error} = validateEvents(req.body);
    if(error){
        res.status(400).send(error.details[0].message);
        return;
    };
    console.log(req.body.startDate);
    let startDate = new Date(req.body.startDate);
    let currentDate = new Date();
    console.log(startDate);
    console.log(currentDate);
    if(startDate < currentDate){
        res.status(400).send("event's start date is in the past");
        return;
    }
    if(req.body.endDate){
        let endDate = new Date(req.body.endDate);
        if(endDate < startDate){
            res.status(400).send("event's ending date shouldn't be earlier than its start");
            return;
        }
    }
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
        res.send("event added");
        // res.send(result+" \n"+result2);
    } catch (error) {
        console.log(error);
        if(error.where.includes("checkevent")){
        res.status(500).send("this event's time has conflict with another event");
            return;
        }
        res.status(500).send(error.detail);

    }
});
router.post("/friends/",auth,async (req,res) => {
    const {error} = validateFriends(req.body);
    if(error){
        res.status(400).send(error.details[0].message);
        return;
    };
    if(req.user.user_ID != req.body.user1_ID && req.user.user_ID != req.body.user2_ID ){
        res.status(400).send("you cant make 2 other users friends");
        return;
    }
    let friends = await dbclient.getFriends({user1_ID: req.body.user1_ID,user2_ID: req.body.user2_ID});
    if (friends.length != 0){
        res.status(400).send("these users are already friends");
        return;
    }
    try {
        let result = await dbclient.insertFriend({user1_ID: req.body.user1_ID,user2_ID: req.body.user2_ID});
        res.send(result);
    } catch (error) {
        console.log(error);
               res.status(500).send(error.detail);

    }
})
function validateUsers(user){

    const schema = Joi.object({
        username: Joi.string().max(255).min(1).required(),
        password: Joi.string().max(50).min(8).required(),
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
        password: Joi.string().max(50).min(8),
        settings: Joi.object(),
        status: Joi.string().max(255).min(1),
        nickName: Joi.string().max(255).min(1)
    }).min(2);
    return schema.validate(user);
}
function validateSignin(user){
    const schema = Joi.object({
        username: Joi.string().max(255).min(1).required(),
        password: Joi.string().max(50).min(8).required()
    });
    return schema.validate(user);
}
function validateDelete(user){
    const schema = Joi.object({
        user_ID: Joi.string().length(50).required(),
        password: Joi.string().max(50).min(8).required()
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
    const customDateFormat = "YYYY-MM-DD HH:mm:ss"; 
    const Joi2 = JoiBase.extend(JoiDate);
    const schema = Joi2.object({
        server_ID : Joi2.string().max(50).min(1).required(),
        name : Joi2.string().max(255).min(1).required(),
        settings : Joi2.object().required(),
        description : Joi2.string().max(450).min(1),
        startDate: Joi2.date().format(customDateFormat).raw().required()  , 
        endDate : Joi2.date().format(customDateFormat).raw().required()
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
function validateUserList(list){
    const schema = Joi.object({
        userList : Joi.array().items(Joi.string().max(50).min(1)).min(1).required()
    });
    return schema.validate(list);
}
module.exports = router;