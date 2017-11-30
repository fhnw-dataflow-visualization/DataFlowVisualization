# Dataflow visualization dev

## Installing node moduls
Make sure you have installed `browserify`
```
npm install -g browserify
``` 
Install `modul` with `npm`
```
npm install modul
``` 
Define modul in `NodeLibs.js`.
Bundle to browser ready js file
```
browserify NodeLibs.js -o src/main/assets/javascript/Bundle.js
``` 
Make sure you have imported the new file `<script src="./assets/javascript/Bundle.js" type="text/javascript"></script>`
