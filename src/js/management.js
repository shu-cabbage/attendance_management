const serverUrl = location.pathname.split("/")[1] == "counter" ? location.protocol + "//" + location.host + "/" + location.pathname.split("/")[1] + "/" : location.protocol + "//" + location.host + "/";
let table = document.getElementById("history");
const all_enter = document.getElementById("all_enter");

window.addEventListener("DOMContentLoaded", function(){
    auto_get_count();
});

function update_display(){
    let req_url = `${serverUrl}api/history`;
    fetch(req_url).then(function(res){
        return res.json();
    }).then(function(result){
        //一時間ごと表示の時間の計算
        let total_per_hour = result.result;
        let per_hour_num = {h_0: 0, h_1: 0, h_2: 0, h_3: 0, h_4: 0, h_5: 0, h_6: 0, h_7: 0, h_8: 0};
        for (let i = 0; i < total_per_hour.length; i++){
            let hour = total_per_hour[i].d_time.split(":")[0]
            switch(hour){
                case "9":
                    per_hour_num.h_0+=total_per_hour[i].n_count;
                    break;
                case "10":
                    per_hour_num.h_1+=total_per_hour[i].n_count;
                    break;
                case "11":
                    per_hour_num.h_2+=total_per_hour[i].n_count;
                    break;
                case "12":
                    per_hour_num.h_3+=total_per_hour[i].n_count;
                    break;
                case "13":
                    per_hour_num.h_4+=total_per_hour[i].n_count;
                    break;
                case "14":
                    per_hour_num.h_5+=total_per_hour[i].n_count;
                    break;
                case "15":
                    per_hour_num.h_6+=total_per_hour[i].n_count;
                    break;
                case "16":
                    per_hour_num.h_7+=total_per_hour[i].n_count;
                    break;
                case "17":
                    per_hour_num.h_8+=total_per_hour[i].n_count;
                    break;
                default:
                    break;
            }
        }
        for(let i = 0; i < 9; i++){
            let number_of_visitors = document.getElementById("number_of_people_" + i);
            if (per_hour_num["h_" + i] == 0){
                number_of_visitors.textContent = "";
            }else{
                number_of_visitors.textContent = per_hour_num["h_" + i];
            }
        }

        //総入場者数表示
        let todays_total = result.result2;
        all_enter.textContent = todays_total;

        //過去の入場者数表示
        let history = result.result3;
        table.textContent = "";//tableを初期化
        for(let i = 0; i < history.length; i++){
            let tr = document.createElement("tr");

            let td0 = document.createElement("td");//日付
            let dates = new Date(history[i].d_date);
            let date = dates.getFullYear() + "/" + dates.getMonth().toString().padStart(2, "0") + "/" + dates.getDate().toString().padStart(2, "0")
            td0.textContent = date;
            let td1 = document.createElement("td");//人数
            td1.textContent = history[i].sum;

            tr.appendChild(td0);
            tr.appendChild(td1);
            table.appendChild(tr);
        }
    }).catch(function(err){
        console.log(err);
    });
}

let auto_time = 1000 * 60 * 5;//5分
function auto_get_count(){//5分ごとに総入場者数を更新
    update_display();
    let interval = setInterval(function(){
        update_display();
    }, auto_time);
}