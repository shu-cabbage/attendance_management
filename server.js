const mysql = require("mysql");
const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const app = express();
const server = http.Server(app);
const io = socketio(server);
const fs = require('fs');
const PORT = process.env.PORT || 3001;
require("dotenv").config();
let status = false;

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/src/index.html");
});
app.get("/mgmt", (req, res) => {
    res.sendFile(__dirname + "/src/management.html");
});

app.use(express.static(__dirname + "/src"));
app.use(express.static(__dirname));

server.listen(PORT, () => {
    console.log("server on port %d", PORT);
});

/* データベース接続 */
const connection = mysql.createConnection({
    host: '127.0.0.1',
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE
});
connection.connect((err) => {
    if(err){
        console.log('errpr connecting: ' + err.stack);
        return;
    }
    console.log('success');
});

io.on("connection", (socket) => {
    // console.log("connection: ", socket.id);
    socket.on("no_cookie", function(){ //counterの個別id生成，登録
        let date = new Date();
        let today = date.getMonth() + 1 + "/" + date.getDate();
        let newUser = {
            date: today,
            count: 0
        };
        connection.query('INSERT INTO users SET ?', newUser, (err, res) => {
            if(err) throw err;
            socket.emit("id_cookie", res.insertId);
        });
    });
    socket.on("get_own_value", function(data){ //再読み込みで自分のカウントを送信
        connection.query('SELECT * FROM users WHERE id = ?', [data.id], (err, result) => {
            socket.emit("own_num", result[0].count);
        });
    });
    socket.on("admission", async function(data){ //counter加算
        if(!status){
            let  masterData = JSON.parse(fs.readFileSync("./admission_control.json", "utf8"));
            status = true;
            let date = new Date();
            date.setHours(date.getHours());
            // date.setHours(date.getHours() + 9);
            let hour = date.getHours().toString().padStart(2, "0");
            let minutes = date.getMinutes().toString().padStart(2, "0");
            masterData.begin_time = {hour: hour, min: minutes}
            masterData.per_hour.splice(0, 8);
            io.emit("send_start_hour", {hour: hour, min: minutes});
            fs.writeFileSync("admission_control.json", JSON.stringify(masterData, null, "    "));
            await number_of_peple_per_hour();
        }
        connection.query('UPDATE users SET count = ? Where id = ?',
            [data.count, data.id],
            (err, result) => {
                if(err) throw err;
            }
        );
    });
    socket.on("get_history", function(){ //managementへ総入場者数と履歴送信
        let json_ally = JSON.parse(fs.readFileSync("./admission_control.json", "utf8"));
        socket.emit("send_start_hour", {hour: json_ally.begin_time.hour, min: json_ally.begin_time.min, per_hour_data: json_ally.per_hour});
        connection.query('SELECT * FROM users', (err, result) => {
            let count_admission = 0;
            let data = [];
            let date = new Date();
            let today = date.getMonth() + 1 + "/" + date.getDate();
            // console.log(result);
            for(let i = 0; i < result.length; i++){
                if(result[i].date == today){
                    count_admission += result[i].count;
                }else{
                    if(data.length != 0){
                        let length = data.length
                        for(let j = 0; j < length; j++){
                            if(data[j].date == result[i].date){
                                data[j].count += result[i].count;
                                break;
                            }else if(j == data.length - 1){
                                data.push({date: result[i].date, count: result[i].count});
                            }
                        }
                    }else{
                        data.push({date: result[i].date, count: result[i].count});
                    }
                    
                }
            }
            socket.emit("all_num", count_admission);
            socket.emit("history_data", data);
        });
    });
    socket.on("get_all_count", function(){
        connection.query('SELECT * FROM users', (err, result) => {
            let count_admission = 0;
            let date = new Date();
            let today = date.getMonth() + 1 + "/" + date.getDate();
            // console.log(result);
            for(let i = 0; i < result.length; i++){
                if(result[i].date == today){
                    count_admission += result[i].count;
                }
            }
            socket.emit("all_num", count_admission);
        });
    });
});

let per_time = 1000*60*60; //1h
// let per_time = 1000 * 5;
async function number_of_peple_per_hour(){
    let per_hour_count = 0;
    let interval = setInterval(() => {
        let date = new Date();
        let today = date.getMonth() + 1 + "/" + date.getDate();
        let data_per_hour = JSON.parse(fs.readFileSync("./admission_control.json", "utf8"));
        let value = 0;
        if(!"per_hour" in data_per_hour){
            data_per_hour.per_hour = [];
        }
        connection.query('SELECT * FROM users', (err, result) => {
            for(let i = 0; i < result.length; i++){
                if(result[i].date == today){
                    value += result[i].count;
                }
            }
            // console.log("total: ", value);
    
            let total_per_hour = 0;
            if(data_per_hour.per_hour.length != 0){
                for(let i = 0; i < per_hour_count; i++){
                    total_per_hour += data_per_hour.per_hour[i];
                }
            }
    
            // console.log("per: ", total_per_hour);
            let diff = value - total_per_hour;
            // console.log("diff: ", diff);
            data_per_hour.per_hour.push(diff);
            io.emit("number_of_people_per_hour", {index: per_hour_count, number_of_people: diff});
            fs.writeFileSync("./admission_control.json", JSON.stringify(data_per_hour, null, "    "));
            per_hour_count++;
            //毎時間の人数を出す，各時間帯をjsonに保存しておく(管理画面から読み込んでも見れるようにする)，全部の合計からこれまでの時間帯の合計を引く．この関数が呼び出された時各時間帯jsonを初期化する．
            if(per_hour_count > 7){
                clearInterval(interval);
                interval = null;
                per_hour_count = 0;
                status = false;
            }
        });
    }, per_time);
}