# rent

## Quick start
```bash
git clone https://github.com/mazdik/rent.git
cd rent
npm install
# Поменять настройки в файле settings.json
node rent.js
```

## Node.js
Download and install [Node.js](https://nodejs.org)

## ImageMagick
Download and install [ImageMagick](http://www.imagemagick.org/)

## PhantomJS
Download and install [PhantomJS](http://phantomjs.org/)

## Пример установки на CentOS 7
```bash
yum install fontconfig freetype freetype-devel fontconfig-devel libstdc++
yum install gcc-c++ make
yum -y install bzip2
curl --silent --location https://rpm.nodesource.com/setup_7.x | bash -
yum -y install nodejs
yum install ImageMagick*
yum install git
npm install phantomjs -g
```

## Пример установки на Linux Mint
```bash
curl -sL https://deb.nodesource.com/setup_7.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y build-essential
sudo apt install ImageMagick*
sudo apt install git
sudo npm install phantomjs -g
```

## Пример установки на Debian 7
```bash
sudo apt-get install -y build-essential
wget https://nodejs.org/dist/v7.6.0/node-v7.6.0-linux-x64.tar.xz
cd /usr/local
tar --strip-components 1 -xJf node-v7.6.0-linux-x64.tar.xz
sudo apt-get install ImageMagick*
sudo apt-get install git
sudo npm install phantomjs -g
```

## Проверки
```bash
npm -v
node -v
phantomjs -v
convert -version
git --version
```

## Настройки (settings.json)
"db_host": 			  хост бд
"db_user": 			  имя бд
"db_password": 		пользователь бд
"db_database": 		пароль бд
"db_connlimit": 	максимальное количество подключений к бд
"city": 			    город
"category": 		  категория (kvartiry - квартиры, komnaty - комнаты, doma_dachi_kottedzhi - дома)
"oper": 			    тип объявления (sdam - сдам, prodam - продам)
"object_type": 		Срок аренды (na_dlitelnyy_srok/posutochno) или Вид объекта для продажи (novostroyka/vtorichka)
"limit_images": 	максимальное количество фотографий
"limit_pages": 		максимальное количество страниц, на 1 старнице 50 объявлений
"pmin": 			    цена от
"pmax": 			    цена до 
"with_images": 		только с фото (1 - да, 0 - все)
"query": 			    слова для поиска по объявлениям
"exclude": 			  слова исключения (через запятую)
"commission": 		1 - без комиссии
"proxy": 			    адрес:порт от прокси
"proxyuserpwd": 	пользователь:пароль от прокси
"user": 			    0 - Все, 1 - Частные, 2 - Агентства
"crop": 			    обрезка фото в процентах, оставлять 91% сверху и удалить 9% снизу
"post_status": 		1 - Опубликовано, 2 - Черновик, 3 - Архив
"post_user": 		  id пользователя
"account_username": ваш логин от авито
"account_password": ваш пароль от авито
"images_dir": 		полный путь к директории фотографий сайта
"watermark": 		  полный путь на водяной знак
"sleep_delay": 		задержка в милисекундах
"chrome": 			  браузер (1 - вкл, 0 - выкл)
"firefox": 			  браузер (1 - вкл, 0 - выкл)
"phantomjs": 		  браузер (1 - вкл, 0 - выкл)
