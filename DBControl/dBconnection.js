const { Client } = require('pg');

class DBClient{
    constructor(){
        const client = new Client({
            user: 'postgres',
            host: 'localhost',
            database: 'discord',
            password: 'admin',
            port: 5432,
        });
        client.connect();
    }
    async insertUser({user_ID,username,password,settings,status,nickName}){
  
          await client.query(`insert into users (user_ID,password, username, settings, status, nickName) values ($1,$2,$3,$4,$5,$6);`,[user_ID,password,username,settings,status,nickName])
          return("inserted")
      }
    async getUsers({user_ID,username,password}){
        if(user_ID){
            const user = await client.query("select * from users where user_ID = $1",[user_ID]);
            return user;
        }else if(username && password){
            const user = await client.query("select * from users where username = $1 and password = $2",[username,password]);
            return user;
        }else if(username){
            const user = await client.query("select * from users where username = $1",[username]);
            return user;
        }else{
            const users = await client.query("select * from users");
            return users;
        }
    }
    async updateUser({user_ID,status,username,nickName,settings,password}){
        
          const userExistsQuery = 'SELECT 1 FROM users WHERE user_ID = $1';
          const userExistsResult = await client.query(userExistsQuery, [user_ID]);
          if (userExistsResult.rows.length === 0) {
            throw new Error(`User with ID ${user_ID} does not exist.`);
          }
          
          let usernameText = "";
          let statusText = "";
          let nickNameText = "";
          let settingsText = "";
          let passwordText = "";

          let newValues = [];
          newValues.push(user_ID);
          let counter = 1;
          if (username ){
            counter++;
            usernameText= ` username = $${counter}`
            newValues.push(username);
          }
          if (status ){
            counter++;
            pretext = "";
            if(counter > 2){
              pretext = ","
            } 
            statusText= `${pretext} status = $${counter}`
            newValues.push(status);
          }
          if (nickName ){
            counter++;
            pretext = "";
            if(counter > 2){
              pretext = ","
            } 
            nickNameText= `${pretext} nickName = $${counter}`
            newValues.push(nickName);
          }
          if (settings ){
            counter++;
            pretext = "";
            if(counter > 2){
              pretext = ","
            } 
            settingsText= `${pretext} settings = $${counter}`
            newValues.push(settings);
          }
          if (password ){
            counter++;
            pretext = "";
            if(counter > 2){
              pretext = ","
            } 
            passwordText= `${pretext} password = $${counter}`
            newValues.push(password);
          }
          
      
          queryText = `update users set${usernameText + statusText + nickNameText + settingsText + password} where user_ID = $1`;
      
          // console.log(queryText);
          // console.log(props);
          // console.log(newValues);
      
          await client.query(queryText,newValues);
          return("the row updated");

          
        
    }
    async deleteUser({user_ID}){
        const userExistsQuery = 'SELECT 1 FROM users WHERE user_ID = $1';
        const userExistsResult = await client.query(userExistsQuery, [props.user_ID]);

        if (userExistsResult.rows.length === 0) {
        throw new Error(`User with ID ${props.user_ID} does not exist.`);
        }

        await client.query('DELETE FROM users WHERE user_ID = $1', [props.user_ID]);
        return("user deleted successfully");
    }
    async addUserToGroup({user_ID,group_ID}){
  
        await client.query(`insert into groupmemberlist (user_ID,group_ID) values ($1,$2);`,[user_ID,group_ID]);
        return("inserted");
    }
    async insertServer({user_ID,server_ID,settings,name}){
  
        await client.query(`insert into servers (server_ID,owner_ID,name,settings) values ($1,$2,$3,$4);`,[server_ID,user_ID,name,settings]);
        return("inserted");
    }
    async insertFriend({user1_ID,user2_ID}){
  
        await client.query(`insert into friendlist (firstuserid,seconduserid) values ($1,$2);`,[user1_ID,user2_ID]);
        return("inserted");
    }
    async insertFriend({user1_ID,user2_ID}){
  
        await client.query(`insert into friendlist (firstuserid,seconduserid) values ($1,$2);`,[user1_ID,user2_ID]);
        return("inserted");
    }
    async insertEvent({event_ID,name,description,startDate,endDate,settings}){
        if (endDate == undefined){
            endDate = null;
        }
        await client.query(`insert into events (event_id,name,description,startdate,enddate,settings) values ($1,$2,$3,$4,$5,$6);`,[event_ID,name,description,startDate,endDate,settings]);
        return("inserted");
    }
    async addEventToServer({server_ID,event_ID}){
        await client.query(`insert into eventlist (server_id,event_id) values ($1,$2);`,[server_ID,event_ID]);
    }
}
module.exports = DBClient;