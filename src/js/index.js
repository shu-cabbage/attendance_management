const serverUrl = location.pathname.split("/")[1] == "counter" ? location.protocol + "//" + location.host + "/" + location.pathname.split("/")[1] + "/" : location.protocol + "//" + location.host + "/";
const admission_num = document.getElementById("admission_num");
const all_admission_num = document.getElementById("all_admission_num");
let device_id = "a";

function write_cookie(id){
    document.cookie = "id=" + id + ";max-age=" + 60*60*23;
    document.getElementById("device_id").textContent = device_id = id;
}

// 自身のカウント数表示
function update_count(req_url, options){
    fetch(req_url, options).then(function(res){
        return res.json();
    }).then(function(result){
        if (result.genid == ""){
            admission_num.textContent = result.result;
        }else{
            admission_num.textContent = 0;
            write_cookie(result.genid);
        }
    }).catch(function(err){
        console.log(err);
    });
}

window.addEventListener("DOMContentLoaded", function(){
    if(document.cookie == "") {
        let req_url = `${serverUrl}api/gen_id`;
        fetch(req_url).then(function(res){
            return res.json();
        }).then(function(result){
            write_cookie(result.result);
        }).catch(function(err){
            console.log(err);
        });
    }else{
        document.getElementById("device_id").textContent = device_id = document.cookie.split("=")[1];
        let req_url = `${serverUrl}api/own_value?counter_id=${device_id}`;
        let options = { method: 'GET' };
        update_count(req_url, options);
    }
    auto_get_count();
});

// 加算
function btn_admission(){
    let req_url = `${serverUrl}api/incr_count`;
    let options = {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({counter_id: device_id})
    };
    update_count(req_url, options);
    all_count();
}

// 減算
function btn_subtraction(){
    let req_url = `${serverUrl}api/decr_count`;
    let options = {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({counter_id: device_id})
    };
    update_count(req_url, options);
    all_count();
}

// 合計
function all_count(){
    let req_url = `${serverUrl}api/all_count`;
    fetch(req_url).then(function(res){
        return res.json();
    }).then(function(result){
        all_admission_num.textContent = result.result;
    }).catch(function(err){
        console.log(err);
    });
}

//5分ごとに総入場者数を更新
let auto_time = 1000 * 60 * 5;//5分
function auto_get_count(){
    all_count();
    let interval = setInterval(function(){
        all_count();
    }, auto_time);
}