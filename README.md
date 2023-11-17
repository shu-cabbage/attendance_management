# 運営入場カウンタ
## About
入場数をカウントする。  
高専祭運営が使うWebApp。

## Install
mysql、nginx、node.jsをインストールする。  
`$ sudo apt install -y mysql-server nginx nodejs npm`

### mysql
最初にセキュリティスクリプトを実行する。  
`$ sudo mysql_secure_installation`  
色々聞かれるけど、だいたいYesでいいと思う。  

次に、`$ sudo mysql`でrootでログインする。  
mysqlのuserを作成する。  
```sql
> CREATE USER 'new user'@'localhost' IDENTIFIED BY 'new user password';
> GRANT ALL PRIVILEGES ON * . * TO 'new user'@'localhost';
> FLUSH PRIVILEGES;
> ALTER USER 'new user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'new user password';
```

### node.js
node jsのインストールはちょっとクセがある。  
もっと楽なやり方があるのかもしれない。  
```sh
$ sudo npm install -g n
$ sudo n stable
$ sudo apt purge -y nodejs npm
```

## Use
使い方とセッティング  
サーバサイドは、M2pro macmini、i7 MBP、ubuntu serverで確認済み。  
クライアントサイドは、iPhone XR、iPhone 7、Xiaomi Mi 11 Lite 5Gで確認済み。  
### サーバ側
mysqlにdatabaseとtableを作る。  
database名とtable名を変えてもいいが、もれなくコードも変える必要が出てくるので、このままを推奨。  
```sql
> CREATE DATABASE counter;
> USE counter;
> CREATE TABLE users (id INT AUTO_INCREMENT, date TEXT, count INT UNSIGNED, PRIMARY KEY (id));
```  
nginx.confにlocationを追記する。  
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
git cloneしてディレクトリ移動して、`$ npm install`。  
envファイルに上で設定したデータベースのログイン項目を書く。  
`$ node server.js`で走らせる。  
カウンタのurlは、http(s)://<ドメイン>/counter/  
管理画面のurlは、http(s)://<ドメイン>/counter/mgmt/  

### 管理側
管理画面では本日分の合計入場者数、一時間毎の入場者数と過去の合計入場者数を表示している。  

### カウンタ側
ボタンを押せはカウントされていく。  
減算ボタンがあり、これはカウントを減らす。  
ボタンの中にデバイス毎のカウントが表示され、上部に総入場者数が表示される。  