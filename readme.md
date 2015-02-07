#Waterlee 2.0.0 Magento responsive Sass based boilerplate

 - Built on Inuit.css v5.0.1 & Magento 1.9.1
 
###It includes:

 - [Inuit.css](https://github.com/csswizardry/inuit.css/) - Powerful, scalable, Sass-based, BEM, OOCSS framework.
 - [Font Awesome](http://fortawesome.github.io/Font-Awesome/)
 - Modernizr
 - jQuey 2.1.1
 - Easy tabs Magento extension
 - Responsive tables & grid
 - Top Cart
 - Category page grid/list icons
 - Inchoo global messages
 - [Elevatezoom](http://www.elevateweb.co.uk/image-zoom) for product page images
 - Open Sans fonts
 - Cross-browser selects
 - [Flexslider](http://www.woothemes.com/flexslider/)
 - Increase/Decrease quantity buttons
 - Scroll to top
 - Modman support

###Coming soon

 - Mobile menu

###Things you'll need to have:

 - [NodeJS](http://nodejs.org/) - download & install
 - [Gulp](https://github.com/gulpjs/gulp) - `$ npm install -g gulp`
 - [Bower](http://bower.io/) - `$ npm install -g bower`

###Installation:

 - Clone this repo or download it
 - Inside the skin/frontend/waterlee-boilerplate/default run `npm install` to install node_modules locally
 - Run `bower install` to install bower_components

####Usage:
Run this in shell and you'll get CSS injection into your browser, file watching, browser synchronisation, concatenation, minification, sourcemaps ...
```shell
$ gulp
```
 - In gulpfile.js you can easily switch between development and production environment.
 - Here is the inuit.css unofficial site that will help you to get started with it [http://terabytenz.github.io/inuit.css-kitchensink/#media](http://terabytenz.github.io/inuit.css-kitchensink/#media)
 - Inuit components are turning on/off at the end of _vars.scss file which can be found @ src/scss/custom

That's it. We tried to organise this thing and put features you will gonna use. Yes, it's ugly and it's small, like boilerplate needs to be. Less things to override, the better. That's why we have choosen Foundation over Bootstrap, Inuit.css over Foundation.

