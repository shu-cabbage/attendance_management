# 運営入場カウンタ
## About
入場数をカウントする

## Install
mysqlをインストールする。  
databaseとtableを作る。  
以下macでのコマンド。  
```sh
mysql> CREATE DATABASE counter;
mysql> USE counter;
mysql> CREATE TABLE users (id INT AUTO_INCREMENT, date TEXT, tagId TEXT, count INT UNSIGNED, PRIMARY KEY (id));
```  
git cloneする。  
``npm install``

## Use
使い方とセッティング  
i7MBPでのみ確認済み
### サーバ側
envファイルにデータベースのログイン項目を書く。  
``node server.js``で走らせる。
### 管理側
管理画面では本日分の合計入場者数、一時間毎の入場者数と過去の合計入場者数を表示する。  
### カウンタ側
ボタンを押すたびにカウントされていく。  
デバイスはデバイス毎のカウントが表示される。  