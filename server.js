const sqlite3 = require("sqlite3");
const db = new sqlite3.Database("counter.db");
const express = require("express");
const http = require("http");
const socketio = require("socket.io");
const app = express();
const server = http.Server(app);
const io = socketio(server);
const fs = require('fs');
const PORT = process.env.PORT || 3001;
let status = false;

app.get("/", function(req, res){
    res.sendFile(__dirname + "/src/index.html");
});
app.get("/mgmt", function(req, res){
    res.sendFile(__dirname + "/src/management.html");
});

app.use(express.static(__dirname + "/src"));
app.use(express.static(__dirname));
server.listen(PORT, function(){
    console.log("server on port %d", PORT);
});

io.on("connection", function(socket){
    // console.log("connection: ", socket.id);
    socket.on("no_cookie", function(){ //counterの個別id生成，登録
        let date = new Date();
        let today = (date.getMonth() + 1).toString().padStart(2, "0") + "/" + date.getDate().toString().padStart(2, "0");
        db.run("INSERT INTO users (date, count) VALUES (?, ?)", today, 0, function(err){
            if(err) throw err;
            socket.emit("id_cookie", this.lastID);
        });
    });

    socket.on("get_own_value", function(data){ //再読み込みで自分のカウントを送信
        db.all("SELECT * FROM users WHERE id=?", data.id, function(err, rows){
            let date = new Date();
            let today = (date.getMonth() + 1).toString().padStart(2, "0") + "/" + date.getDate().toString().padStart(2, "0");
            let ownCount = 0;
            if(rows[0].date != today){
                let date = new Date();
                let today = (date.getMonth() + 1).toString().padStart(2, "0") + "/" + date.getDate().toString().padStart(2, "0");
                db.run("INSERT INTO users (date, count) VALUES (?, ?)", today, 0, function(err){
                    if(err) throw err;
                    socket.emit("id_cookie", this.lastID);
                });
            }else{
                ownCount = rows[0].count;
            }
            socket.emit("own_num", ownCount);
        });
    });

    socket.on("admission", async function(data){ //counter加算
        if(!status){
            status = true;
            let  masterData = JSON.parse(fs.readFileSync("./admission_control.json", "utf8"));
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
        db.run("UPDATE users SET count=? WHERE id=?", data.count, data.id);
    });

    socket.on("get_history", function(){ //managementへ総入場者数と履歴送信
        let json_ally = JSON.parse(fs.readFileSync("./admission_control.json", "utf8"));
        socket.emit("send_start_hour", {hour: json_ally.begin_time.hour, min: json_ally.begin_time.min, per_hour_data: json_ally.per_hour});
        db.all("SELECT * FROM users", function(err, rows){
            let count_admission = 0;
            let data = [];
            let date = new Date();
            let today = (date.getMonth() + 1).toString().padStart(2, "0") + "/" + date.getDate().toString().padStart(2, "0");
            for(let i = 0; i < rows.length; i++){
                if(rows[i].date == today){
                    count_admission += rows[i].count;
                }else if(data.length != 0){
                    let length = data.length
                    for(let j = 0; j < length; j++){
                        if(data[j].date == rows[i].date){
                            data[j].count += rows[i].count;
                            break;
                        }else if(j == data.length - 1){
                            data.push({date: rows[i].date, count: rows[i].count});
                        }
                    }
                }else{
                    data.push({date: rows[i].date, count: rows[i].count});
                }
            }
            socket.emit("all_num", count_admission);
            socket.emit("history_data", data);
        });
    });

    socket.on("get_all_count", function(){
        db.all("SELECT * FROM users", function(err, rows){
            let count_admission = 0;
            let date = new Date();
            let today = (date.getMonth() + 1).toString().padStart(2, "0") + "/" + date.getDate().toString().padStart(2, "0");
            for(let i = 0; i < rows.length; i++){
                if(rows[i].date == today) count_admission += rows[i].count;
            }
            socket.emit("all_num", count_admission);
        });
    });
});

let per_time = 1000*60*60; //1h
async function number_of_peple_per_hour(){
    let per_hour_count = 0;
    let interval = setInterval(function(){
        let date = new Date();
        let today = (date.getMonth() + 1).toString().padStart(2, "0") + "/" + date.getDate().toString().padStart(2, "0");
        let data_per_hour = JSON.parse(fs.readFileSync("./admission_control.json", "utf8"));
        let value = 0;
        if(!"per_hour" in data_per_hour) data_per_hour.per_hour = [];
        db.all("SELECT * RFOM users", function(err, rows){
            for(let i = 0; i < rows.length; i++){
                if(rows[i].date == today) value += rows[i].count;
            }
    
            let total_per_hour = 0;
            if(data_per_hour.per_hour.length != 0){
                for(let i = 0; i < per_hour_count; i++){
                    total_per_hour += data_per_hour.per_hour[i];
                }
            }
    
            let diff = value - total_per_hour;
            data_per_hour.per_hour.push(diff);
            io.emit("number_of_people_per_hour", {index: per_hour_count, number_of_people: diff});
            fs.writeFileSync("./admission_control.json", JSON.stringify(data_per_hour, null, "    "));
            per_hour_count++;
            //毎時間の人数を出す
            if(per_hour_count > 7){
                clearInterval(interval);
                interval = null;
                per_hour_count = 0;
                status = false;
            }
        });
    }, per_time);
}