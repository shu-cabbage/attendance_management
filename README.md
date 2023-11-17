# 運営入場カウンタ
## About
入場数をカウントする

## Install
mysql、nginxをインストールする。  
mysqlのuserを作成する。  
まずrootでログインする。  
```sql
mysql> CREATE USER 'new user'@'localhost' IDENTIFIED BY 'new user password';
mysql> GRANT ALL PRIVILEGES ON * . * TO 'new user'@'localhost';
mysql> FLUSH PRIVILEGES;
mysql> ALTER USER 'new user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'new user password';
```
databaseとtableを作る。  
```sql
mysql> CREATE DATABASE counter;
mysql> USE counter;
mysql> CREATE TABLE users (id INT AUTO_INCREMENT, date TEXT, count INT UNSIGNED, PRIMARY KEY (id));
```  
nginx.confにlocationを書く。  
```nginx
location /counter/ {
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header Host $host;
    proxy_pass http://localhost:3001/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```
git cloneして、
``npm install``

## Use
使い方とセッティング  
M2pro macmini、i7 MBP、ubuntu serverで確認済み
### サーバ側
envファイルにデータベースのログイン項目を書く。  
``node server.js``で走らせる。
### 管理側
管理画面では本日分の合計入場者数、一時間毎の入場者数と過去の合計入場者数を表示する。  
### カウンタ側
ボタンを押すたびにカウントされていく。  
デバイスはデバイス毎のカウントが表示される。  