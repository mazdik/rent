var Jimp = require("jimp");

function save(url) {
    Jimp.read(url, function(err, image) {
        if (err) throw err;
        //let file = "new_name." + image.getExtension();
        //console.log(image.getMIME(), image.getExtension());
        image.quality(70) // set JPEG quality
            .greyscale() // set greyscale
            .write("images/d.jpg"); // save
        /* Превюшка */
        image.resize(200, 200) // resize
            .quality(70) // set JPEG quality
            .autocrop()
            .write("images/thumb_d.jpg");
    });
}

save("https://00.img.avito.st/shop/item/1280x960/3171065900.jpg");