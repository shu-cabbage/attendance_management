# 運営入場カウンタ
## About
入場数をカウントする。  
高専祭運営が使うWebApp。

## Install
PostgreSQL、nginx、node.jsをインストールする。  
`$ sudo apt install -y nginx nodejs npm postgresql`

### PostgreSQL
DBの初期化をする。  
`initdb -E UTF8 --locale=C`  

次に、`$ sudo - postgres`でrootでログインする。  
`$ psql`でDBにログインする。  
PostgreSQLのロールを作成する。  
```postgresql
postgres=# CREATE USER user_counter WITH PASSWORD 'password';
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
- データベース作成
```postgresql
postgres=# CREATE DATABASE a_counter;
postgres=# ALTER DATABASE a_counter OWNER TO user_counter;
postgres=# \c a_counter
```
- テーブル作成
```sql
a_counter=> CREATE TABLE store_data (c_id TEXT, n_count INT NOT NULL, d_date DATE NOT NULL DEFAULT CURRENT_TIMESTAMP, d_time TIME (0) NOT NULL DEFAULT CURRENT_TIMESTAMP);
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
`$ node server.js`で走らせる。  
カウンタのurlは、http(s)://<ドメイン>/counter/  
管理画面のurlは、http(s)://<ドメイン>/counter/mgmt/  

### 管理側
管理画面では本日分の合計入場者数、一時間毎の入場者数と過去の合計入場者数を表示している。  

### カウンタ側
ボタンを押せはカウントされていく。  
減算ボタンがあり、これはカウントを減らす。  
ボタンの中にデバイス毎のカウントが表示され、上部に総入場者数が表示される。  