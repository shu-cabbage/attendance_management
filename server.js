const path = require("path");
const bodyParser = require('body-parser');
const {Client} = require("pg");
const express = require("express");
const app = express();
require("dotenv").config({path: ".env"});
const PORT = process.env.PORT || 3000;
const date = new Date();
let id_count = 0;
const { createHash } = require('node:crypto');

const client = new Client({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT
});
client.connect();

app.use("/static", express.static(path.join(__dirname, "src")));
app.use(bodyParser.json());

app.get("/", function(req, res){
    res.sendFile(__dirname + "/src/html/index.html");
});
app.get("/mgmt", function(req, res){
    res.sendFile(__dirname + "/src/html/management.html");
});

// id生成
async function gen_id(){
    let today = date.getFullYear() + "/" + (date.getMonth() + 1).toString().padStart(2, "0") + "/" + date.getDate().toString().padStart(2, "0") + "-" + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds() + "-" + id_count;
    let sha256 = createHash('sha256');
    sha256.update(today);
    id_count++;
    return {error: "", result: sha256.digest('hex')};
}

// idを返す
app.get("/api/gen_id", async function(req, res){
    let result = await gen_id();
    await res.send(result);
});

// 自身のカウント
app.get("/api/own_value", async function(req, res){
    let today = date.getFullYear() + "/" + (date.getMonth() + 1).toString().padStart(2, "0") + "/" + date.getDate().toString().padStart(2, "0");
    let sql = {
        text: "SELECT SUM(n_count) FROM store_data WHERE c_id = $1 AND d_date = $2",
        values: [req.query.counter_id, today]
    };
    try{
        let result = await client.query(sql);
        if(result.rows[0].sum == null) {
            let genid = await gen_id();
            res.send({error: "", result: "", genid: genid.result});
        }else{
            res.send({error: "", result: result.rows[0].sum, genid: ""});
        }
    }catch(err){
        console.log(err);
        res.send({error: "dberror", result: "", genid: ""});
    }
});

// 合計
async function all_count(){
    let today = date.getFullYear() + "/" + (date.getMonth() + 1).toString().padStart(2, "0") + "/" + date.getDate().toString().padStart(2, "0");
    let sql = {
        text: "SELECT SUM(n_count) FROM store_data WHERE d_date = $1",
        values: [today]
    };
    try{
        let result = await client.query(sql);
        if (result.rows[0].sum == null){
            return {error: "", result: 0};
        }else{
            return {error: "", result: result.rows[0].sum};
        }
    }catch(err){
        console.log(err);
        return {error: "dberror", result: ""};
    }
}

// 合計を返す
app.get("/api/all_count", async function(req, res){
    let result = await all_count();
    await res.send(result);
});

// 加算し、自身のカウントを返す
app.put("/api/incr_count", async function(req, res){
    let today = date.getFullYear() + "/" + (date.getMonth() + 1).toString().padStart(2, "0") + "/" + date.getDate().toString().padStart(2, "0");
    let sql = {
        text: "INSERT INTO store_data (c_id, n_count) VALUES ($1, 1)",
        values: [req.body.counter_id]
    }
    let sql2 = {
        text: "SELECT SUM(n_count) FROM store_data WHERE c_id = $1 AND d_date = $2",
        values: [req.body.counter_id, today]
    };
    try{
        let result = await client.query(sql);
        let result2 = await client.query(sql2);
        res.send({error: "", result: result2.rows[0].sum, genid: ""});
    }catch(err){
        await res.send({result: "", errmsg: "dberror", genid: ""});
    }
});

// 減算し、自身のカウントを返す
app.put("/api/decr_count", async function(req, res){
    let today = date.getFullYear() + "/" + (date.getMonth() + 1).toString().padStart(2, "0") + "/" + date.getDate().toString().padStart(2, "0");
    let sql = {
        text: "INSERT INTO store_data (c_id, n_count) VALUES ($1, -1)",
        values: [req.body.counter_id]
    }
    let sql2 = {
        text: "SELECT SUM(n_count) FROM store_data WHERE c_id = $1 AND d_date = $2",
        values: [req.body.counter_id, today]
    };
    try{
        let result = await client.query(sql);
        let result2 = await client.query(sql2);
        res.send({error: "", result: result2.rows[0].sum, genid: ""});
    }catch(err){
        await res.send({result: "", errmsg: "dberror", genid: ""});
    }
});

// 履歴を返す
app.get("/api/history", async function(req, res){
    let today = date.getFullYear() + "/" + (date.getMonth() + 1).toString().padStart(2, "0") + "/" + date.getDate().toString().padStart(2, "0");
    let sql = {
        text: "SELECT * FROM store_data WHERE d_date = $1",
        values: [today]
    };
    let sql3 = {
        text: "SELECT d_date, SUM(n_count) FROM store_data WHERE d_date != $1 GROUP BY d_date ORDER BY d_date",
        values: [today]
    };
    try{
        let result = await client.query(sql);
        let result2 = await all_count();
        let result3 = await client.query(sql3);
        res.send({error: "", result: result.rows, result2: result2.result, result3: result3.rows});
    }catch(err){
        console.log(err);
        res.send({error: "dberror", result: ""});
    }
});

app.listen(PORT, function(){
    console.log("server on port %d", PORT);
});