# 運営入場カウンタ
## About
入場数をカウントする

## Install
mysqlをインストールする。  
userを作成する。  
まずrootでログインする。  
```sh
mysql> CREATE USER 'new user'@'localhost' IDENTIFIED BY 'new user password';
mysql> GRANT ALL PRIVILEGES ON * . * TO 'new user'@'localhost';
mysql> FLUSH PRIVILEGES;
mysql> ALTER USER 'new user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'new user password';
```
databaseとtableを作る。  
```sh
mysql> CREATE DATABASE counter;
mysql> USE counter;
mysql> CREATE TABLE users (id INT AUTO_INCREMENT, date TEXT, tagId TEXT, count INT UNSIGNED, PRIMARY KEY (id));
```  
git cloneする。  
``npm install``

## Use
使い方とセッティング  
M2pro macmini、i7 MBP、ubuntu serverでのみ確認済み
### サーバ側
envファイルにデータベースのログイン項目を書く。  
``node server.js``で走らせる。
### 管理側
管理画面では本日分の合計入場者数、一時間毎の入場者数と過去の合計入場者数を表示する。  
### カウンタ側
ボタンを押すたびにカウントされていく。  
デバイスはデバイス毎のカウントが表示される。  