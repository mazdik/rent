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
curl --silent --location https://rpm.nodesource.com/setup_6.x | bash -
yum -y install nodejs
yum install ImageMagick*
yum install git
npm install phantomjs -g

# Проверки
npm -v
node -v
phantomjs -v
convert -version
git --version

git clone https://github.com/mazdik/rent.git
cd rent
npm install
# Поменять настройки в файле settings.json
node rent.js
```
